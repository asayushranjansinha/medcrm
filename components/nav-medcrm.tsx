'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  ContactRound,
  FileSpreadsheet,
  LayoutDashboard,
  Pill,
  Settings,
} from 'lucide-react';
import { ChartLineIcon } from '@/components/ui/chart-line';
import { StethoscopeIcon } from '@/components/ui/stethoscope';
import { TruckIcon } from '@/components/ui/truck';
import { LayersIcon } from '@/components/ui/layers';
import { AmbulanceIcon } from '@/components/ui/ambulance';
import { UsersIcon } from '@/components/ui/users';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const OVERVIEW = [{ href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard }] as const;

const FIELD = [
  { href: '/team', title: 'Team', icon: UsersIcon },
  { href: '/visits', title: 'Visits', icon: ClipboardList },
  { href: '/performance', title: 'Performance', icon: ChartLineIcon },
] as const;

const SUPPLY = [
  { href: '/stockists', title: 'Stockists', icon: LayersIcon },
  { href: '/hospitals', title: 'Hospitals', icon: AmbulanceIcon },
  { href: '/dispatches', title: 'Stock Movements', icon: TruckIcon },
] as const;

const MASTERS = [
  { href: '/persons', title: 'Persons', icon: ContactRound },
  { href: '/doctors', title: 'Doctors', icon: StethoscopeIcon },
  { href: '/products', title: 'Products', icon: Pill },
  { href: '/reports', title: 'Reports', icon: FileSpreadsheet },
  { href: '/settings', title: 'Settings', icon: Settings },
] as const;

function NavBlock({
  label,
  items,
}: {
  label: string;
  items: readonly {
    href: string;
    title: string;
    icon: ElementType<{ className?: string; size?: number }>;
  }[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map(({ href, title, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                render={<Link href={href} onClick={closeMobile} />}
                tooltip={title}
                isActive={active}
              >
                <Icon size={16} className="shrink-0" />
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function NavMedCrm() {
  return (
    <>
      <NavBlock label="Overview" items={OVERVIEW} />
      <NavBlock label="Field operations" items={FIELD} />
      <NavBlock label="Supply chain" items={SUPPLY} />
      <NavBlock label="Masters" items={MASTERS} />
    </>
  );
}
