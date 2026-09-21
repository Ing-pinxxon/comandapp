-- =====================================================================
-- Comandapp · 06_multinegocio.sql
-- Convierte la base en multinegocio: cada restaurante tiene su cuenta,
-- sus empleados con PIN, sus cargos y sus datos aislados por RLS.
-- Ejecutar DESPUÉS de 01–05. Es idempotente: se puede correr dos veces.
-- Si la base ya tiene datos de Saboratto, los migra al negocio "Saboratto".
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Tablas nuevas
-- ---------------------------------------------------------------------
create table if not exists negocios (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  slug               text not null unique,
  logo_url           text,
  telefono_whatsapp  text,
  moneda             text not null default 'COP',
  zona_horaria       text not null default 'America/Bogota',
  combo_descripcion  text not null default 'incluye papas + gaseosa',
  clave_integracion  uuid not null default gen_random_uuid() unique, -- para el bot de WhatsApp
  activo             boolean not null default true,
  creado_por         uuid references auth.users (id),
  creado_en          timestamptz not null default now()
);

create table if not exists miembros (
  negocio_id  uuid not null references negocios (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  rol         text not null default 'dueno' check (rol in ('dueno')),
  creado_en   timestamptz not null default now(),
  primary key (negocio_id, user_id)
);
create index if not exists miembros_user_idx on miembros (user_id);

-- Empleados NO tienen usuario de Auth: entran con PIN dentro de la sesión del dueño.
create table if not exists empleados (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references negocios (id) on delete cascade,
  nombre      text not null,
  pin_hash    text not null,
  es_dueno    boolean not null default false,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);
create index if not exists empleados_negocio_idx on empleados (negocio_id);

create table if not exists superadmins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now()
);

-- Cargos configurables (reemplazan icopor/domicilio fijos)
create table if not exists cargos (
  id              serial primary key,
  negocio_id      uuid not null references negocios (id) on delete cascade,
  nombre          text not null,
  tipo            text not null check (tipo in ('por_unidad_categoria', 'por_pedido')),
  valor           int  not null check (valor >= 0),
  categorias      int[] not null default '{}',   -- solo para por_unidad_categoria
  solo_domicilio  boolean not null default false, -- solo se cobra si el pedido es a domicilio
  activo          boolean not null default true,
  orden           int not null default 0
);
create index if not exists cargos_negocio_idx on cargos (negocio_id);

create table if not exists importaciones_menu (
  id              uuid primary key default gen_random_uuid(),
  negocio_id      uuid not null references negocios (id) on delete cascade,
  rutas_imagenes  text[] not null default '{}',
  estado          text not null default 'procesando' check (estado in ('procesando', 'listo', 'aplicado', 'error')),
  resultado       jsonb,
  error           text,
  creado_por      uuid references auth.users (id),
  creado_en       timestamptz not null default now()
);
create index if not exists importaciones_negocio_idx on importaciones_menu (negocio_id, creado_en desc);

-- ---------------------------------------------------------------------
-- 2. Columnas nuevas en las tablas existentes (primero permitiendo null
--    para poder migrar los datos de Saboratto)
-- ---------------------------------------------------------------------
alter table categorias     add column if not exists negocio_id uuid references negocios (id) on delete cascade;
alter table productos      add column if not exists negocio_id uuid references negocios (id) on delete cascade;
alter table configuracion  add column if not exists negocio_id uuid references negocios (id) on delete cascade;
alter table pedidos        add column if not exists negocio_id uuid references negocios (id) on delete cascade;
alter table pedido_eventos add column if not exists negocio_id uuid references negocios (id) on delete cascade;

alter table pedidos add column if not exists empleado_id  uuid references empleados (id);
alter table pedidos add column if not exists cargos       jsonb not null default '[]'::jsonb; -- [{nombre, valor}]
alter table pedidos add column if not exists total_cargos int not null default 0;

create index if not exists categorias_negocio_idx on categorias (negocio_id, orden);
create index if not exists productos_negocio_idx  on productos (negocio_id, categoria_id, orden);
create index if not exists pedidos_negocio_idx    on pedidos (negocio_id, dia_negocio, estado);
create index if not exists eventos_negocio_idx    on pedido_eventos (negocio_id);

-- ---------------------------------------------------------------------
-- 3. Migración de los datos existentes de Saboratto (solo si los hay)
-- ---------------------------------------------------------------------
do $$
declare
  v_negocio uuid;
  v_admin   uuid;
  v_perros  int;
  v_salchi  int;
