import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const mockLogout = jest.fn();
let mockPathname = '/flags';

jest.mock('@/actions/auth', () => ({
  logout: (...args: unknown[]) => mockLogout(...args),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    ['aria-current']?: 'page';
  }) {
    return <a {...props}>{children}</a>;
  };
});

beforeEach(() => {
  mockPathname = '/flags';
});

describe('Sidebar', () => {
  it('renders brand name "Flag Pilot"', () => {
    render(<Sidebar />);

    expect(screen.getByText('Flag Pilot')).toBeInTheDocument();
  });

  it('renders all three navigation links with correct hrefs', () => {
    render(<Sidebar />);

    const flagsLink = screen.getByText('Flags');
    const auditLink = screen.getByText('Audit Log');
    const metricsLink = screen.getByText('Metrics');

    expect(flagsLink).toBeInTheDocument();
    expect(flagsLink.closest('a')).toHaveAttribute('href', '/flags');

    expect(auditLink).toBeInTheDocument();
    expect(auditLink.closest('a')).toHaveAttribute('href', '/audit');

    expect(metricsLink).toBeInTheDocument();
    expect(metricsLink.closest('a')).toHaveAttribute('href', '/metrics');
  });

  it('renders sign out button', () => {
    render(<Sidebar />);

    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('highlights active link for /flags', () => {
    mockPathname = '/flags';
    const { container } = render(<Sidebar />);

    const flagsLink = container.querySelector('a[href="/flags"]');
    expect(flagsLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not highlight inactive links when on /flags', () => {
    mockPathname = '/flags';
    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/audit"]')).not.toHaveAttribute('aria-current');
    expect(container.querySelector('a[href="/metrics"]')).not.toHaveAttribute('aria-current');
  });

  it('highlights active link for /metrics when pathname changes', () => {
    mockPathname = '/metrics';
    const { container } = render(<Sidebar />);

    const metricsLink = container.querySelector('a[href="/metrics"]');
    expect(metricsLink).toHaveAttribute('aria-current', 'page');

    expect(container.querySelector('a[href="/flags"]')).not.toHaveAttribute('aria-current');
    expect(container.querySelector('a[href="/audit"]')).not.toHaveAttribute('aria-current');
  });

  it('logout form exists with button type submit', () => {
    render(<Sidebar />);

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();

    const button = screen.getByText('Sign out');
    expect(button.closest('button')).toHaveAttribute('type', 'submit');
  });
});
