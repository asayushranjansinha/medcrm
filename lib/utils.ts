import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  return format(new Date(d), 'dd MMM yyyy');
}

export function formatCurrency(n: string | number | null | undefined) {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? Number.parseFloat(n) : n;
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
}
