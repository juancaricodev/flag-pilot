import { render, screen } from '@testing-library/react';
import { AuditEntry } from './AuditEntry';
import type { AuditLogEntry } from '@fp/shared';

const baseEntry: AuditLogEntry = {
  id: 'audit-1',
  flagId: 'flag-1',
  flagName: 'dark-mode',
  action: 'CREATE',
  fromState: null,
  toState: null,
  reason: null,
  createdAt: '2026-06-25T10:00:00Z',
};

describe('AuditEntry', () => {
  it('renders a CREATE entry', () => {
    render(<AuditEntry entry={baseEntry} />);

    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText(/"dark-mode" was created/)).toBeInTheDocument();
  });

  it('renders a TOGGLE entry with "turned on" when enabled', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'TOGGLE',
      toState: JSON.stringify({ name: 'dark-mode', enabled: true }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText('Toggled')).toBeInTheDocument();
    expect(screen.getByText(/"dark-mode" was turned on/)).toBeInTheDocument();
  });

  it('renders a TOGGLE entry with "turned off" when disabled', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'TOGGLE',
      toState: JSON.stringify({ name: 'dark-mode', enabled: false }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/"dark-mode" was turned off/)).toBeInTheDocument();
  });

  it('renders a TOGGLE entry with name and enabled changes showing diffs', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'TOGGLE',
      flagName: 'new-name',
      fromState: JSON.stringify({
        name: 'old-name',
        enabled: false,
        description: 'desc',
        rolloutPct: 50,
        whitelist: [],
      }),
      toState: JSON.stringify({
        name: 'new-name',
        enabled: true,
        description: 'desc',
        rolloutPct: 50,
        whitelist: [],
      }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/"new-name" was turned on/)).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText(/old-name/)).toBeInTheDocument();
    expect(screen.getByText(/enabled/)).toBeInTheDocument();
    // Old name should not appear in the description
    expect(screen.queryByText(/"old-name" was turned on/)).not.toBeInTheDocument();
  });

  it('renders a TOGGLE entry without fromState showing no diffs', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'TOGGLE',
      fromState: null,
      toState: JSON.stringify({ name: 'dark-mode', enabled: true }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/"dark-mode" was turned on/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a TOGGLE entry with identical fromState and toState showing no diffs', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'TOGGLE',
      fromState: JSON.stringify({ name: 'dark-mode', enabled: true }),
      toState: JSON.stringify({ name: 'dark-mode', enabled: true }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/"dark-mode" was turned on/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders an UPDATE entry with changes', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'UPDATE',
      fromState: JSON.stringify({
        name: 'dark-mode',
        description: 'Old',
        enabled: true,
        rolloutPct: 50,
        whitelist: [],
      }),
      toState: JSON.stringify({
        name: 'dark-mode',
        description: 'New',
        enabled: true,
        rolloutPct: 75,
        whitelist: [],
      }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.getByText(/"dark-mode" was updated/)).toBeInTheDocument();
    expect(screen.getByText(/description/)).toBeInTheDocument();
    expect(screen.getByText(/Old/)).toBeInTheDocument();
    expect(screen.getByText(/New/)).toBeInTheDocument();
    expect(screen.getByText(/rollout/)).toBeInTheDocument();

    // Should NOT show fields that didn't change
    expect(screen.queryByText(/enabled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/name/)).not.toBeInTheDocument();
  });

  it('renders an UPDATE entry with whitelist changes', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'UPDATE',
      fromState: JSON.stringify({
        name: 'dark-mode',
        description: null,
        enabled: true,
        rolloutPct: 100,
        whitelist: ['user-a'],
      }),
      toState: JSON.stringify({
        name: 'dark-mode',
        description: 'New desc',
        enabled: true,
        rolloutPct: 100,
        whitelist: ['user-a', 'user-b'],
      }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/whitelist/)).toBeInTheDocument();
    expect(screen.getByText(/user-a, user-b/)).toBeInTheDocument();
  });

  it('renders an UPDATE entry without changes when fromState is null', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'UPDATE',
      fromState: null,
      toState: JSON.stringify({ name: 'dark-mode', enabled: true }),
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/"dark-mode" was updated/)).toBeInTheDocument();
    // Should not render a changes list
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a DELETE entry', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      action: 'DELETE',
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByText(/"dark-mode" was deleted/)).toBeInTheDocument();
  });

  it('renders reason when provided', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      reason: 'Enabled for testing',
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText('Enabled for testing')).toBeInTheDocument();
  });

  it('renders without flagName gracefully', () => {
    const entry: AuditLogEntry = {
      ...baseEntry,
      flagName: undefined,
    };
    render(<AuditEntry entry={entry} />);

    expect(screen.getByText(/"Unknown flag" was created/)).toBeInTheDocument();
  });

  it('renders the formatted timestamp', () => {
    render(<AuditEntry entry={baseEntry} />);

    expect(screen.getByText('Jun 25, 2026, 10:00 AM')).toBeInTheDocument();
  });
});
