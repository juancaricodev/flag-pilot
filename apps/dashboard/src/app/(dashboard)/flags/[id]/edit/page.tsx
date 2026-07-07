import { getFlag } from '@/data/flags';
import { EditFlagClient } from './EditFlagClient';
import styles from './page.module.scss';

export default async function EditFlagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let flag;
  let error: string | null = null;

  try {
    flag = await getFlag(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load flag';
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!flag) {
    return (
      <div className={styles.page}>
        <div className={styles.error} role="alert">
          Flag not found
        </div>
      </div>
    );
  }

  return <EditFlagClient flag={flag} flagId={id} />;
}
