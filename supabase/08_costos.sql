-- =====================================================================
-- 08_costos.sql — Costo por producto y ganancia real
-- Ejecutar en el SQL Editor de Supabase después de 07_arreglo_pin.sql.
-- Es idempotente: se puede correr varias veces sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Costo del producto (lo que le cuesta al negocio prepararlo)
-- ---------------------------------------------------------------------
alter table productos add column if not exists costo int;
alter table productos drop constraint if exists productos_costo_no_negativo;
alter table productos add constraint productos_costo_no_negativo check (costo is null or costo >= 0);

comment on column productos.costo is
  'Costo de preparar una unidad. Vacío = el negocio todavía no lo cargó; ese producto no cuenta para la ganancia.';

-- ---------------------------------------------------------------------
-- 2. Costo congelado en cada línea vendida
-- ---------------------------------------------------------------------
-- Se guarda el costo del día de la venta. Si mañana sube la carne, los
-- pedidos viejos siguen mostrando la ganancia que de verdad tuvieron.
alter table pedido_items add column if not exists costo_unitario int;

comment on column pedido_items.costo_unitario is
  'Costo del producto en el momento de la venta. Null = el producto no tenía costo cargado.';

-- ---------------------------------------------------------------------
-- 3. guardar_pedido copia el costo al insertar cada línea
-- ---------------------------------------------------------------------
-- Igual que en 06_multinegocio.sql; lo único nuevo es costo_unitario.
-- Nota honesta: el costo es por producto. Si se vende en combo, lo que
-- cuesta el acompañamiento no se descuenta, así que el margen del combo
-- se ve mejor de lo que es.
create or replace function guardar_pedido(p_pedido jsonb, p_items jsonb)
returns bigint language plpgsql security invoker as $$
declare
  v_id           bigint := nullif(p_pedido ->> 'id', '')::bigint;
  v_negocio      uuid;
  v_empleado     uuid := nullif(p_pedido ->> 'empleado_id', '')::uuid;
  v_subtotal     int := 0;
  v_es_domicilio boolean := coalesce((p_pedido ->> 'es_domicilio')::boolean, true);
  v_origen       origen_pedido := coalesce((p_pedido ->> 'origen')::origen_pedido, 'manual');
  v_revisado     boolean := coalesce((p_pedido ->> 'revisado')::boolean, true);
  v_texto        text := nullif(trim(coalesce(p_pedido ->> 'texto_original', '')), '');
  v_cargos       jsonb := '[]'::jsonb;
  v_total_cargos int := 0;
  v_anterior     jsonb;
  v_item         jsonb;
  v_cargo        record;
  v_unidades     int;
  v_valor        int;
