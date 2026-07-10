import type { Metadata } from 'next';
import { getAuditLogs } from '@/data/audit';
import { AuditEntry } from '@/components/molecules/AuditEntry';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Audit Log',
};

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Audit Log</h1>
        <p className={styles.subtitle}>
          {logs.length} event{logs.length !== 1 ? 's' : ''} recorded
        </p>
      </header>

      {logs.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No audit entries yet</p>
          <p className={styles.emptyText}>
            Audit events will appear here when flags are created, toggled, updated, or deleted.
          </p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {logs.map((entry) => (
            <AuditEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
