import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Input } from './Input';

describe('Input', () => {
  it('renders label text', () => {
    render(<Input label="Name" name="name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('renders placeholder text', () => {
    render(<Input label="Name" name="name" placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<Input label="Name" name="name" error="Required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('has error styling when error is present', () => {
    const { container } = render(<Input label="Name" name="name" error="Required" />);
    expect(container.querySelector('input')).toHaveClass('inputError');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input label="Name" name="name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('does not show error message when error is undefined', () => {
    render(<Input label="Name" name="name" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forwards ref to input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Name" name="name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
