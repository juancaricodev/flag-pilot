export type AuditAction = 'CREATE' | 'TOGGLE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  id: string;
  flagId: string;
  flagName?: string;
  action: AuditAction;
  fromState: string | null;
  toState: string | null;
  reason: string | null;
  createdAt: string;
}
