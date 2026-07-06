import type { Flag } from '@fp/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlagCard } from './FlagCard';

const baseFlag: Flag = {
  id: 'flag-1',
  name: 'new-checkout',
  description: 'New checkout flow',
  enabled: true,
  rolloutPct: 50,
  status: 'partial',
  whitelist: [],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-15T12:00:00Z',
};

afterEach(() => {
  jest.restoreAllMocks();
});

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
    const flag: Flag = { ...baseFlag, status: 'enabled' };
    render(<FlagCard flag={flag} />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows "Disabled" badge when flag is disabled', () => {
    const flag: Flag = { ...baseFlag, enabled: false, status: 'disabled' };
    render(<FlagCard flag={flag} />);

    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders the rollout percentage', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders "0%" when rollout is 0', () => {
    const flag: Flag = { ...baseFlag, rolloutPct: 0, status: 'enabled' };
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

describe('FlagCard toggle', () => {
  it('renders toggle with aria-checked="true" when flag is enabled', () => {
    render(<FlagCard flag={baseFlag} onToggle={jest.fn()} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders toggle with aria-checked="false" when flag is disabled', () => {
    const flag = { ...baseFlag, enabled: false };
    render(<FlagCard flag={flag} onToggle={jest.fn()} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('does not render toggle when onToggle is not provided', () => {
    render(<FlagCard flag={baseFlag} />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('calls onToggle after confirm returns true', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const onToggle = jest.fn().mockResolvedValue(undefined);
    render(<FlagCard flag={baseFlag} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith('flag-1', false);
    });
  });

  it('does not call onToggle when confirm returns false', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const onToggle = jest.fn().mockResolvedValue(undefined);
    render(<FlagCard flag={baseFlag} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('switch'));

    // Give microtasks a chance to run
    await Promise.resolve();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('disables toggle while pending', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const onToggle = jest.fn().mockReturnValue(new Promise<void>(() => {}));
    render(<FlagCard flag={baseFlag} onToggle={onToggle} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toBeDisabled();
    });
  });

  it('re-enables toggle after onToggle settles', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    let resolveToggle!: (value: void | PromiseLike<void>) => void;
    const togglePromise = new Promise<void>((resolve) => {
      resolveToggle = resolve;
    });
    const onToggle = jest.fn().mockReturnValue(togglePromise);

    render(<FlagCard flag={baseFlag} onToggle={onToggle} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toBeDisabled();
    });

    resolveToggle();

    await waitFor(() => {
      expect(toggle).not.toBeDisabled();
    });
  });
});
