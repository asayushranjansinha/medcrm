'use client';

import { OrbitalLoader } from '@/components/ui/orbital-loader';
import { cn } from '@/lib/utils';

export type PageLoaderProps = {
  message?: string;
  className?: string;
  /** page: main route content; inline: cards / chart placeholders */
  variant?: 'page' | 'inline';
};

export function PageLoader({
  message = 'Loading…',
  className,
  variant = 'page',
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center',
        variant === 'page' && 'min-h-[50vh] py-16',
        variant === 'inline' && 'min-h-[200px] py-10',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OrbitalLoader message={message} />
    </div>
  );
}
