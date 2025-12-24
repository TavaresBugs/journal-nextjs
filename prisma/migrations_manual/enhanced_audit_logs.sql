-- Migration: Enhanced Audit Logs
-- Adds context fields for better traceability

-- Add actor context (who performed the action)
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS actor_email VARCHAR(255);

-- Add target user context (who was affected)
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS target_user_id UUID;

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS target_user_email VARCHAR(255);

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS target_user_name VARCHAR(255);

-- Add before/after values for changes
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS old_values JSONB DEFAULT '{}';

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS new_values JSONB DEFAULT '{}';

-- Add optional reason field
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add session tracking (optional)
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

-- Add index for target user queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user 
ON public.audit_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target_email 
ON public.audit_logs(target_user_email);

-- Comment on columns for documentation
COMMENT ON COLUMN public.audit_logs.actor_email IS 'Email of the user who performed the action';
COMMENT ON COLUMN public.audit_logs.target_user_id IS 'ID of the user affected by the action';
COMMENT ON COLUMN public.audit_logs.target_user_email IS 'Email of the affected user (preserved even if deleted)';
COMMENT ON COLUMN public.audit_logs.target_user_name IS 'Name of the affected user (preserved even if deleted)';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values before the change (JSON)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values after the change (JSON)';
COMMENT ON COLUMN public.audit_logs.reason IS 'Optional reason/justification for the action';
