'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
  Pill,
  Settings,
  Truck,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const NAV = [
  { href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { href: '/persons', title: 'Persons', icon: ClipboardList },
  { href: '/products', title: 'Products', icon: Pill },
  { href: '/visits', title: 'Visits', icon: Package },
  { href: '/dispatches', title: 'Dispatches', icon: Truck },
  { href: '/reports', title: 'Reports', icon: FileSpreadsheet },
  { href: '/settings', title: 'Settings', icon: Settings },
] as const;

export function NavMedCrm() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Application</SidebarGroupLabel>
      <SidebarMenu>
        {NAV.map(({ href, title, icon: Icon }) => {
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
