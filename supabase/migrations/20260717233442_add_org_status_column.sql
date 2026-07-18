-- Add status column to organizations table for admin B2B management
-- The code expects a text status ('active', 'suspended', 'disabled')
-- but only is_active (boolean) existed in the schema

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'disabled'));

-- Backfill from existing is_active boolean column
UPDATE public.organizations 
  SET status = CASE WHEN is_active THEN 'active' ELSE 'suspended' END 
  WHERE status IS NULL;
