import { describeAction, formatValue, formatFieldName, computeChanges } from './auditDisplay';
import type { AuditAction } from '@fp/shared';

describe('formatValue', () => {
  it('returns "(none)" for null', () => {
    expect(formatValue(null)).toBe('(none)');
  });

  it('returns "(none)" for undefined', () => {
    expect(formatValue(undefined)).toBe('(none)');
  });

  it('returns "on" for true', () => {
    expect(formatValue(true)).toBe('on');
  });

  it('returns "off" for false', () => {
    expect(formatValue(false)).toBe('off');
  });

  it('returns the number as string', () => {
    expect(formatValue(50)).toBe('50');
  });

  it('joins array elements with comma-space', () => {
    expect(formatValue(['a', 'b'])).toBe('a, b');
  });

  it('returns "(empty)" for empty array', () => {
    expect(formatValue([])).toBe('(empty)');
  });

  it('returns the string as-is', () => {
    expect(formatValue('hello')).toBe('hello');
  });
});

describe('formatFieldName', () => {
  it('returns "rollout" for rolloutPct', () => {
    expect(formatFieldName('rolloutPct')).toBe('rollout');
  });

  it('returns "whitelist" for whitelist', () => {
    expect(formatFieldName('whitelist')).toBe('whitelist');
  });

  it('returns "name" for name', () => {
    expect(formatFieldName('name')).toBe('name');
  });

  it('returns "description" for description', () => {
    expect(formatFieldName('description')).toBe('description');
  });
});

describe('describeAction', () => {
  it('returns created description for CREATE', () => {
    expect(describeAction('CREATE' as AuditAction, 'my-flag')).toBe('"my-flag" was created');
  });

  it('returns turned on for TOGGLE with enabled=true', () => {
    const toState = JSON.stringify({ enabled: true });
    expect(describeAction('TOGGLE' as AuditAction, 'my-flag', toState)).toBe(
      '"my-flag" was turned on',
    );
  });

  it('returns turned off for TOGGLE with enabled=false', () => {
    const toState = JSON.stringify({ enabled: false });
    expect(describeAction('TOGGLE' as AuditAction, 'my-flag', toState)).toBe(
      '"my-flag" was turned off',
    );
  });

  it('returns toggled for TOGGLE with invalid JSON toState', () => {
    expect(describeAction('TOGGLE' as AuditAction, 'my-flag', 'not-json')).toBe(
      '"my-flag" was toggled',
    );
  });

  it('returns updated description for UPDATE', () => {
    expect(describeAction('UPDATE' as AuditAction, 'my-flag')).toBe('"my-flag" was updated');
  });

  it('returns deleted description for DELETE', () => {
    expect(describeAction('DELETE' as AuditAction, 'my-flag')).toBe('"my-flag" was deleted');
  });

  it('returns "Unknown flag" when flagName is undefined', () => {
    expect(describeAction('CREATE' as AuditAction)).toBe('"Unknown flag" was created');
  });
});

describe('computeChanges', () => {
  it('returns changes for differing fields', () => {
    const from = JSON.stringify({ name: 'old', description: 'old desc', rolloutPct: 10 });
    const to = JSON.stringify({ name: 'new', description: 'new desc', rolloutPct: 50 });
    const changes = computeChanges(from, to);

    expect(changes).toHaveLength(3);
    expect(changes).toContainEqual({ field: 'name', from: 'old', to: 'new' });
    expect(changes).toContainEqual({ field: 'description', from: 'old desc', to: 'new desc' });
    expect(changes).toContainEqual({ field: 'rollout', from: '10', to: '50' });
  });

  it('does not include fields that have not changed', () => {
    const from = JSON.stringify({ name: 'same', rolloutPct: 50 });
    const to = JSON.stringify({ name: 'same', rolloutPct: 50 });
    const changes = computeChanges(from, to);

    expect(changes).toHaveLength(0);
  });

  it('returns empty array when fromState is null', () => {
    expect(computeChanges(null, JSON.stringify({ name: 'a' }))).toHaveLength(0);
  });

  it('returns empty array when toState is null', () => {
    expect(computeChanges(JSON.stringify({ name: 'a' }), null)).toHaveLength(0);
  });

  it('returns empty array when both states are null', () => {
    expect(computeChanges(null, null)).toHaveLength(0);
  });

  it('returns empty array when states are identical', () => {
    const state = JSON.stringify({ name: 'flag', rolloutPct: 25 });
    expect(computeChanges(state, state)).toHaveLength(0);
  });

  it('handles whitelist array changes correctly', () => {
    const from = JSON.stringify({ whitelist: ['user-a', 'user-b'] });
    const to = JSON.stringify({ whitelist: ['user-a', 'user-c'] });
    const changes = computeChanges(from, to);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      field: 'whitelist',
      from: 'user-a, user-b',
      to: 'user-a, user-c',
    });
  });

  it('returns empty array on invalid JSON gracefully', () => {
    expect(computeChanges('not-json', 'also-not-json')).toHaveLength(0);
  });
});
