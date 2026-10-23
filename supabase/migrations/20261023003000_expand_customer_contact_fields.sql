-- Campos de cliente alineados con los formularios comerciales de WA/NEXUS.
-- Treintayuno conserva sus propios datos y tablas; no hay conexión entre bases.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS city text;
