-- Migration: Fix process_audit_log function and audit_logs resource constraint
-- Ensures audit logging is compatible with both old and new audit_logs schema,
-- provides default values for resource, and ensures audit errors do not crash user actions.

ALTER TABLE public.audit_logs 
  ALTER COLUMN resource SET DEFAULT 'system';

CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  rec_id text;
BEGIN
  current_user_id := auth.uid();
  rec_id := COALESCE(NEW.id, OLD.id)::text;

  IF current_user_id IS NOT NULL THEN
    BEGIN
      SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    EXCEPTION WHEN OTHERS THEN
      current_user_email := NULL;
    END;
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    resource,
    resource_id,
    table_name,
    record_id,
    details,
    old_values,
    new_values
  ) VALUES (
    current_user_id,
    current_user_email,
    TG_OP,
    COALESCE(TG_TABLE_NAME, 'system'),
    rec_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', rec_id
    ),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'process_audit_log failed: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
