import { formatDateTime } from '@/utils/formatDateTime';
import { ACTION_LABELS, computeChanges, describeAction } from '@/utils/auditDisplay';
import type { AuditEntryProps } from './types';
import type { AuditAction } from '@fp/shared';
import styles from './AuditEntry.module.scss';

export function AuditEntry({ entry }: AuditEntryProps) {
  const { action, flagName, fromState, toState, reason, createdAt } = entry;
  const description = describeAction(action as AuditAction, flagName, toState);
  const changes =
    action === 'UPDATE' || action === 'TOGGLE' ? computeChanges(fromState, toState) : [];

  return (
    <div className={styles.entry}>
      <div className={`${styles.dot} ${styles[action.toLowerCase()]}`} aria-hidden="true" />
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={`${styles.badge} ${styles[action.toLowerCase()]}`}>
            {ACTION_LABELS[action as AuditAction] ?? action}
          </span>
          <span className={styles.description}>{description}</span>
        </div>
        {changes.length > 0 && (
          <ul className={styles.changes}>
            {changes.map((c) => (
              <li key={c.field} className={styles.change}>
                <span className={styles.changeField}>{c.field}:</span>{' '}
                <span className={styles.changeValue}>{c.from}</span>
                <span className={styles.changeArrow}>&rarr;</span>
                <span className={styles.changeValue}>{c.to}</span>
              </li>
            ))}
          </ul>
        )}
        {reason && <p className={styles.reason}>{reason}</p>}
        <span className={styles.timestamp}>{formatDateTime(createdAt)}</span>
      </div>
    </div>
  );
}
