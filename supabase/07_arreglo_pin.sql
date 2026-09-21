-- =====================================================================
-- Comandapp · 07_arreglo_pin.sql
-- Arregla "function gen_salt(unknown) does not exist".
-- En Supabase la extensión pgcrypto (crypt, gen_salt) está en el esquema
-- "extensions", y las funciones del PIN solo buscaban en "public".
-- Ejecutar una vez, después de 06. Es seguro repetirlo.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

alter function crear_negocio(text, text, text, text, text) set search_path = public, extensions;
alter function crear_empleado(uuid, text, text, boolean)    set search_path = public, extensions;
alter function cambiar_pin(uuid, text)                      set search_path = public, extensions;
alter function verificar_pin(uuid, uuid, text)              set search_path = public, extensions;
