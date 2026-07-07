'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FlagForm } from '@/components/molecules/FlagForm/FlagForm';
import { deleteFlag } from '@/actions/flags';
import { Button } from '@/components/atoms';
import type { Flag } from '@fp/shared';
import styles from './page.module.scss';

interface EditFlagClientProps {
  flag: Flag;
  flagId: string;
}

export function EditFlagClient({ flag, flagId }: EditFlagClientProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    if (
      !window.confirm('Are you sure you want to delete this flag? This action cannot be undone.')
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteFlag(flagId);

    if ('error' in result) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }

    router.push('/flags');
  }, [flagId, router]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Edit Flag</h1>
      <FlagForm mode="edit" flag={flag} />

      <section className={styles.dangerZone}>
        <h2 className={styles.dangerTitle}>Danger Zone</h2>
        <p className={styles.dangerDescription}>
          Deleting a flag is permanent. All associated data will be removed.
        </p>
        {deleteError && (
          <div className={styles.deleteError} role="alert">
            {deleteError}
          </div>
        )}
        <Button
          label={deleting ? 'Deleting...' : 'Delete Flag'}
          onClick={handleDelete}
          disabled={deleting}
        />
      </section>
    </div>
  );
}
