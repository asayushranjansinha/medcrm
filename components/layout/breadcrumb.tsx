'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  persons: 'Persons',
  products: 'Products',
  visits: 'Visits',
  dispatches: 'Dispatches',
  reports: 'Reports',
  settings: 'Settings',
  new: 'New',
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = LABELS[seg] ?? seg;
    return { href, label };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
      <Link href="/dashboard" className="hover:text-foreground">
        Home
      </Link>
      {crumbs.map((c) => (
        <Fragment key={c.href}>
          <ChevronRight className="size-3.5 shrink-0 opacity-60" />
          <Link href={c.href} className="hover:text-foreground max-w-[200px] truncate">
            {c.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
