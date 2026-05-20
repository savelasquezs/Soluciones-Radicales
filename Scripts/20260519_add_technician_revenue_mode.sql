-- Agrega modo de atribucion de ventas por tecnico en sucursal.
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS technician_revenue_mode TEXT NOT NULL DEFAULT 'split';

ALTER TABLE branches
DROP CONSTRAINT IF EXISTS branches_technician_revenue_mode_check;

ALTER TABLE branches
ADD CONSTRAINT branches_technician_revenue_mode_check
CHECK (technician_revenue_mode IN ('split', 'full'));
