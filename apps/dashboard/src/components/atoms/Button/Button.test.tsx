import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label text', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<Button label="Click me" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when disabled', async () => {
    const onClick = jest.fn();
    render(<Button label="Click me" onClick={onClick} disabled />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies primary class by default', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button')).toHaveClass('primary');
  });

  it('applies secondary class when variant is secondary', () => {
    render(<Button label="Click me" variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('secondary');
  });

  it('applies ghost class when variant is ghost', () => {
    render(<Button label="Click me" variant="ghost" />);
    expect(screen.getByRole('button')).toHaveClass('ghost');
  });

  it('has disabled attribute when disabled', () => {
    render(<Button label="Click me" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards ref to button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button label="Click me" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
