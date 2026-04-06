'use client';

import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Download,
  MapPin,
  Menu,
  Package,
  Users,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Fragment, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const display = '[font-family:var(--font-marketing-display),ui-sans-serif]';

const features = [
  {
    icon: Users,
    title: 'MR Hierarchy Management',
    body: 'Model your exact NSM → ZSM → RSM → ASM → MR org structure. Every user sees only their territory’s data.',
  },
  {
    icon: MapPin,
    title: 'Live Stockist Inventory',
    body: 'Know exactly how many units of every product sit at every stockist. Get alerted before stock runs out.',
  },
  {
    icon: Activity,
    title: 'Visit & Outcome Tracking',
    body: 'Log doctor visits, capture prescription commitments, samples given, and follow-up dates — all from one form.',
  },
  {
    icon: BarChart3,
    title: 'Target vs Achievement',
    body: 'Set monthly product-wise targets for every MR. Track real-time achievement with color-coded performance indicators.',
  },
  {
    icon: Package,
    title: 'End-to-end Stock Movement',
    body: 'Track product flow from company → stockist → hospital → retailer. Every movement logged with invoice and batch data.',
  },
  {
    icon: Download,
    title: 'Excel Export Anywhere',
    body: 'Export any list — visits, dispatches, stockist inventory, MR performance — to a styled Excel file in one click.',
  },
] as const;

const howItWorksSteps = [
  {
    n: '1',
    title: 'Map your org',
    desc: 'Add your products, your sales hierarchy, and your territories. Import your existing stockist and doctor lists.',
  },
  {
    n: '2',
    title: 'Your team logs daily',
    desc: 'MRs log visits on mobile. ASMs record dispatches. Stock movements update inventory automatically.',
  },
  {
    n: '3',
    title: 'Leadership sees everything',
    desc: 'NSM gets real-time dashboard. Export any report. No chasing WhatsApp messages for numbers.',
  },
] as const;

const barHeights = [24, 36, 28, 52, 44, 64];

