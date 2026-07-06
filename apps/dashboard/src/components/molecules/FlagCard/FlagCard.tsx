'use client';

import { useState } from 'react';
import { formatDate } from '@/utils/formatDate';
import { Badge } from '@/components/atoms';
import type { FlagCardProps } from './types';
import styles from './FlagCard.module.scss';

export function FlagCard({ flag, onToggle }: FlagCardProps) {
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    const action = flag.enabled ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} "${flag.name}"?`)) return;

    setIsPending(true);
    try {
      await onToggle!(flag.id, !flag.enabled);
    } catch {
      // Error handled silently — button re-enables for retry
    } finally {
      setIsPending(false);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{flag.name}</h3>
        <Badge status={flag.status} />
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
        {onToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={flag.enabled}
            disabled={isPending}
            onClick={handleToggle}
            className={styles.toggle}
          >
            <span className={styles.srOnly}>
              {flag.enabled ? 'Disable' : 'Enable'} {flag.name}
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
