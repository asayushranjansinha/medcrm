'use client';

import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AppBreadcrumb } from '@/components/layout/breadcrumb';
import { GlobalSearch } from '@/components/layout/global-search';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Topbar() {
  const { setTheme, theme } = useTheme();
  const { data } = useSession();
  const router = useRouter();

  return (
    <header className="bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <div className="min-w-0 flex-1">
        <AppBreadcrumb />
      </div>
      <GlobalSearch />
      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" disabled>
        <Bell className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="relative"
      >
        <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Account menu"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-full'
              )}
            />
          }
        >
          <span
            suppressHydrationWarning
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
          >
            {data?.user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{data?.user?.name}</p>
                <p className="text-muted-foreground text-xs">{data?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
