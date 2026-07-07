import Link from 'next/link';
import type { Metadata } from 'next';
import { getFlags } from '@/data/flags';
import { toggleFlag } from '@/actions/flags';
import { FlagCard } from '@/components/molecules/FlagCard/FlagCard';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Flags',
};

export default async function FlagsPage() {
  const flags = await getFlags();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Feature Flags</h1>
          <Link href="/flags/new" className={styles.newButton}>
            + New Flag
          </Link>
        </div>
        <p className={styles.subtitle}>
          {flags.length} flag{flags.length !== 1 ? 's' : ''} configured
        </p>
      </header>

      {flags.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No flags yet</p>
          <p className={styles.emptyText}>Create your first feature flag to get started.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {flags.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onToggle={toggleFlag}
              editHref={`/flags/${flag.id}/edit`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
