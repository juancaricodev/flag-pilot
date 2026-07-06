import type { BadgeProps } from './types';
import styles from './Badge.module.scss';

const STATUS_LABELS: Record<string, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
  partial: 'Partial',
};

export function Badge({ status = 'disabled' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[status]}`}>{STATUS_LABELS[status]}</span>;
}