export default function MarketingPage() {
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass =
    'text-sm text-slate-300 transition-colors hover:text-white';

  return (
    <div className="min-h-screen bg-[#020817]">
      <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-7 w-7 shrink-0 rounded-md bg-blue-500" aria-hidden />
            <span className="text-base font-semibold text-white md:text-lg">
              <span className="text-white">Med</span>
              <span className="text-blue-400">CRM</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className={navLinkClass}>
              Features
            </a>
            <a href="#how-it-works" className={navLinkClass}>
              How it works
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="ghost"
              className="text-slate-300"
              render={<Link href={isLoggedIn ? '/dashboard' : '/login'} />}
            >
              {isLoggedIn ? 'Dashboard' : 'Sign in'}
            </Button>
            <Button
              className="border-0 bg-blue-600 text-white hover:bg-blue-500"
              render={<Link href="/login" />}
            >
              Get a demo
            </Button>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen ? (
          <div
            id="mobile-nav"
            className="w-full border-t border-slate-800 bg-slate-950/95 px-4 py-4 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-1">
              <a
                href="#features"
                className="rounded-lg px-3 py-3 text-base text-slate-200 hover:bg-slate-800"
                onClick={() => setMobileOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="rounded-lg px-3 py-3 text-base text-slate-200 hover:bg-slate-800"
                onClick={() => setMobileOpen(false)}
              >
                How it works
              </a>
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-800 pt-4">
                <Button
                  variant="ghost"
                  className="justify-start text-slate-200"
                  render={<Link href={isLoggedIn ? '/dashboard' : '/login'} />}
                >
                  {isLoggedIn ? 'Dashboard' : 'Sign in'}
                </Button>
                <Button
                  className="border-0 bg-blue-600 text-white hover:bg-blue-500"
                  render={<Link href="/login" />}
                >
                  Get a demo
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-20 pb-20 md:pt-24 md:pb-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, #1E3A8A 0%, #020817 65%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
            <span aria-hidden>✦</span>
            Built for Indian Pharma Field Force
          </div>

          <h1
            className={cn(
              display,
              'mt-8 text-5xl leading-tight font-bold tracking-tight text-white md:text-7xl',
            )}
          >
            Track every MR, stockist,
            <br />
            and <span className="text-blue-400">rupee</span> — in one place.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-slate-400">
            MedCRM gives your NSM, ZSMs, and MRs a single platform to
            manage doctor visits, stockist inventory, product dispatches, and
            territory performance — all in real time.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="h-12 border-0 bg-blue-600 px-8 text-base text-white hover:bg-blue-500"
              render={<Link href="/login" />}
            >
              Get a free demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-slate-600 bg-transparent px-8 text-base text-slate-200 hover:bg-slate-800"
              render={<a href="#how-it-works" />}
            >
              See how it works ↓
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            ✓ No setup fee · ✓ Go live in 7 days · ✓ Indian pharma-specific
          </p>
        </div>

        <div className="relative z-10 mx-auto mt-16 mb-4 max-w-5xl overflow-hidden rounded-xl border border-slate-700/50 bg-[#0F172A] px-3 shadow-2xl shadow-blue-950/50 md:mb-6 md:px-0">
          <div className="flex h-10 items-center gap-2 bg-slate-800 px-4">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <div className="mx-4 h-5 max-w-xs flex-1 rounded bg-slate-700/50" />
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-6">
            <div className="rounded-lg bg-[#1E293B] p-4">
              <p className="text-xs text-slate-400">Total MRs</p>
              <p className="mt-1 text-2xl font-bold text-white">48</p>
              <p className="mt-1 text-xs text-green-400">+12% ↑</p>
            </div>
            <div className="rounded-lg bg-[#1E293B] p-4">
              <p className="text-xs text-slate-400">Visits MTD</p>
              <p className="mt-1 text-2xl font-bold text-white">1,284</p>
              <p className="mt-1 text-xs text-green-400">+8% ↑</p>
            </div>
            <div className="rounded-lg bg-[#1E293B] p-4">
              <p className="text-xs text-slate-400">Revenue MTD</p>
              <p className="mt-1 text-2xl font-bold text-blue-400">₹42.6L</p>
              <p className="mt-1 text-xs text-green-400">+23% ↑</p>
            </div>
            <div className="rounded-lg bg-[#1E293B] p-4">
              <p className="text-xs text-slate-400">Low Stock Alerts</p>
              <p className="mt-1 text-2xl font-bold text-white">7</p>
              <p className="mt-1 text-xs text-red-400">Needs attention</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 px-4 pb-6 md:grid-cols-4 md:px-6">
            <div className="rounded-lg bg-[#1E293B] p-4 md:col-span-2">
              <p className="mb-2 text-xs text-slate-400">Monthly sales trend</p>
              <div className="flex h-16 items-end gap-1">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-blue-500/70"
                      style={{ height: h }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#1E293B] p-4 md:col-span-2">
              <p className="mb-2 text-xs text-slate-400">Target vs achievement</p>
              <div className="flex flex-col gap-3">
                {[
                  { name: 'MR A', pct: 92 },
                  { name: 'MR B', pct: 67 },
                  { name: 'MR C', pct: 105 },
                ].map((row) => (
                  <div key={row.name} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-xs text-slate-300">
                      {row.name}
                    </span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.min(row.pct, 100)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-slate-400">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/50 py-12 pt-16 md:pt-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-8 text-sm tracking-widest text-slate-500 uppercase">
            Trusted by field-force teams at
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-lg font-semibold text-slate-600 md:gap-x-4">
            <span>Vylaris Pharma</span>
            <span className="text-slate-700" aria-hidden>
              ·
            </span>
            <span>Kendermoor Lifesciences</span>
            <span className="text-slate-700" aria-hidden>
              ·
            </span>
            <span>Ostbridge Healthcare</span>
            <span className="text-slate-700" aria-hidden>
              ·
            </span>
            <span>Prywell Medica</span>
            <span className="text-slate-700" aria-hidden>
              ·
            </span>
            <span>Quorndale Therapeutics</span>
          </p>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-24">
        <p className="text-sm font-semibold tracking-widest text-blue-400 uppercase">
          Everything you need
        </p>
        <h2
          className={cn(
            display,
            'mt-2 text-4xl font-bold text-white',
          )}
        >
          One platform. Every layer of your sales operation.
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          From NSM dashboards to MR daily logs — MedCRM covers the full
          hierarchy without duct-taped spreadsheets.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-800 bg-[#0F172A] p-6 transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-800/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 p-2">
                <Icon className="h-5 w-5 text-blue-400" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 bg-slate-900/30 py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold tracking-widest text-blue-400 uppercase">
            How it works
          </p>
          <h2
            className={cn(
              display,
              'mt-2 text-4xl font-bold text-white',
            )}
          >
            Up and running in three steps.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            No lengthy implementation. No consultants. Your data, your hierarchy,
            live in days.
          </p>

          <div className="mt-16 flex flex-col gap-10 lg:hidden">
            {howItWorksSteps.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-sm font-bold text-blue-400">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 hidden items-center lg:flex">
            {howItWorksSteps.map((step, idx) => (
              <Fragment key={step.n}>
                {idx > 0 ? (
                  <div
                    className="flex min-h-[1px] flex-1 items-center px-4"
                    aria-hidden
                  >
                    <div className="h-px w-full bg-slate-700" />
                  </div>
                ) : null}
                <div className="max-w-xs shrink-0 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-sm font-bold text-blue-400">
                    {step.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.desc}</p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
        <div className="grid grid-cols-2 gap-y-10 text-center lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-800">
          {[
            { value: '48 hrs', label: 'Average onboarding time' },
            { value: '100%', label: 'Field coverage visibility' },
            { value: '0', label: 'Spreadsheets needed' },
            { value: '₹0', label: 'Setup or implementation fee' },
          ].map((m) => (
            <div key={m.label} className="px-4 lg:px-8">
              <p className="text-5xl font-bold text-blue-400">{m.value}</p>
              <p className="mt-2 text-sm text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/30 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-[#1E293B] p-8 text-center md:p-10">
          <p className="text-sm text-blue-400" aria-hidden>
            ★★★★★
          </p>
          <p
            className="font-serif text-8xl leading-none text-blue-500/30"
            aria-hidden
          >
            &ldquo;
          </p>
          <blockquote className="mt-4 text-xl leading-relaxed font-medium text-white">
            Before MedCRM, our NSM was making decisions based on week-old
            WhatsApp updates. Now he has yesterday&apos;s stockist inventory and
            MR visit data on his phone by 8 AM.
          </blockquote>
          <p className="mt-6 text-sm text-slate-400">
            Rajiv Mehta, VP Sales — Vylaris Pharma
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden py-32 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <h2
            className={cn(
              display,
              'text-4xl font-bold text-white md:text-5xl',
            )}
          >
            Ready to see your entire field force — in one screen?
          </h2>
          <p className="mt-4 text-slate-400">
            Book a 30-minute demo. We&apos;ll show you your exact org structure
            running live.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="h-12 border-0 bg-blue-600 px-8 text-base text-white hover:bg-blue-500"
              render={<Link href="/login" />}
            >
              Get a free demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-slate-600 bg-transparent px-8 text-base text-slate-200 hover:bg-slate-800"
              render={<Link href="/login" />}
            >
              Talk to sales
            </Button>
          </div>
          <p className="mt-8 text-sm text-slate-600">
            No commitment. No credit card. Just a demo.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="h-7 w-7 shrink-0 rounded-md bg-blue-500" aria-hidden />
              <span className="text-base font-semibold">
                <span className="text-white">Med</span>
                <span className="text-blue-400">CRM</span>
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              MedCRM — Built specifically for Indian pharmaceutical field-force
              operations.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Made by{' '}
              <span className="text-slate-400">Ayush Ranjan Sinha</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Call{' '}
              <a
                href="tel:+918709415598"
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                8709415598
              </a>
            </p>
            <p className="mt-4 text-xs text-slate-600">
              © 2026 MedCRM. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-12 md:gap-20">
            <div>
              <p className="text-sm font-semibold text-slate-300">Product</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                  >
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Company</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
