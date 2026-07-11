import type { FlagMetrics } from '@fp/shared';
import styles from './MetricsTable.module.scss';

interface MetricsTableProps {
  flags: FlagMetrics[];
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function MetricsTable({ flags }: MetricsTableProps) {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Flag</th>
            <th className={styles.th}>Total</th>
            <th className={styles.th}>Enabled</th>
            <th className={styles.th}>Disabled</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.flagId} className={styles.row}>
              <td className={styles.td}>{flag.flagName}</td>
              <td className={styles.td}>{formatNumber(flag.total)}</td>
              <td className={styles.td}>{formatNumber(flag.enabled)}</td>
              <td className={styles.td}>{formatNumber(flag.disabled)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
