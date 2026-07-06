import { forwardRef } from 'react';
import type { ButtonProps } from './types';
import styles from './Button.module.scss';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ label, variant = 'primary', className = '', ...props }, ref) => {
    return (
      <button ref={ref} className={`${styles.button} ${styles[variant]} ${className}`} {...props}>
        {label}
      </button>
    );
  },
);

Button.displayName = 'Button';
