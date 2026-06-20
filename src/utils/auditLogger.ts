import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/useAuthStore';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ROLE_CHANGE' 
  | 'PLUGIN_TOGGLE' 
  | 'ENROLLMENT_PROCESS';

/**
 * Logs an administrative or critical action to the public.audit_logs table.
 * Employs authenticated user context from useAuthStore.
 */
export async function logAuditEvent(
  action: AuditAction,
  resource: string,
  resourceId: string | null,
  details: Record<string, any> = {}
): Promise<void> {
  const { user } = useAuthStore.getState();
  if (!user) {
    console.warn(`[Audit Log Skipped] Attempted to log action "${action}" on "${resource}" but no authenticated user is present.`);
    return;
  }

  try {
    const payload = {
      user_id: user.id,
      user_email: user.email || null,
      action,
      resource,
      resource_id: resourceId,
      details
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert([payload]);

    if (error) {
      console.error('Error inserting audit log on server:', error.message, error);
    } else {
      console.log(`[Audit Logged] User ${user.email} performed ${action} on ${resource} (${resourceId || 'N/A'})`);
    }
  } catch (err) {
    console.error('Unexpected error in logAuditEvent:', err);
  }
}
