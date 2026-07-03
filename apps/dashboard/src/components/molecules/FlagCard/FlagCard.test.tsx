import { render, screen } from '@testing-library/react';
import { FlagCard } from './FlagCard';

const baseFlag = {
  id: 'flag-1',
  name: 'new-checkout',
  description: 'New checkout flow',
  enabled: true,
  rolloutPct: 50,
  whitelist: [],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-15T12:00:00Z',
};

describe('FlagCard', () => {
  it('renders the flag name', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.getByText('new-checkout')).toBeInTheDocument();
  });

  it('renders the flag description', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.getByText('New checkout flow')).toBeInTheDocument();
  });

  it('renders "No description" when description is null', () => {
    const flag = { ...baseFlag, description: null };
    render(<FlagCard flag={flag} />);

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows "Enabled" badge when flag is enabled', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows "Disabled" badge when flag is disabled', () => {
    const flag = { ...baseFlag, enabled: false };
    render(<FlagCard flag={flag} />);

    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders the rollout percentage', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders "0%" when rollout is 0', () => {
    const flag = { ...baseFlag, rolloutPct: 0 };
    render(<FlagCard flag={flag} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders the last updated date', () => {
    render(<FlagCard flag={baseFlag} />);

    // "Updated" text should be present (exact date format may vary)
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('renders whitelist count when there are whitelisted users', () => {
    const flag = { ...baseFlag, whitelist: ['user-1', 'user-2'] };
    render(<FlagCard flag={flag} />);

    expect(screen.getByText('2 whitelisted')).toBeInTheDocument();
  });

  it('does not render whitelist count when whitelist is empty', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.queryByText(/whitelisted/)).not.toBeInTheDocument();
  });

  it('renders the key label', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.getByText('KEY')).toBeInTheDocument();
  });
});
