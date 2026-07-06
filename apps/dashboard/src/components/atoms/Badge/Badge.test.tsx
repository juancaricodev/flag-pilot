import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders "Enabled" for enabled status', () => {
    render(<Badge status="enabled" />);
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('renders "Disabled" for disabled status', () => {
    render(<Badge status="disabled" />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders "Partial" for partial status', () => {
    render(<Badge status="partial" />);
    expect(screen.getByText('Partial')).toBeInTheDocument();
  });

  it('defaults to disabled when no status provided', () => {
    render(<Badge />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('applies correct color class per variant', () => {
    const { container } = render(<Badge status="enabled" />);
    expect(container.firstChild).toHaveClass('enabled');
  });
});
