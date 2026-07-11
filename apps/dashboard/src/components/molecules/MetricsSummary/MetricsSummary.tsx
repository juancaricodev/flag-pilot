import styles from './MetricsSummary.module.scss';

interface MetricsSummaryProps {
  totalEvaluations: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function MetricsSummary({ totalEvaluations }: MetricsSummaryProps) {
  return (
    <div className={styles.container}>
      <p className={styles.total}>{formatNumber(totalEvaluations)} total evaluations</p>
    </div>
  );
}
