import { render, screen } from '@testing-library/react';
import { MetricsTable } from './MetricsTable';
import type { FlagMetrics } from '@fp/shared';

describe('MetricsTable', () => {
  const mockFlags: FlagMetrics[] = [
    {
      flagId: 'flag-1',
      flagName: 'beta-feature',
      total: 680,
      enabled: 170,
      disabled: 510,
    },
    {
      flagId: 'flag-2',
      flagName: 'new-checkout',
      total: 500,
      enabled: 300,
      disabled: 200,
    },
  ];

  it('renders table headers', () => {
    render(<MetricsTable flags={mockFlags} />);
    expect(screen.getByText('Flag')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders flag rows with correct data', () => {
    render(<MetricsTable flags={mockFlags} />);
    expect(screen.getByText('beta-feature')).toBeInTheDocument();
    expect(screen.getByText('new-checkout')).toBeInTheDocument();
    expect(screen.getByText('170')).toBeInTheDocument();
    expect(screen.getByText('510')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    const flags: FlagMetrics[] = [
      {
        flagId: 'flag-1',
        flagName: 'large-flag',
        total: 1234567,
        enabled: 1000000,
        disabled: 234567,
      },
    ];
    render(<MetricsTable flags={flags} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
    expect(screen.getByText('234,567')).toBeInTheDocument();
  });

  it('renders empty table body when no flags', () => {
    render(<MetricsTable flags={[]} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /flag/i })).toBeInTheDocument(); // header only
  });
});
