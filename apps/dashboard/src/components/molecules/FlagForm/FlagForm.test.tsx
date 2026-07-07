import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlagForm } from './FlagForm';
import type { Flag } from '@fp/shared';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCreateFlag = jest.fn();
const mockUpdateFlag = jest.fn();
const mockOnSuccess = jest.fn();
const mockPush = jest.fn();

jest.mock('@/actions/flags', () => ({
  createFlag: (...args: unknown[]) => mockCreateFlag(...args),
  updateFlag: (...args: unknown[]) => mockUpdateFlag(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockFlag: Flag = {
  id: 'flag-1',
  name: 'Feature X',
  description: 'Enable feature X for beta users',
  enabled: true,
  rolloutPct: 25,
  whitelist: [],
  status: 'partial',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z',
};

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks();
  mockCreateFlag.mockImplementation(() => Promise.resolve({ success: true, flag: mockFlag }));
  mockUpdateFlag.mockImplementation(() => Promise.resolve({ success: true, flag: mockFlag }));
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('FlagForm', () => {
  describe('create mode', () => {
    it('renders all form fields', () => {
      render(<FlagForm mode="create" />);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: 'Rollout slider' })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Rollout percentage' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Flag' })).toBeInTheDocument();
    });

    it('renders empty fields and default values', () => {
      render(<FlagForm mode="create" />);

      expect(screen.getByLabelText('Name')).toHaveValue('');
      expect(screen.getByLabelText('Description')).toHaveValue('');
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('slider', { name: 'Rollout slider' })).toHaveValue('0');
      expect(screen.getByRole('spinbutton', { name: 'Rollout percentage' })).toHaveValue(0);
      expect(screen.getByRole('slider', { name: 'Rollout slider' })).toBeDisabled();
      expect(screen.getByRole('spinbutton', { name: 'Rollout percentage' })).toBeDisabled();
    });

    it('shows validation error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<FlagForm mode="create" />);

      await user.click(screen.getByRole('button', { name: 'Create Flag' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Name is required');
    });

    it('does not show any alert on initial render', () => {
      render(<FlagForm mode="create" />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calls createFlag, redirects, and triggers onSuccess on successful create', async () => {
      mockCreateFlag.mockImplementation(() => Promise.resolve({ success: true, flag: mockFlag }));
      const user = userEvent.setup();

      render(<FlagForm mode="create" onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText('Name'), 'New Feature');
      await user.click(screen.getByRole('button', { name: 'Create Flag' }));

      // Wait for the action to complete and onSuccess to fire
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });

      expect(mockPush).toHaveBeenCalledWith('/flags');
      expect(mockCreateFlag).toHaveBeenCalledTimes(1);
      expect(mockCreateFlag).toHaveBeenCalledWith({
        name: 'New Feature',
        description: undefined,
        enabled: false,
        rolloutPct: 0,
      });
    });

    it('shows server error message when action fails', async () => {
      mockCreateFlag.mockImplementation(() => Promise.resolve({ error: 'Name already taken' }));
      const user = userEvent.setup();

      render(<FlagForm mode="create" />);

      await user.type(screen.getByLabelText('Name'), 'Duplicate');
      await user.click(screen.getByRole('button', { name: 'Create Flag' }));

      // Wait for the action to complete (button re-enables)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Flag' })).not.toBeDisabled();
      });

      expect(mockCreateFlag).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('alert')).toHaveTextContent('Name already taken');
    });
  });

  describe('edit mode', () => {
    it('renders form fields with pre-populated data', () => {
      render(<FlagForm mode="edit" flag={mockFlag} />);

      expect(screen.getByLabelText('Name')).toHaveValue('Feature X');
      expect(screen.getByLabelText('Description')).toHaveValue('Enable feature X for beta users');
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('slider', { name: 'Rollout slider' })).toHaveValue('25');
      expect(screen.getByRole('spinbutton', { name: 'Rollout percentage' })).toHaveValue(25);
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });

    it('calls updateFlag, redirects, and triggers onSuccess on successful edit', async () => {
      mockUpdateFlag.mockImplementation(() => Promise.resolve({ success: true, flag: mockFlag }));
      const user = userEvent.setup();

      render(<FlagForm mode="edit" flag={mockFlag} onSuccess={mockOnSuccess} />);

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Wait for the action to complete (button re-enables)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save Changes' })).not.toBeDisabled();
      });

      expect(mockPush).toHaveBeenCalledWith('/flags');
      expect(mockUpdateFlag).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockUpdateFlag).toHaveBeenCalledWith('flag-1', {
        name: 'Feature X',
        description: 'Enable feature X for beta users',
        enabled: true,
        rolloutPct: 25,
      });
    });
  });

  describe('rollout sync', () => {
    it('syncs number input to slider when typing', async () => {
      const user = userEvent.setup();
      render(<FlagForm mode="create" />);

      // Enable the flag first so rollout inputs are not disabled
      await user.click(screen.getByRole('switch'));

      const slider = screen.getByRole('slider', { name: 'Rollout slider' });
      const numberInput = screen.getByRole('spinbutton', { name: 'Rollout percentage' });

      await user.clear(numberInput);
      await user.type(numberInput, '75');

      expect(slider).toHaveValue('75');
    });

    it('syncs slider to number input when dragging', async () => {
      const user = userEvent.setup();
      render(<FlagForm mode="create" />);

      // Enable the flag first so rollout inputs are not disabled
      await user.click(screen.getByRole('switch'));

      const slider = screen.getByRole('slider', { name: 'Rollout slider' });
      const numberInput = screen.getByRole('spinbutton', { name: 'Rollout percentage' });

      fireEvent.change(slider, { target: { value: '75' } });

      expect(numberInput).toHaveValue(75);
    });
  });

  describe('toggle', () => {
    it('toggles enabled state on click', async () => {
      const user = userEvent.setup();
      render(<FlagForm mode="create" />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'true');

      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('loading state (runs last to avoid leaking unresolved promises)', () => {
    it('disables submit button while pending in create mode', async () => {
      mockCreateFlag.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();

      render(<FlagForm mode="create" />);

      await user.type(screen.getByLabelText('Name'), 'New Feature');
      await user.click(screen.getByRole('button', { name: 'Create Flag' }));

      expect(await screen.findByRole('button', { name: 'Creating...' })).toBeDisabled();
    });

    it('shows loading state while pending in edit mode', async () => {
      mockUpdateFlag.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();

      render(<FlagForm mode="edit" flag={mockFlag} />);

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(await screen.findByRole('button', { name: 'Saving...' })).toBeDisabled();
    });
  });
});
