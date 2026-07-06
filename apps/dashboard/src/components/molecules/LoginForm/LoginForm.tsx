'use client';

import { useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/actions/auth';
import { Input, Button } from '@/components/atoms';
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

        <form action={formAction} className={styles.form}>
          {state && !state.success && (
            <div className={styles.error} role="alert">
              {state.error}
            </div>
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="admin@example.com"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
          />

          <Button
            type="submit"
            disabled={isPending}
            label={isPending ? 'Signing in...' : 'Sign in'}
          />
        </form>
      </div>
    </div>
  );
}
