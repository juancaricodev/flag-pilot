import type { AuditAction } from '@fp/shared';

export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Created',
  TOGGLE: 'Toggled',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
};

export interface AuditChange {
  field: string;
  from: string;
  to: string;
}

export function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '(none)';
  if (typeof val === 'boolean') return val ? 'on' : 'off';
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '(empty)';
  return String(val);
}

export function formatFieldName(field: string): string {
  switch (field) {
    case 'rolloutPct':
      return 'rollout';
    case 'whitelist':
      return 'whitelist';
    default:
      return field;
  }
}

function hasChanged(a: unknown, b: unknown): boolean {
  if (typeof a === 'object' || typeof b === 'object') {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return a !== b;
}

export function computeChanges(fromState: string | null, toState: string | null): AuditChange[] {
  if (!fromState || !toState) return [];

  try {
    const from = JSON.parse(fromState) as Record<string, unknown>;
    const to = JSON.parse(toState) as Record<string, unknown>;
    const changes: AuditChange[] = [];

    for (const key of Object.keys(to)) {
      const fromVal = from[key];
      const toVal = to[key];
      if (hasChanged(fromVal, toVal)) {
        changes.push({
          field: formatFieldName(key),
          from: formatValue(fromVal),
          to: formatValue(toVal),
        });
      }
    }

    return changes;
  } catch {
    return [];
  }
}

export function describeAction(
  action: AuditAction,
  flagName?: string,
  toState?: string | null,
): string {
  const name = flagName ?? 'Unknown flag';

  if (action === 'TOGGLE' && toState) {
    try {
      const parsed = JSON.parse(toState) as { enabled?: boolean };
      const state = parsed.enabled ? 'on' : 'off';
      return `"${name}" was turned ${state}`;
    } catch {
      return `"${name}" was toggled`;
    }
  }

  if (action === 'CREATE') return `"${name}" was created`;
  if (action === 'DELETE') return `"${name}" was deleted`;
  if (action === 'UPDATE') return `"${name}" was updated`;
  return `"${name}" was modified`;
}
