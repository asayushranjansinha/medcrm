'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ClipboardList,
  ContactRound,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  Pill,
  Settings,
  Stethoscope,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const OVERVIEW = [
  { href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard },
] as const;

const FIELD = [
  { href: '/team', title: 'Team', icon: Users },
  { href: '/visits', title: 'Visits', icon: ClipboardList },
  { href: '/performance', title: 'Performance', icon: LineChart },
] as const;

const SUPPLY = [
  { href: '/stockists', title: 'Stockists', icon: Warehouse },
  { href: '/hospitals', title: 'Hospitals', icon: Building2 },
  { href: '/dispatches', title: 'Stock Movements', icon: Truck },
] as const;

const MASTERS = [
  { href: '/persons', title: 'Persons', icon: ContactRound },
  { href: '/doctors', title: 'Doctors', icon: Stethoscope },
  { href: '/products', title: 'Products', icon: Pill },
  { href: '/reports', title: 'Reports', icon: FileSpreadsheet },
  { href: '/settings', title: 'Settings', icon: Settings },
] as const;

function NavBlock({
  label,
  items,
}: {
  label: string;
  items: readonly { href: string; title: string; icon: ElementType<{ className?: string }> }[];
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
                <Icon />
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
