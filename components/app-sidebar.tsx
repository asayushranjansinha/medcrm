'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavMedCrm } from '@/components/nav-medcrm';
import { NavUser } from '@/components/nav-user';

function MedcrmBrand() {
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          render={<Link href="/dashboard" onClick={closeMobile} />}
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold shrink-0">
            M
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">MedCRM</span>
            <span className="text-sidebar-foreground/70 truncate text-xs">
              Field operations
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <MedcrmBrand />
      </SidebarHeader>
      <SidebarContent className="gap-2">
        <NavMedCrm />
      </SidebarContent>
      <SidebarFooter className="gap-2">
        <NavUser />
        <p className="text-sidebar-foreground/45 px-2 pb-1 text-center text-[10px] leading-snug">
          Made by Ayush Ranjan Sinha ·{' '}
          <a
            href="tel:+918709415598"
            className="text-sidebar-foreground/70 underline-offset-2 hover:text-sidebar-foreground hover:underline"
          >
            8709415598
          </a>
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