begin
  if exists (select 1 from negocios where slug = 'saboratto') then
    return; -- ya migrado
  end if;
  if not exists (select 1 from productos where negocio_id is null) then
    return; -- base nueva, nada que migrar
  end if;

  -- El administrador actual pasa a ser el dueño de Saboratto y dueño de la plataforma
  select user_id into v_admin from perfiles where rol = 'admin' order by creado_en limit 1;

  insert into negocios (nombre, slug, telefono_whatsapp, combo_descripcion, creado_por)
  values ('Saboratto', 'saboratto', '3222430079', 'incluye papas + Coca-Cola Cero', v_admin)
  returning id into v_negocio;

  update categorias     set negocio_id = v_negocio where negocio_id is null;
  update productos      set negocio_id = v_negocio where negocio_id is null;
  update configuracion  set negocio_id = v_negocio where negocio_id is null;
  update pedidos        set negocio_id = v_negocio where negocio_id is null;
  update pedido_eventos set negocio_id = v_negocio where negocio_id is null;

  -- Cargos equivalentes a las reglas fijas de antes
  select id into v_perros from categorias where negocio_id = v_negocio and nombre = 'Perros';
  select id into v_salchi from categorias where negocio_id = v_negocio and nombre = 'Salchipapas';
  insert into cargos (negocio_id, nombre, tipo, valor, categorias, solo_domicilio, orden) values
    (v_negocio, 'Icopor',    'por_unidad_categoria', 500,  array_remove(array[v_perros, v_salchi], null), false, 1),
    (v_negocio, 'Domicilio', 'por_pedido',           1000, '{}', true, 2);

  -- Los pedidos viejos conservan sus cargos en el formato nuevo
  update pedidos set
    cargos = (
      select coalesce(jsonb_agg(c), '[]'::jsonb) from (
        select jsonb_build_object('nombre', 'Icopor',    'valor', costo_icopor)    as c where costo_icopor > 0
        union all
        select jsonb_build_object('nombre', 'Domicilio', 'valor', costo_domicilio) where costo_domicilio > 0
      ) x
    ),
    total_cargos = costo_icopor + costo_domicilio
  where negocio_id = v_negocio;

  if v_admin is not null then
    insert into miembros (negocio_id, user_id, rol) values (v_negocio, v_admin, 'dueno') on conflict do nothing;
    insert into superadmins (user_id) values (v_admin) on conflict do nothing;
  end if;
end $$;

-- Ahora sí: negocio_id obligatorio (solo si no quedaron filas huérfanas)
do $$
begin
  if not exists (select 1 from categorias where negocio_id is null)
     and not exists (select 1 from productos where negocio_id is null)
     and not exists (select 1 from pedidos where negocio_id is null) then
    alter table categorias     alter column negocio_id set not null;
    alter table productos      alter column negocio_id set not null;
    alter table pedidos        alter column negocio_id set not null;
    delete from configuracion where negocio_id is null;
    alter table configuracion  alter column negocio_id set not null;
    delete from pedido_eventos where negocio_id is null;
    alter table pedido_eventos alter column negocio_id set not null;
  end if;
end $$;

-- Unicidad por negocio (antes era global)
alter table categorias drop constraint if exists categorias_nombre_key;
create unique index if not exists categorias_negocio_nombre_key on categorias (negocio_id, lower(nombre));
create unique index if not exists productos_negocio_nombre_key  on productos  (negocio_id, lower(nombre));

-- configuracion: clave primaria (negocio_id, clave)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'configuracion_pkey'
             and conrelid = 'configuracion'::regclass
             and array_length(conkey, 1) = 1) then
    alter table configuracion drop constraint configuracion_pkey;
    alter table configuracion add primary key (negocio_id, clave);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. Funciones de apoyo (seguridad)
-- ---------------------------------------------------------------------
create or replace function mis_negocios()
returns setof uuid language sql stable security definer set search_path = public, extensions as $$
  select negocio_id from miembros where user_id = auth.uid();
$$;

create or replace function es_miembro(p_negocio uuid)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from miembros where negocio_id = p_negocio and user_id = auth.uid());
$$;

create or replace function es_superadmin()
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from superadmins where user_id = auth.uid());
$$;

