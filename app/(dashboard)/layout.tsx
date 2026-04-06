'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <Topbar />
        <div className="bg-background flex min-w-0 flex-1 flex-col overflow-auto p-4 md:p-6">
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
