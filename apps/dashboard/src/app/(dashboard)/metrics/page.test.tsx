import { render, screen } from '@testing-library/react';
import MetricsPage from './page';
import { getMetrics } from '@/data/metrics';

jest.mock('@/data/metrics');

const mockedGetMetrics = getMetrics as jest.MockedFunction<typeof getMetrics>;

describe('MetricsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Metrics heading', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 1500,
      flags: [],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByRole('heading', { name: /metrics/i })).toBeInTheDocument();
  });

  it('renders the total evaluation count formatted with commas', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 1500,
      flags: [],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByText('1,500 total evaluations')).toBeInTheDocument();
  });

  it('renders the table with flag stats', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 1500,
      flags: [
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
      ],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('beta-feature')).toBeInTheDocument();
    expect(screen.getByText('new-checkout')).toBeInTheDocument();
    expect(screen.getByText('170')).toBeInTheDocument();
    expect(screen.getByText('510')).toBeInTheDocument();
  });

  it('renders table headers: Flag, Total, Enabled, Disabled', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 100,
      flags: [
        {
          flagId: 'flag-1',
          flagName: 'dark-mode',
          total: 100,
          enabled: 60,
          disabled: 40,
        },
      ],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByText('Flag')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders empty state when no evaluations', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 0,
      flags: [],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByText('No evaluation data yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders error state when getMetrics throws', async () => {
    mockedGetMetrics.mockRejectedValue(new Error('Failed to fetch metrics (500)'));

    const page = await MetricsPage();
    render(page);

    expect(screen.getByText(/metrics could not be loaded/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('formats large numbers with commas in the summary', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 1234567,
      flags: [],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByText('1,234,567 total evaluations')).toBeInTheDocument();
  });

  it('renders a single flag row', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 42,
      flags: [
        {
          flagId: 'flag-1',
          flagName: 'dark-mode',
          total: 42,
          enabled: 42,
          disabled: 0,
        },
      ],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('dark-mode')).toBeInTheDocument();
    expect(screen.getAllByText('42')).toHaveLength(2); // total and enabled
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders flags in order as provided by the API', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 1000,
      flags: [
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
        {
          flagId: 'flag-3',
          flagName: 'dark-mode',
          total: 320,
          enabled: 320,
          disabled: 0,
        },
      ],
    });

    const page = await MetricsPage();
    render(page);

    const rows = screen.getAllByRole('row');
    // header row + 3 data rows = 4 total
    expect(rows).toHaveLength(4);

    // First data row should be beta-feature (highest total)
    expect(rows[1]).toHaveTextContent('beta-feature');
    expect(rows[2]).toHaveTextContent('new-checkout');
    expect(rows[3]).toHaveTextContent('dark-mode');
  });

  it('shows heading and summary even with zero evaluations', async () => {
    mockedGetMetrics.mockResolvedValue({
      totalEvaluations: 0,
      flags: [],
    });

    const page = await MetricsPage();
    render(page);

    expect(screen.getByRole('heading', { name: /metrics/i })).toBeInTheDocument();
    expect(screen.getByText('0 total evaluations')).toBeInTheDocument();
  });
});
