-- =====================================================================
-- Comandapp Saboratto · 05_integracion_bot.sql
-- Permite que los pedidos tomados por el bot de WhatsApp entren solos
-- a la cola, marcados como "sin revisar" hasta que el personal los apruebe.
-- Ejecutar DESPUÉS de 01, 02, 03 y 04.
-- =====================================================================

-- ---------- De dónde viene el pedido ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'origen_pedido') then
    create type origen_pedido as enum ('manual', 'whatsapp');
  end if;
end $$;

alter table pedidos add column if not exists origen origen_pedido not null default 'manual';
-- Los pedidos tomados a mano nacen revisados; los del bot nacen sin revisar.
alter table pedidos add column if not exists revisado boolean not null default true;
alter table pedidos add column if not exists revisado_en timestamptz;
-- Texto tal cual lo escribió el bot, para poder comparar si algo se ve raro.
alter table pedidos add column if not exists texto_original text;

create index if not exists pedidos_origen_idx on pedidos (origen, revisado);

-- ---------- El evento de aprobación ----------
do $$ begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'tipo_evento' and e.enumlabel = 'aprobado'
  ) then
    alter type tipo_evento add value 'aprobado';
  end if;
end $$;

-- ---------- guardar_pedido: ahora acepta origen, revisado y texto_original ----------
-- Mantiene el mismo comportamiento para los pedidos manuales (los campos nuevos
-- son opcionales y toman los valores por defecto de siempre).
create or replace function guardar_pedido(p_pedido jsonb, p_items jsonb)
returns bigint language plpgsql security invoker as $$
declare
  v_id              bigint := nullif(p_pedido ->> 'id', '')::bigint;
  v_subtotal        int := 0;
  v_unidades_icopor int := 0;
  v_costo_icopor    int;
  v_costo_domicilio int;
  v_total           int;
  v_es_domicilio    boolean := coalesce((p_pedido ->> 'es_domicilio')::boolean, true);
  v_origen          origen_pedido := coalesce((p_pedido ->> 'origen')::origen_pedido, 'manual');
  v_revisado        boolean := coalesce((p_pedido ->> 'revisado')::boolean, true);
  v_texto           text := nullif(trim(coalesce(p_pedido ->> 'texto_original', '')), '');
  v_anterior        jsonb;
  v_item            jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto';
  end if;
  if coalesce(trim(p_pedido ->> 'cliente_nombre'), '') = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;

  -- Totales: icopor por perro/salchipapa + domicilio, sin descuentos
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (v_item ->> 'precio_unitario')::int * (v_item ->> 'cantidad')::int;
    if exists (select 1 from categorias c
               where c.nombre = v_item ->> 'categoria_nombre' and c.lleva_icopor) then
      v_unidades_icopor := v_unidades_icopor + (v_item ->> 'cantidad')::int;
    end if;
  end loop;

  v_costo_icopor    := v_unidades_icopor * cfg_int('costo_icopor', 500);
  v_costo_domicilio := case when v_es_domicilio then cfg_int('costo_domicilio', 1000) else 0 end;
  v_total           := v_subtotal + v_costo_icopor + v_costo_domicilio;

  if v_id is null then
    insert into pedidos (cliente_nombre, cliente_telefono, metodo_pago, es_domicilio, notas,
                         subtotal, unidades_icopor, costo_icopor, costo_domicilio, total, tomado_por,
                         origen, revisado, texto_original)
    values (trim(p_pedido ->> 'cliente_nombre'),
            nullif(regexp_replace(coalesce(p_pedido ->> 'cliente_telefono', ''), '\D', '', 'g'), ''),
            coalesce((p_pedido ->> 'metodo_pago')::metodo_pago, 'efectivo'),
            v_es_domicilio,
            nullif(trim(coalesce(p_pedido ->> 'notas', '')), ''),
            v_subtotal, v_unidades_icopor, v_costo_icopor, v_costo_domicilio, v_total, auth.uid(),
            v_origen, v_revisado, v_texto)
    returning id into v_id;
  else
    select jsonb_build_object(
             'pedido', to_jsonb(p) - 'tomado_por',
             'items', (select coalesce(jsonb_agg(to_jsonb(i) - 'id' - 'pedido_id'), '[]'::jsonb)
                         from pedido_items i where i.pedido_id = p.id))
      into v_anterior
      from pedidos p where p.id = v_id;

    if v_anterior is null then
      raise exception 'Pedido % no existe', v_id;
    end if;

    update pedidos set
      cliente_nombre   = trim(p_pedido ->> 'cliente_nombre'),
      cliente_telefono = nullif(regexp_replace(coalesce(p_pedido ->> 'cliente_telefono', ''), '\D', '', 'g'), ''),
      metodo_pago      = coalesce((p_pedido ->> 'metodo_pago')::metodo_pago, metodo_pago),
      es_domicilio     = v_es_domicilio,
      notas            = nullif(trim(coalesce(p_pedido ->> 'notas', '')), ''),
      subtotal         = v_subtotal,
      unidades_icopor  = v_unidades_icopor,
      costo_icopor     = v_costo_icopor,
      costo_domicilio  = v_costo_domicilio,
      total            = v_total,
      editado_en       = now(),
      -- Editar a mano un pedido del bot cuenta como revisarlo
      revisado         = true,
      revisado_en      = coalesce(revisado_en, now())
    where id = v_id;

    delete from pedido_items where pedido_id = v_id;
  end if;

  insert into pedido_items (pedido_id, producto_id, nombre, categoria_nombre, precio_unitario,
                            cantidad, es_combo, exclusiones, nota, es_personalizado)
  select v_id,
         nullif(i ->> 'producto_id', '')::int,
         i ->> 'nombre',
         i ->> 'categoria_nombre',
         (i ->> 'precio_unitario')::int,
         (i ->> 'cantidad')::int,
         coalesce((i ->> 'es_combo')::boolean, false),
         coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(i -> 'exclusiones', '[]'::jsonb)) x), '{}'),
         nullif(trim(coalesce(i ->> 'nota', '')), ''),
         coalesce((i ->> 'es_personalizado')::boolean, false)
    from jsonb_array_elements(p_items) i;

  insert into pedido_eventos (pedido_id, tipo, datos, por)
  values (v_id,
          case when v_anterior is null then 'creado'::tipo_evento else 'editado'::tipo_evento end,
          case when v_anterior is null then null else jsonb_build_object('anterior', v_anterior) end,
          auth.uid());

  return v_id;
end $$;

-- ---------- RPC: aprobar_pedido ----------
-- El personal confirma que lo que trajo el bot está correcto.
create or replace function aprobar_pedido(p_id bigint)
returns void language plpgsql security invoker as $$
begin
  update pedidos set revisado = true, revisado_en = now()
  where id = p_id and revisado = false;

  if not found then
    return; -- ya estaba revisado: no es error
  end if;

  insert into pedido_eventos (pedido_id, tipo, por)
  values (p_id, 'aprobado'::tipo_evento, auth.uid());
end $$;

grant execute on function aprobar_pedido(bigint) to authenticated;

-- ---------- Realtime ----------
-- Las columnas nuevas viajan solas porque pedidos ya tiene replica identity full.
