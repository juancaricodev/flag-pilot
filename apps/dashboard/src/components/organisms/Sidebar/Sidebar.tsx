'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/atoms';
import { logout } from '@/actions/auth';
import { NAV_ITEMS } from './types';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.aside}>
      <div className={styles.brand}>Flag Pilot</div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const linkClass = `${styles.link}${isActive ? ` ${styles.linkActive}` : ''}`;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.divider} />

      <form action={logout} className={styles.logout}>
        <Button label="Sign out" type="submit" variant="ghost" />
      </form>
    </aside>
  );
}
