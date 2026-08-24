export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than';
  value: string;
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'create_task' | 'change_stage';
  params: Record<string, string>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'new_contact' | 'stage_change' | 'event_checkin' | 'birthday';
  trigger_config: Record<string, unknown>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  execution_count: number;
  created_at?: string;
}
