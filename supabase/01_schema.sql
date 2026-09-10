-- =====================================================================
-- Comandapp Saboratto · 01_schema.sql
-- Tablas, tipos, triggers y funciones RPC.
-- Ejecutar en el SQL Editor de Supabase (en orden: 01, 02, 03, 04).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type rol_usuario as enum ('admin', 'personal');
  end if;
  if not exists (select 1 from pg_type where typname = 'metodo_pago') then
    create type metodo_pago as enum ('efectivo', 'nequi', 'daviplata', 'breb', 'otro');
  end if;
  if not exists (select 1 from pg_type where typname = 'estado_pedido') then
    create type estado_pedido as enum ('pendiente', 'entregado', 'cancelado');
  end if;
  if not exists (select 1 from pg_type where typname = 'tipo_evento') then
    create type tipo_evento as enum ('creado', 'editado', 'entregado', 'cancelado');
  end if;
end $$;

-- ---------- Perfiles (rol por usuario de Auth) ----------
create table if not exists perfiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  rol        rol_usuario not null default 'personal',
  nombre     text,
  creado_en  timestamptz not null default now()
);

-- Al crear un usuario en Auth se crea su perfil como "personal".
-- Para volverlo admin: update perfiles set rol = 'admin' where user_id = '<uuid>';
create or replace function crear_perfil_automatico()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (user_id, rol, nombre)
  values (new.id, 'personal', split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_crear_perfil on auth.users;
create trigger trg_crear_perfil
after insert on auth.users
for each row execute function crear_perfil_automatico();

-- ---------- Catálogo ----------
create table if not exists categorias (
  id             serial primary key,
  nombre         text not null unique,
  emoji          text not null default '',
  orden          int  not null default 0,
  lleva_icopor   boolean not null default false,  -- perros y salchipapas
  permite_combo  boolean not null default false   -- hamburguesas
);

create table if not exists productos (
  id             serial primary key,
  categoria_id   int not null references categorias (id),
  nombre         text not null,
  precio         int  not null check (precio >= 0),
  precio_combo   int  check (precio_combo is null or precio_combo >= 0),
  ingredientes   text[] not null default '{}',   -- ingredientes que el cliente puede quitar
  activo         boolean not null default true,  -- false = oculto del menú
  agotado        boolean not null default false, -- true = sin stock hoy
  orden          int not null default 0,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists productos_categoria_idx on productos (categoria_id, orden);

-- ---------- Configuración (clave → valor json) ----------
create table if not exists configuracion (
  clave          text primary key,
  valor          jsonb not null,
  actualizado_en timestamptz not null default now()
);

-- ---------- Pedidos ----------
create table if not exists pedidos (
  id                 bigserial primary key,
  numero_dia         int,                       -- #1, #2, ... reinicia cada día (Bogotá)
  dia_negocio        date,                      -- fecha del pedido en America/Bogota
  cliente_nombre     text not null,
  cliente_telefono   text,
  metodo_pago        metodo_pago not null default 'efectivo',
  es_domicilio       boolean not null default true,
  subtotal           int not null default 0,
  unidades_icopor    int not null default 0,
  costo_icopor       int not null default 0,
  costo_domicilio    int not null default 0,
  total              int not null default 0,
  notas              text,
  estado             estado_pedido not null default 'pendiente',
  motivo_cancelacion text,
  creado_en          timestamptz not null default now(),
  entregado_en       timestamptz,
  cancelado_en       timestamptz,
  editado_en         timestamptz,
  tomado_por         uuid references auth.users (id)
);
create index if not exists pedidos_estado_idx on pedidos (estado, creado_en);
create index if not exists pedidos_dia_idx on pedidos (dia_negocio);
create index if not exists pedidos_telefono_idx on pedidos (cliente_telefono);

create table if not exists pedido_items (
  id               bigserial primary key,
  pedido_id        bigint not null references pedidos (id) on delete cascade,
  producto_id      int references productos (id) on delete set null, -- null = producto "X"
  nombre           text not null,
  categoria_nombre text not null,
  precio_unitario  int not null check (precio_unitario >= 0), -- precio cobrado por unidad (incluye combo)
  cantidad         int not null check (cantidad > 0),
  es_combo         boolean not null default false,
  exclusiones      text[] not null default '{}',  -- "Sin: ..."
  nota             text,
  es_personalizado boolean not null default false
);
create index if not exists pedido_items_pedido_idx on pedido_items (pedido_id);

create table if not exists pedido_eventos (
  id         bigserial primary key,
  pedido_id  bigint not null references pedidos (id) on delete cascade,
  tipo       tipo_evento not null,
  datos      jsonb,
  creado_en  timestamptz not null default now(),
  por        uuid references auth.users (id)
);
create index if not exists pedido_eventos_pedido_idx on pedido_eventos (pedido_id);

-- ---------- Trigger: número de pedido del día ----------
create or replace function asignar_numero_dia()
returns trigger language plpgsql as $$
begin
  new.dia_negocio := (coalesce(new.creado_en, now()) at time zone 'America/Bogota')::date;
  -- evita duplicados si dos dispositivos guardan al mismo tiempo
  perform pg_advisory_xact_lock(hashtext('numero_dia_' || new.dia_negocio::text));
  select coalesce(max(numero_dia), 0) + 1
    into new.numero_dia
    from pedidos
   where dia_negocio = new.dia_negocio;
  return new;
end $$;

drop trigger if exists trg_numero_dia on pedidos;
create trigger trg_numero_dia
before insert on pedidos
for each row execute function asignar_numero_dia();

-- ---------- Trigger: actualizado_en en productos ----------
create or replace function tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists trg_productos_actualizado on productos;
create trigger trg_productos_actualizado
before update on productos
for each row execute function tocar_actualizado_en();

-- ---------- Helper: leer un número de configuración ----------
create or replace function cfg_int(p_clave text, p_default int)
returns int language sql stable as $$
  select coalesce((select (valor #>> '{}')::int from configuracion where clave = p_clave), p_default);
$$;

-- ---------- RPC: guardar_pedido (crear o editar, atómico) ----------
-- p_pedido: { id?, cliente_nombre, cliente_telefono, metodo_pago, es_domicilio, notas }
-- p_items : [ { producto_id?, nombre, categoria_nombre, precio_unitario, cantidad,
--               es_combo?, exclusiones?, nota?, es_personalizado? }, ... ]
-- Los totales se recalculan aquí con las reglas de la web:
--   icopor $500 por cada unidad de categoría con lleva_icopor (perros, salchipapas)
--   domicilio $1.000 si es_domicilio
--   sin descuentos
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
  v_anterior        jsonb;
  v_item            jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto';
  end if;
  if coalesce(trim(p_pedido ->> 'cliente_nombre'), '') = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;

  -- Totales
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
                         subtotal, unidades_icopor, costo_icopor, costo_domicilio, total, tomado_por)
    values (trim(p_pedido ->> 'cliente_nombre'),
            nullif(regexp_replace(coalesce(p_pedido ->> 'cliente_telefono', ''), '\D', '', 'g'), ''),
            coalesce((p_pedido ->> 'metodo_pago')::metodo_pago, 'efectivo'),
            v_es_domicilio,
            nullif(trim(coalesce(p_pedido ->> 'notas', '')), ''),
            v_subtotal, v_unidades_icopor, v_costo_icopor, v_costo_domicilio, v_total, auth.uid())
    returning id into v_id;
  else
    -- snapshot del pedido anterior para auditoría
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
      editado_en       = now()
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

-- ---------- RPC: cambiar_estado ----------
create or replace function cambiar_estado(p_id bigint, p_estado estado_pedido, p_motivo text default null)
returns void language plpgsql security invoker as $$
begin
  if p_estado = 'cancelado' and coalesce(trim(p_motivo), '') = '' then
    raise exception 'Indica el motivo de la cancelación';
  end if;

  update pedidos set
    estado             = p_estado,
    entregado_en       = case when p_estado = 'entregado' then now() else null end,
    cancelado_en       = case when p_estado = 'cancelado' then now() else null end,
    motivo_cancelacion = case when p_estado = 'cancelado' then trim(p_motivo) else null end
  where id = p_id;

  if not found then
    raise exception 'Pedido % no existe', p_id;
  end if;

  insert into pedido_eventos (pedido_id, tipo, datos, por)
  values (p_id,
          case p_estado when 'entregado' then 'entregado'::tipo_evento
                        when 'cancelado' then 'cancelado'::tipo_evento
                        else 'editado'::tipo_evento end,
          case when p_estado = 'cancelado' then jsonb_build_object('motivo', trim(p_motivo)) else null end,
          auth.uid());
end $$;
