-- =====================================================================
-- Comandapp Saboratto · 03_seed.sql
-- Catálogo inicial tomado de la web (WebSaboratto/index.html) y configuración.
-- Se puede ejecutar varias veces sin duplicar.
-- =====================================================================

-- ---------- Categorías ----------
insert into categorias (nombre, emoji, orden, lleva_icopor, permite_combo) values
  ('Hamburguesas', '🍔', 1, false, true),
  ('Perros',       '🌭', 2, true,  false),
  ('Salchipapas',  '🍟', 3, true,  false),
  ('Sándwiches',   '🥪', 4, false, false),
  ('Bebidas',      '🥤', 5, false, false),
  ('Adicionales',  '➕', 6, false, false)
on conflict (nombre) do update set
  emoji = excluded.emoji, orden = excluded.orden,
  lleva_icopor = excluded.lleva_icopor, permite_combo = excluded.permite_combo;

-- ---------- Productos ----------
-- Ingredientes removibles = INGREDIENTES_REMOVIBLES de WebSaboratto/src/cart.js
with datos (categoria, nombre, precio, precio_combo, ingredientes, orden) as (
  values
  -- Hamburguesas (combo = +6.000: papas + Coca-Cola Cero)
  ('Hamburguesas', 'Hamburguesa Tradicional', 11500, 17500,
     array['Queso','Cebolla Saboratto','Lechuga','Tomate','Papa ripio','Salsa de la casa'], 1),
  ('Hamburguesas', 'Hamburguesa Especial', 15000, 21000,
     array['Queso','Cebolla Saboratto','Lechuga','Tomate','Papa ripio','Salsa de la casa','Jamón ahumado','Tocineta','Huevo de codorniz'], 2),
  ('Hamburguesas', 'Hamburguesa Ranchera', 15000, 21000,
     array['Queso','Cebolla Saboratto','Lechuga','Tomate','Papa ripio','Salsa de la casa','Tocineta','Huevo de codorniz'], 3),
  ('Hamburguesas', 'Hamburguesa Con Todo', 22000, 28000,
     array['Queso','Cebolla Saboratto','Lechuga','Tomate','Papa ripio','Salsa de la casa','Jamón ahumado','Tocineta','Huevo de codorniz'], 4),
  -- Perros
  ('Perros', 'Perro Caliente Tradicional', 9000, null,
     array['Queso doble crema','Cebolla Saboratto','Papa ripio','Salsa de la casa'], 1),
  ('Perros', 'Perro Caliente Especial', 13000, null,
     array['Queso doble crema','Cebolla Saboratto','Papa ripio','Salsa de la casa','Jamón ahumado','Tocineta','Huevo de codorniz'], 2),
  ('Perros', 'Perro Caliente Ranchero', 13000, null,
     array['Queso doble crema','Cebolla Saboratto','Papa ripio','Salsa de la casa','Tocineta'], 3),
  -- Salchipapas
  ('Salchipapas', 'Salchipapa Tradicional', 10000, null,
     array['Queso','Huevo de codorniz','Salsa cheddar'], 1),
  ('Salchipapas', 'Salchipapa Ranchera', 15000, null,
     array['Queso','Huevo de codorniz','Salsa cheddar','Tocineta'], 2),
  ('Salchipapas', 'Salchipapa Doble', 22000, null,
     array['Queso','Huevo de codorniz','Salsa cheddar','Tocineta'], 3),
  -- Sándwiches
  ('Sándwiches', 'Sándwich con carne de hamburguesa', 12000, null,
     array['Queso','Cebolla Saboratto','Lechuga','Tomate','Papa ripio','Salsa de la casa'], 1),
  -- Bebidas Coca-Cola
  ('Bebidas', 'Coca Cola pequeña de combo', 2000, null, array[]::text[], 1),
  ('Bebidas', 'Coca Cola pequeña original', 2500, null, array[]::text[], 2),
  ('Bebidas', 'Coca Cola personal',         3500, null, array[]::text[], 3),
  ('Bebidas', 'Coca Cola 1.5L',             6500, null, array[]::text[], 4),
  ('Bebidas', 'Quatro 1.5L',                5000, null, array[]::text[], 5),
  ('Bebidas', 'Sprite 1.5L',                5000, null, array[]::text[], 6),
  ('Bebidas', 'Jugo Del Valle',             5000, null, array[]::text[], 7),
  -- Bebidas Postobón
  ('Bebidas', 'Manzana pequeña',            1500, null, array[]::text[], 8),
  ('Bebidas', 'Colombiana pequeña',         1500, null, array[]::text[], 9),
  ('Bebidas', 'Pepsi pequeña',              1500, null, array[]::text[], 10),
  ('Bebidas', 'Manzana 2.5L',               6000, null, array[]::text[], 11),
  ('Bebidas', 'Colombiana 2.5L',            6000, null, array[]::text[], 12),
  ('Bebidas', 'Pepsi 2.5L',                 6000, null, array[]::text[], 13),
  -- Adicionales
  ('Adicionales', 'Porción de papas',       4000, null, array[]::text[], 1)
)
insert into productos (categoria_id, nombre, precio, precio_combo, ingredientes, orden)
select c.id, d.nombre, d.precio, d.precio_combo, d.ingredientes, d.orden
  from datos d join categorias c on c.nombre = d.categoria
 where not exists (select 1 from productos p where p.nombre = d.nombre);

-- ---------- Configuración ----------
insert into configuracion (clave, valor) values
  ('umbrales_min',      '{"verde": 15, "amarillo": 25}'),   -- verde 0-15, amarillo 15-25, naranja +25
  ('costo_domicilio',   '1000'),
  ('costo_icopor',      '500'),
  ('extra_combo',       '6000'),
  ('mensajes_whatsapp', '{"listo": "¡Hola {nombre}! 👋 Tu pedido #{numero} de Saboratto ya está listo 🍔✅", "en_camino": "¡Hola {nombre}! 👋 Tu pedido #{numero} de Saboratto va en camino 🛵 Total: {total}"}')
on conflict (clave) do nothing;
