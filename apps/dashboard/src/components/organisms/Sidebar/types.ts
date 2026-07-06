export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Flags', href: '/flags' },
  { label: 'Audit Log', href: '/audit' },
  { label: 'Metrics', href: '/metrics' },
];
