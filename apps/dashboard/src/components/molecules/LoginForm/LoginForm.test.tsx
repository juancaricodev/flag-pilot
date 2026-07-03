import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock('@/actions/auth', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  it('renders email input', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders heading and subtitle', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Enter your credentials to access the dashboard')).toBeInTheDocument();
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      error: 'Invalid email or password',
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'bad@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('calls login with form data on submit', async () => {
    mockLogin.mockResolvedValue({ success: true });

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Wait for async action to complete
    await screen.findByRole('button', { name: 'Sign in' });

    expect(mockLogin).toHaveBeenCalledTimes(1);
    // First arg is prevState (null), second is FormData
    const formData = mockLogin.mock.calls[0][1];
    expect(formData.get('email')).toBe('admin@example.com');
    expect(formData.get('password')).toBe('password123');
  });

  it('shows loading state while submitting', async () => {
    // Return a promise that never resolves to keep isPending true
    mockLogin.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });

  it('does not show error alert on initial render', () => {
    render(<LoginForm />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
