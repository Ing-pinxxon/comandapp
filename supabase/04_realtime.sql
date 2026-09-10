-- =====================================================================
-- Comandapp Saboratto · 04_realtime.sql
-- Habilita cambios en tiempo real para que todas las pantallas se sincronicen.
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pedidos') then
    alter publication supabase_realtime add table pedidos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pedido_items') then
    alter publication supabase_realtime add table pedido_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'productos') then
    alter publication supabase_realtime add table productos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'configuracion') then
    alter publication supabase_realtime add table configuracion;
  end if;
end $$;

-- Para que los eventos UPDATE/DELETE incluyan la fila completa
alter table pedidos replica identity full;
alter table pedido_items replica identity full;