begin
  -- Negocio: por clave de integración (bot) o por id (app)
  if coalesce(p_pedido ->> 'negocio_clave', '') <> '' then
    select id into v_negocio from negocios where clave_integracion = (p_pedido ->> 'negocio_clave')::uuid;
    if v_negocio is null then raise exception 'Clave de integración inválida'; end if;
  elsif v_id is not null then
    select negocio_id into v_negocio from pedidos where id = v_id;
  else
    v_negocio := nullif(p_pedido ->> 'negocio_id', '')::uuid;
  end if;
  if v_negocio is null then raise exception 'Falta el negocio del pedido'; end if;
  if not exists (select 1 from negocios where id = v_negocio and activo) then
    raise exception 'Este negocio está desactivado';
  end if;
  if v_empleado is not null and not exists (select 1 from empleados where id = v_empleado and negocio_id = v_negocio) then
    v_empleado := null;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto';
  end if;
  if coalesce(trim(p_pedido ->> 'cliente_nombre'), '') = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;

  -- Subtotal
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (v_item ->> 'precio_unitario')::int * (v_item ->> 'cantidad')::int;
  end loop;

  -- Cargos del negocio
  for v_cargo in select * from cargos where negocio_id = v_negocio and activo order by orden, id loop
    v_valor := 0;
    if v_cargo.tipo = 'por_pedido' then
      if not v_cargo.solo_domicilio or v_es_domicilio then v_valor := v_cargo.valor; end if;
    else
      select coalesce(sum((i ->> 'cantidad')::int), 0) into v_unidades
        from jsonb_array_elements(p_items) i
       where (i ->> 'categoria_nombre') in (select nombre from categorias where negocio_id = v_negocio and id = any (v_cargo.categorias));
      v_valor := v_unidades * v_cargo.valor;
    end if;
    if v_valor > 0 then
      v_cargos := v_cargos || jsonb_build_object('nombre', v_cargo.nombre, 'valor', v_valor);
      v_total_cargos := v_total_cargos + v_valor;
    end if;
  end loop;

  if v_id is null then
    insert into pedidos (negocio_id, empleado_id, cliente_nombre, cliente_telefono, metodo_pago, es_domicilio, notas,
                         subtotal, cargos, total_cargos, total, tomado_por, origen, revisado, texto_original)
    values (v_negocio, v_empleado, trim(p_pedido ->> 'cliente_nombre'),
            nullif(regexp_replace(coalesce(p_pedido ->> 'cliente_telefono', ''), '\D', '', 'g'), ''),
            coalesce((p_pedido ->> 'metodo_pago')::metodo_pago, 'efectivo'),
            v_es_domicilio, nullif(trim(coalesce(p_pedido ->> 'notas', '')), ''),
            v_subtotal, v_cargos, v_total_cargos, v_subtotal + v_total_cargos, auth.uid(),
            v_origen, v_revisado, v_texto)
    returning id into v_id;
  else
    select jsonb_build_object(
             'pedido', to_jsonb(p) - 'tomado_por',
             'items', (select coalesce(jsonb_agg(to_jsonb(i) - 'id' - 'pedido_id'), '[]'::jsonb)
                         from pedido_items i where i.pedido_id = p.id))
      into v_anterior
      from pedidos p where p.id = v_id;
    if v_anterior is null then raise exception 'Pedido % no existe', v_id; end if;

    update pedidos set
      empleado_id      = coalesce(v_empleado, empleado_id),
      cliente_nombre   = trim(p_pedido ->> 'cliente_nombre'),
      cliente_telefono = nullif(regexp_replace(coalesce(p_pedido ->> 'cliente_telefono', ''), '\D', '', 'g'), ''),
      metodo_pago      = coalesce((p_pedido ->> 'metodo_pago')::metodo_pago, metodo_pago),
      es_domicilio     = v_es_domicilio,
      notas            = nullif(trim(coalesce(p_pedido ->> 'notas', '')), ''),
      subtotal         = v_subtotal,
      cargos           = v_cargos,
      total_cargos     = v_total_cargos,
      total            = v_subtotal + v_total_cargos,
      editado_en       = now(),
      revisado         = true,
      revisado_en      = coalesce(revisado_en, now())
    where id = v_id;
    if not found then raise exception 'Pedido % no existe', v_id; end if;

    delete from pedido_items where pedido_id = v_id;
  end if;

  insert into pedido_items (pedido_id, producto_id, nombre, categoria_nombre, precio_unitario, costo_unitario,
                            cantidad, es_combo, exclusiones, nota, es_personalizado)
  select v_id,
         nullif(i ->> 'producto_id', '')::int,
         i ->> 'nombre',
         i ->> 'categoria_nombre',
         (i ->> 'precio_unitario')::int,
         (select pr.costo from productos pr
           where pr.id = nullif(i ->> 'producto_id', '')::int and pr.negocio_id = v_negocio),
         (i ->> 'cantidad')::int,
         coalesce((i ->> 'es_combo')::boolean, false),
         coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(i -> 'exclusiones', '[]'::jsonb)) x), '{}'),
         nullif(trim(coalesce(i ->> 'nota', '')), ''),
         coalesce((i ->> 'es_personalizado')::boolean, false)
    from jsonb_array_elements(p_items) i;

  insert into pedido_eventos (negocio_id, pedido_id, tipo, datos, por)
  values (v_negocio, v_id,
          case when v_anterior is null then 'creado'::tipo_evento else 'editado'::tipo_evento end,
          case when v_anterior is null then null else jsonb_build_object('anterior', v_anterior) end,
          auth.uid());

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 4. Comprobación rápida
-- ---------------------------------------------------------------------
-- select nombre, precio, costo, precio - costo as ganancia from productos where costo is not null;
