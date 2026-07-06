export type BadgeStatus = 'enabled' | 'disabled' | 'partial';

export interface BadgeProps {
  status?: BadgeStatus;
}
