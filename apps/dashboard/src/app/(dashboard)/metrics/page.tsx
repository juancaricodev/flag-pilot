import type { Metadata } from 'next';
import type { FlagMetrics } from '@fp/shared';
import { getMetrics } from '@/data/metrics';
import { MetricsSummary } from '@/components/molecules/MetricsSummary';
import { MetricsTable } from '@/components/organisms/MetricsTable';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Metrics',
};

export default async function MetricsPage() {
  let totalEvaluations = 0;
  let flags: FlagMetrics[] = [];
  let error: string | null = null;

  try {
    const metrics = await getMetrics();
    totalEvaluations = metrics.totalEvaluations;
    flags = metrics.flags;
  } catch (e) {
    error = e instanceof Error ? e.message : 'An unexpected error occurred';
  }

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Metrics</h1>
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Metrics could not be loaded</p>
          <p className={styles.emptyText}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Metrics</h1>
      </header>

      <MetricsSummary totalEvaluations={totalEvaluations} />

      {flags.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No evaluation data yet</p>
          <p className={styles.emptyText}>
            Evaluation data will appear here once flags are evaluated by the SDK.
          </p>
        </div>
      ) : (
        <MetricsTable flags={flags} />
      )}
    </div>
  );
}
