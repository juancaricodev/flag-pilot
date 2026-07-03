'use client';

import { formatDate } from '@/utils/formatDate';
import type { FlagCardProps } from './types';
import styles from './FlagCard.module.scss';

export function FlagCard({ flag }: FlagCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{flag.name}</h3>
        <span
          className={`${styles.badge} ${flag.enabled ? styles.badgeEnabled : styles.badgeDisabled}`}
        >
          {flag.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <p className={styles.description}>
        {flag.description ?? <span className={styles.noDescription}>No description</span>}
      </p>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>ROLLOUT</span>
          <span className={styles.metaValue}>{flag.rolloutPct}%</span>
        </div>

        {flag.whitelist.length > 0 && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>USERS</span>
            <span className={styles.metaValue}>{flag.whitelist.length} whitelisted</span>
          </div>
        )}

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>KEY</span>
          <span className={styles.metaValue}>{flag.id}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.updated}>Updated {formatDate(flag.updatedAt)}</span>
      </div>
    </article>
  );
}
