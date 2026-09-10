-- =====================================================================
-- Comandapp Saboratto · 02_policies.sql
-- Row Level Security: personal opera pedidos; solo admin edita catálogo y configuración.
-- =====================================================================

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and rol = 'admin');
$$;

alter table perfiles       enable row level security;
alter table categorias     enable row level security;
alter table productos      enable row level security;
alter table configuracion  enable row level security;
alter table pedidos        enable row level security;
alter table pedido_items   enable row level security;
alter table pedido_eventos enable row level security;

-- perfiles: cada quien ve el suyo; admin ve y edita todos
drop policy if exists perfiles_select on perfiles;
create policy perfiles_select on perfiles for select to authenticated
  using (user_id = auth.uid() or es_admin());
drop policy if exists perfiles_admin_all on perfiles;
create policy perfiles_admin_all on perfiles for all to authenticated
  using (es_admin()) with check (es_admin());

-- catálogo y configuración: lectura para todos los autenticados, escritura solo admin
drop policy if exists categorias_select on categorias;
create policy categorias_select on categorias for select to authenticated using (true);
drop policy if exists categorias_admin on categorias;
create policy categorias_admin on categorias for all to authenticated
  using (es_admin()) with check (es_admin());

drop policy if exists productos_select on productos;
create policy productos_select on productos for select to authenticated using (true);
drop policy if exists productos_admin on productos;
create policy productos_admin on productos for all to authenticated
  using (es_admin()) with check (es_admin());

drop policy if exists configuracion_select on configuracion;
create policy configuracion_select on configuracion for select to authenticated using (true);
drop policy if exists configuracion_admin on configuracion;
create policy configuracion_admin on configuracion for all to authenticated
  using (es_admin()) with check (es_admin());

-- pedidos: personal y admin leen, crean y actualizan; borrar solo admin
drop policy if exists pedidos_select on pedidos;
create policy pedidos_select on pedidos for select to authenticated using (true);
drop policy if exists pedidos_insert on pedidos;
create policy pedidos_insert on pedidos for insert to authenticated with check (true);
drop policy if exists pedidos_update on pedidos;
create policy pedidos_update on pedidos for update to authenticated using (true) with check (true);
drop policy if exists pedidos_delete on pedidos;
create policy pedidos_delete on pedidos for delete to authenticated using (es_admin());

drop policy if exists items_select on pedido_items;
create policy items_select on pedido_items for select to authenticated using (true);
drop policy if exists items_insert on pedido_items;
create policy items_insert on pedido_items for insert to authenticated with check (true);
drop policy if exists items_update on pedido_items;
create policy items_update on pedido_items for update to authenticated using (true) with check (true);
drop policy if exists items_delete on pedido_items;
create policy items_delete on pedido_items for delete to authenticated using (true);

drop policy if exists eventos_select on pedido_eventos;
create policy eventos_select on pedido_eventos for select to authenticated using (true);
drop policy if exists eventos_insert on pedido_eventos;
create policy eventos_insert on pedido_eventos for insert to authenticated with check (true);
drop policy if exists eventos_delete on pedido_eventos;
create policy eventos_delete on pedido_eventos for delete to authenticated using (es_admin());

-- Permisos de ejecución de las funciones RPC
grant execute on function guardar_pedido(jsonb, jsonb) to authenticated;
grant execute on function cambiar_estado(bigint, estado_pedido, text) to authenticated;
grant execute on function es_admin() to authenticated;
grant execute on function cfg_int(text, int) to authenticated;
