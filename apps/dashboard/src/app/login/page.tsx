import type { Metadata } from 'next';
import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return <LoginForm />;
}
