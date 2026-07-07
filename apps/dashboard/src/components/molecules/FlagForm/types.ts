import type { Flag } from '@fp/shared';

export interface FlagFormProps {
  mode: 'create' | 'edit';
  flag?: Flag;
  onSuccess?: () => void;
}

export interface FlagFormState {
  errors?: {
    name?: string[];
  };
  success?: boolean;
  message?: string;
}