-- Lee un número de la configuración del negocio
create or replace function cfg_int(p_negocio uuid, p_clave text, p_default int)
returns int language sql stable as $$
  select coalesce((select (valor #>> '{}')::int from configuracion where negocio_id = p_negocio and clave = p_clave), p_default);
$$;

-- ---------------------------------------------------------------------
-- 5. Crear negocio (onboarding)
-- ---------------------------------------------------------------------
create or replace function crear_negocio(p_nombre text, p_slug text, p_telefono text, p_pin text, p_combo_descripcion text default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid     uuid := auth.uid();
  v_negocio uuid;
  v_slug    text := lower(regexp_replace(coalesce(p_slug, p_nombre), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'El nombre del negocio es obligatorio'; end if;
  if p_pin !~ '^\d{4,6}$' then raise exception 'El PIN debe tener entre 4 y 6 dígitos'; end if;

  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'negocio'; end if;
  -- si el slug ya existe, se le agrega un sufijo
  while exists (select 1 from negocios where slug = v_slug) loop
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
  end loop;

  insert into negocios (nombre, slug, telefono_whatsapp, combo_descripcion, creado_por)
  values (trim(p_nombre), v_slug, nullif(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g'), ''),
          coalesce(nullif(trim(p_combo_descripcion), ''), 'incluye papas + gaseosa'), v_uid)
  returning id into v_negocio;

  insert into miembros (negocio_id, user_id, rol) values (v_negocio, v_uid, 'dueno');

  insert into empleados (negocio_id, nombre, pin_hash, es_dueno)
  values (v_negocio, 'Dueño', crypt(p_pin, gen_salt('bf')), true);

  insert into configuracion (negocio_id, clave, valor) values
    (v_negocio, 'umbrales_min',      '{"verde": 15, "amarillo": 25}'),
    (v_negocio, 'extra_combo',       '6000'),
    (v_negocio, 'mensajes_whatsapp', '{"listo": "¡Hola {nombre}! 👋 Tu pedido #{numero} ya está listo ✅", "en_camino": "¡Hola {nombre}! 👋 Tu pedido #{numero} va en camino 🛵 Total: {total}"}');

  -- Una categoría inicial para poder tomar pedidos aunque no se importe el menú
  insert into categorias (negocio_id, nombre, emoji, orden) values (v_negocio, 'General', '🍽️', 1);

  return v_negocio;
end $$;

-- ---------------------------------------------------------------------
-- 6. Empleados y PIN
-- ---------------------------------------------------------------------
create or replace function crear_empleado(p_negocio uuid, p_nombre text, p_pin text, p_es_dueno boolean default false)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  if not es_miembro(p_negocio) then raise exception 'No tienes acceso a este negocio'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'El nombre es obligatorio'; end if;
  if p_pin !~ '^\d{4,6}$' then raise exception 'El PIN debe tener entre 4 y 6 dígitos'; end if;
  insert into empleados (negocio_id, nombre, pin_hash, es_dueno)
  values (p_negocio, trim(p_nombre), crypt(p_pin, gen_salt('bf')), coalesce(p_es_dueno, false))
  returning id into v_id;
  return v_id;
end $$;

create or replace function cambiar_pin(p_empleado uuid, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_negocio uuid;
begin
  select negocio_id into v_negocio from empleados where id = p_empleado;
  if v_negocio is null or not es_miembro(v_negocio) then raise exception 'No tienes acceso a este empleado'; end if;
  if p_pin !~ '^\d{4,6}$' then raise exception 'El PIN debe tener entre 4 y 6 dígitos'; end if;
  update empleados set pin_hash = crypt(p_pin, gen_salt('bf')) where id = p_empleado;
end $$;

-- Devuelve el empleado si el PIN es correcto; null si no.
create or replace function verificar_pin(p_negocio uuid, p_empleado uuid, p_pin text)
returns table (id uuid, nombre text, es_dueno boolean)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not es_miembro(p_negocio) then raise exception 'No tienes acceso a este negocio'; end if;
  return query
    select e.id, e.nombre, e.es_dueno
      from empleados e
     where e.id = p_empleado and e.negocio_id = p_negocio and e.activo
       and e.pin_hash = crypt(p_pin, e.pin_hash);
end $$;

-- ---------------------------------------------------------------------
-- 7. Número de pedido por negocio y día
-- ---------------------------------------------------------------------
create or replace function asignar_numero_dia()
returns trigger language plpgsql as $$
declare v_zona text;
begin
  select zona_horaria into v_zona from negocios where id = new.negocio_id;
  new.dia_negocio := (coalesce(new.creado_en, now()) at time zone coalesce(v_zona, 'America/Bogota'))::date;
  perform pg_advisory_xact_lock(hashtext('numero_dia_' || coalesce(new.negocio_id::text, '') || new.dia_negocio::text));
  select coalesce(max(numero_dia), 0) + 1
    into new.numero_dia
    from pedidos
   where negocio_id is not distinct from new.negocio_id and dia_negocio = new.dia_negocio;
  return new;
end $$;

drop trigger if exists trg_numero_dia on pedidos;
create trigger trg_numero_dia before insert on pedidos for each row execute function asignar_numero_dia();

-- ---------------------------------------------------------------------
-- 8. guardar_pedido con cargos configurables y negocio
-- ---------------------------------------------------------------------
-- p_pedido: { id?, negocio_id? | negocio_clave?, empleado_id?, cliente_nombre, cliente_telefono,
--             metodo_pago, es_domicilio, notas, origen?, revisado?, texto_original? }
-- p_items : [ { producto_id?, nombre, categoria_nombre, precio_unitario, cantidad, es_combo?, exclusiones?, nota?, es_personalizado? } ]
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

  insert into pedido_eventos (negocio_id, pedido_id, tipo, datos, por)
  values (v_negocio, v_id,
          case when v_anterior is null then 'creado'::tipo_evento else 'editado'::tipo_evento end,
          case when v_anterior is null then null else jsonb_build_object('anterior', v_anterior) end,
          auth.uid());

  return v_id;
end $$;

-- cambiar_estado y aprobar_pedido: registran el negocio en el evento
create or replace function cambiar_estado(p_id bigint, p_estado estado_pedido, p_motivo text default null)
returns void language plpgsql security invoker as $$
declare v_negocio uuid;
begin
  if p_estado = 'cancelado' and coalesce(trim(p_motivo), '') = '' then
    raise exception 'Indica el motivo de la cancelación';
  end if;
  update pedidos set
    estado             = p_estado,
    entregado_en       = case when p_estado = 'entregado' then now() else null end,
    cancelado_en       = case when p_estado = 'cancelado' then now() else null end,
    motivo_cancelacion = case when p_estado = 'cancelado' then trim(p_motivo) else null end
  where id = p_id
  returning negocio_id into v_negocio;
  if not found then raise exception 'Pedido % no existe', p_id; end if;

  insert into pedido_eventos (negocio_id, pedido_id, tipo, datos, por)
  values (v_negocio, p_id,
          case p_estado when 'entregado' then 'entregado'::tipo_evento
                        when 'cancelado' then 'cancelado'::tipo_evento
                        else 'editado'::tipo_evento end,
          case when p_estado = 'cancelado' then jsonb_build_object('motivo', trim(p_motivo)) else null end,
          auth.uid());
end $$;

create or replace function aprobar_pedido(p_id bigint)
returns void language plpgsql security invoker as $$
declare v_negocio uuid;
begin
  update pedidos set revisado = true, revisado_en = now()
  where id = p_id and revisado = false
  returning negocio_id into v_negocio;
  if not found then return; end if;
  insert into pedido_eventos (negocio_id, pedido_id, tipo, por) values (v_negocio, p_id, 'aprobado'::tipo_evento, auth.uid());
end $$;

-- ---------------------------------------------------------------------
-- 9. Importar menú (resultado ya revisado por el dueño)
-- ---------------------------------------------------------------------
-- p_resultado: { categorias: [ { nombre, emoji?, permite_combo?, productos: [ { nombre, precio, precio_combo?, ingredientes?: [] } ] } ] }
create or replace function importar_menu(p_negocio uuid, p_resultado jsonb)
returns jsonb language plpgsql security invoker as $$
declare
  v_cat       jsonb;
  v_prod      jsonb;
  v_cat_id    int;
  v_orden_cat int := 0;
  v_orden     int;
  v_nuevos    int := 0;
  v_actualiz  int := 0;
  v_ingred    text[];
begin
  if not es_miembro(p_negocio) then raise exception 'No tienes acceso a este negocio'; end if;
  select coalesce(max(orden), 0) into v_orden_cat from categorias where negocio_id = p_negocio;

  for v_cat in select * from jsonb_array_elements(coalesce(p_resultado -> 'categorias', '[]'::jsonb)) loop
    if coalesce(trim(v_cat ->> 'nombre'), '') = '' then continue; end if;

    select id into v_cat_id from categorias where negocio_id = p_negocio and lower(nombre) = lower(trim(v_cat ->> 'nombre'));
    if v_cat_id is null then
      v_orden_cat := v_orden_cat + 1;
      insert into categorias (negocio_id, nombre, emoji, orden, permite_combo)
      values (p_negocio, trim(v_cat ->> 'nombre'), coalesce(v_cat ->> 'emoji', '🍽️'), v_orden_cat, coalesce((v_cat ->> 'permite_combo')::boolean, false))
      returning id into v_cat_id;
    else
      update categorias set permite_combo = coalesce((v_cat ->> 'permite_combo')::boolean, permite_combo) where id = v_cat_id;
    end if;

    select coalesce(max(orden), 0) into v_orden from productos where negocio_id = p_negocio and categoria_id = v_cat_id;

    for v_prod in select * from jsonb_array_elements(coalesce(v_cat -> 'productos', '[]'::jsonb)) loop
      if coalesce(trim(v_prod ->> 'nombre'), '') = '' or (v_prod ->> 'precio') is null then continue; end if;
      v_ingred := coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_prod -> 'ingredientes', '[]'::jsonb)) x), '{}');

      if exists (select 1 from productos where negocio_id = p_negocio and lower(nombre) = lower(trim(v_prod ->> 'nombre'))) then
        update productos set
          precio       = (v_prod ->> 'precio')::int,
          precio_combo = nullif(v_prod ->> 'precio_combo', '')::int,
          ingredientes = case when array_length(v_ingred, 1) > 0 then v_ingred else ingredientes end,
          categoria_id = v_cat_id,
          activo       = true
        where negocio_id = p_negocio and lower(nombre) = lower(trim(v_prod ->> 'nombre'));
        v_actualiz := v_actualiz + 1;
      else
        v_orden := v_orden + 1;
        insert into productos (negocio_id, categoria_id, nombre, precio, precio_combo, ingredientes, orden)
        values (p_negocio, v_cat_id, trim(v_prod ->> 'nombre'), (v_prod ->> 'precio')::int,
                nullif(v_prod ->> 'precio_combo', '')::int, v_ingred, v_orden);
        v_nuevos := v_nuevos + 1;
      end if;
    end loop;
  end loop;

  return jsonb_build_object('nuevos', v_nuevos, 'actualizados', v_actualiz);
end $$;

-- ---------------------------------------------------------------------
-- 10. Negocio: clave de integración y panel de plataforma
-- ---------------------------------------------------------------------
create or replace function regenerar_clave_integracion(p_negocio uuid)
returns uuid language plpgsql security invoker as $$
declare v_clave uuid := gen_random_uuid();
begin
  update negocios set clave_integracion = v_clave where id = p_negocio;
  if not found then raise exception 'No tienes acceso a este negocio'; end if;
  return v_clave;
end $$;

-- Usada por el bot (con service_role) para saber a qué negocio pertenece su clave
create or replace function negocio_por_clave(p_clave uuid)
returns table (id uuid, nombre text, activo boolean)
language sql stable security definer set search_path = public, extensions as $$
  select id, nombre, activo from negocios where clave_integracion = p_clave;
$$;

create or replace function resumen_plataforma()
returns table (
  id uuid, nombre text, slug text, logo_url text, activo boolean, creado_en timestamptz,
  dueno_email text, pedidos_total bigint, pedidos_7d bigint, ultimo_pedido timestamptz, empleados bigint
) language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not es_superadmin() then raise exception 'Solo el dueño de la plataforma'; end if;
  return query
    select n.id, n.nombre, n.slug, n.logo_url, n.activo, n.creado_en,
           (select u.email::text from auth.users u where u.id = n.creado_por),
           (select count(*) from pedidos p where p.negocio_id = n.id),
           (select count(*) from pedidos p where p.negocio_id = n.id and p.creado_en > now() - interval '7 days'),
           (select max(p.creado_en) from pedidos p where p.negocio_id = n.id),
           (select count(*) from empleados e where e.negocio_id = n.id and e.activo)
      from negocios n
     order by n.creado_en desc;
end $$;

create or replace function cambiar_estado_negocio(p_negocio uuid, p_activo boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not es_superadmin() then raise exception 'Solo el dueño de la plataforma'; end if;
  update negocios set activo = p_activo where id = p_negocio;
end $$;

-- ---------------------------------------------------------------------
-- 11. Permisos y RLS
-- ---------------------------------------------------------------------
grant execute on function mis_negocios(), es_miembro(uuid), es_superadmin(), cfg_int(uuid, text, int) to authenticated;
grant execute on function crear_negocio(text, text, text, text, text) to authenticated;
grant execute on function crear_empleado(uuid, text, text, boolean), cambiar_pin(uuid, text), verificar_pin(uuid, uuid, text) to authenticated;
grant execute on function guardar_pedido(jsonb, jsonb), cambiar_estado(bigint, estado_pedido, text), aprobar_pedido(bigint) to authenticated;
grant execute on function importar_menu(uuid, jsonb), regenerar_clave_integracion(uuid) to authenticated;
grant execute on function resumen_plataforma(), cambiar_estado_negocio(uuid, boolean) to authenticated;
grant execute on function negocio_por_clave(uuid) to service_role;

-- El PIN nunca sale de la base: la app solo puede leer estas columnas
revoke select on empleados from authenticated;
grant select (id, negocio_id, nombre, es_dueno, activo, creado_en) on empleados to authenticated;
grant update (nombre, es_dueno, activo) on empleados to authenticated;

alter table negocios           enable row level security;
alter table miembros           enable row level security;
alter table empleados          enable row level security;
alter table superadmins        enable row level security;
alter table cargos             enable row level security;
alter table importaciones_menu enable row level security;

-- Políticas viejas (02_policies) que ya no aplican
drop policy if exists categorias_select on categorias;   drop policy if exists categorias_admin on categorias;
drop policy if exists productos_select on productos;     drop policy if exists productos_admin on productos;
drop policy if exists configuracion_select on configuracion; drop policy if exists configuracion_admin on configuracion;
drop policy if exists pedidos_select on pedidos;   drop policy if exists pedidos_insert on pedidos;
drop policy if exists pedidos_update on pedidos;   drop policy if exists pedidos_delete on pedidos;
drop policy if exists items_select on pedido_items; drop policy if exists items_insert on pedido_items;
drop policy if exists items_update on pedido_items; drop policy if exists items_delete on pedido_items;
drop policy if exists eventos_select on pedido_eventos; drop policy if exists eventos_insert on pedido_eventos;
drop policy if exists eventos_delete on pedido_eventos;

-- negocios
drop policy if exists negocios_select on negocios;
create policy negocios_select on negocios for select to authenticated
  using (id in (select mis_negocios()) or es_superadmin());
drop policy if exists negocios_update on negocios;
create policy negocios_update on negocios for update to authenticated
  using (id in (select mis_negocios())) with check (id in (select mis_negocios()));

-- miembros y superadmins: solo lectura de lo propio (las altas van por funciones)
drop policy if exists miembros_select on miembros;
create policy miembros_select on miembros for select to authenticated
  using (user_id = auth.uid() or negocio_id in (select mis_negocios()));
drop policy if exists superadmins_select on superadmins;
create policy superadmins_select on superadmins for select to authenticated using (user_id = auth.uid());

-- Tablas del negocio: patrón único
do $$
declare t text;
begin
  foreach t in array array['empleados', 'cargos', 'categorias', 'productos', 'configuracion', 'importaciones_menu', 'pedidos', 'pedido_eventos'] loop
    execute format('drop policy if exists %I on %I', t || '_negocio', t);
    execute format(
      'create policy %I on %I for all to authenticated using (negocio_id in (select mis_negocios())) with check (negocio_id in (select mis_negocios()))',
      t || '_negocio', t);
  end loop;
end $$;

drop policy if exists items_negocio on pedido_items;
create policy items_negocio on pedido_items for all to authenticated
  using (pedido_id in (select id from pedidos where negocio_id in (select mis_negocios())))
  with check (pedido_id in (select id from pedidos where negocio_id in (select mis_negocios())));

-- ---------------------------------------------------------------------
-- 12. Storage: logos (público) y menus (privado)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('menus', 'menus', false) on conflict (id) do nothing;

drop policy if exists logos_lectura on storage.objects;
create policy logos_lectura on storage.objects for select using (bucket_id = 'logos');
drop policy if exists logos_escritura on storage.objects;
create policy logos_escritura on storage.objects for all to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1]::uuid in (select mis_negocios()))
  with check (bucket_id = 'logos' and (storage.foldername(name))[1]::uuid in (select mis_negocios()));
drop policy if exists menus_negocio on storage.objects;
create policy menus_negocio on storage.objects for all to authenticated
  using (bucket_id = 'menus' and (storage.foldername(name))[1]::uuid in (select mis_negocios()))
  with check (bucket_id = 'menus' and (storage.foldername(name))[1]::uuid in (select mis_negocios()));

-- ---------------------------------------------------------------------
-- 13. Realtime
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'cargos') then
    alter publication supabase_realtime add table cargos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'empleados') then
    alter publication supabase_realtime add table empleados;
  end if;
end $$;
