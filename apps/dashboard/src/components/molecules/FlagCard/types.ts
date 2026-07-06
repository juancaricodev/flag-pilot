import type { Flag } from '@fp/shared';

export interface FlagCardProps {
  flag: Flag;
  onToggle?: (flagId: string, enabled: boolean) => Promise<unknown>;
}
