'use client';

import { useState, useCallback, useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createFlag, updateFlag } from '@/actions/flags';
import { Input, Button } from '@/components/atoms';
import type { FlagFormProps, FlagFormState } from './types';
import styles from './FlagForm.module.scss';

export function FlagForm({ mode, flag, onSuccess }: FlagFormProps) {
  const router = useRouter();
  // ── Controlled inputs ─────────────────────────────────────────────────────
  const [name, setName] = useState(flag?.name ?? '');
  const [description, setDescription] = useState(flag?.description ?? '');
  const [enabled, setEnabled] = useState(flag?.enabled ?? false);
  const [rolloutPct, setRolloutPct] = useState(flag?.rolloutPct ?? 50);

  // ── Wrapping action: validates before calling the Server Action ───────────
  // All field values are read from FormData (controlled inputs keep DOM in sync)
  // so the closure only needs mode and flagId — no field-state deps.
  // NOTE: flagId extracted outside useCallback so React Compiler sees a primitive
  // dependency (string | undefined) instead of inferring the whole flag object.
  const flagId = flag?.id;
  const boundAction = useCallback(
    async (prevState: FlagFormState, formData: FormData): Promise<FlagFormState> => {
      // Client-side validation
      const nameValue = formData.get('name') as string;
      if (!nameValue?.trim()) {
        return { errors: { name: ['Name is required'] } };
      }

      const data = {
        name: nameValue.trim(),
        description: ((formData.get('description') as string) ?? '').trim() || undefined,
        enabled: formData.get('enabled') === 'true',
        rolloutPct: Number(formData.get('rolloutPct')),
      };

      const result = mode === 'create' ? await createFlag(data) : await updateFlag(flagId!, data);

      if ('error' in result) {
        return { message: result.error };
      }

      return { success: true };
    },
    [mode, flagId],
  );

  const [state, formAction, isPending] = useActionState(boundAction, {} as FlagFormState);

  // ── Side effects on success ───────────────────────────────────────────────
  useEffect(() => {
    if (state?.success) {
      router.push('/flags');
      onSuccess?.();
    }
  }, [state, onSuccess, router]);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state?.message && (
        <div className={styles.serverError} role="alert">
          {state.message}
        </div>
      )}

      <Input
        label="Name"
        name="name"
        type="text"
        required
        placeholder="e.g. dark-mode-2024"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={state?.errors?.name?.[0]}
      />

      <div className={styles.field}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Enabled</label>
        <div className={styles.toggleRow}>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((prev) => !prev)}
            className={styles.toggle}
          >
            <span className={styles.srOnly}>{enabled ? 'Disable' : 'Enable'} flag</span>
          </button>
          <span className={styles.toggleLabel}>{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <input type="hidden" name="enabled" value={String(enabled)} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Rollout Percentage</label>
        <div className={styles.rolloutRow}>
          <input
            type="range"
            min="0"
            max="100"
            value={rolloutPct}
            onChange={(e) => setRolloutPct(Number(e.target.value))}
            className={styles.slider}
            aria-label="Rollout slider"
          />
          <input
            type="number"
            name="rolloutPct"
            min="0"
            max="100"
            value={rolloutPct}
            onChange={(e) => setRolloutPct(Number(e.target.value))}
            className={styles.rolloutNumber}
            aria-label="Rollout percentage"
          />
          <span className={styles.rolloutUnit}>%</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        label={
          isPending
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Flag'
              : 'Save Changes'
        }
      />
    </form>
  );
}
