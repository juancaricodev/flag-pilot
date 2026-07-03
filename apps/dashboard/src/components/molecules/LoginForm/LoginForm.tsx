'use client';

import { useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import styles from './LoginForm.module.scss';

const initialState = null as null | { success: false; error: string };

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Handle successful login — redirect to flags
  if (state?.success) {
    // Use startTransition to avoid React warning during render
    startTransition(() => {
      router.push('/flags');
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Enter your credentials to access the dashboard</p>

        <form action={formAction}>
          {state && !state.success && (
            <div className={styles.error} role="alert">
              {state.error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@example.com"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={isPending} className={styles.button}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
