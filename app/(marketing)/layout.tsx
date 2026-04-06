import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-marketing-body',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-marketing-display',
});

export const metadata: Metadata = {
  title: 'MedCRM — The operating system for India’s pharmaceutical field force',
  description:
    'Track every MR, stockist, and rupee in one place. Real-time dashboards, stockist inventory, visits, and territory performance for Indian pharma.',
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${inter.variable} ${bricolage.variable} min-h-screen bg-[#020817] text-sm text-slate-400 antialiased`}
      style={{
        fontFamily:
          'var(--font-marketing-body), ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
