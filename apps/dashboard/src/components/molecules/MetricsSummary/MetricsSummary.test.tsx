import { render, screen } from '@testing-library/react';
import { MetricsSummary } from './MetricsSummary';

describe('MetricsSummary', () => {
  it('renders total evaluation count', () => {
    render(<MetricsSummary totalEvaluations={1500} />);
    expect(screen.getByText('1,500 total evaluations')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(<MetricsSummary totalEvaluations={1234567} />);
    expect(screen.getByText('1,234,567 total evaluations')).toBeInTheDocument();
  });

  it('renders zero evaluations', () => {
    render(<MetricsSummary totalEvaluations={0} />);
    expect(screen.getByText('0 total evaluations')).toBeInTheDocument();
  });
});
