'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Home, LayoutTemplate, Plus, Bell } from 'lucide-react';
import type { ReactNode } from 'react';

function NavItem({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
        active ? 'text-ink bg-white/70 shadow-sm' : 'text-ink-2 hover:bg-white/55',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-8 w-8 place-items-center rounded-xl border',
          active
            ? 'border-border bg-white'
            : 'border-transparent bg-white/40 group-hover:bg-white/60',
        ].join(' ')}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg text-ink min-h-screen">
      <div className="mx-auto flex max-w-[1240px] gap-6 px-6 py-10">
        <aside className="hidden w-[260px] shrink-0 md:block">
          <div className="sticky top-10">
            <div className="border-border rounded-[28px] border bg-[linear-gradient(180deg,rgba(224,62,108,0.22),rgba(255,183,197,0.14)_32%,rgba(255,255,255,0.6)_100%)] p-4 shadow-lg">
              <Link href="/" className="flex items-center gap-2 px-2 pt-1">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white shadow-sm">
                  <div className="bg-accent h-4 w-4 rounded-sm" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold tracking-tight">Formit</div>
                  <div className="text-ink-3 text-[11px] font-semibold">설문을 쉽고 따뜻하게</div>
                </div>
              </Link>

              <Link
                href="/s/new"
                className="border-accent bg-accent shadow-pop hover:bg-accent-ink mt-4 flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold text-white transition"
              >
                <Plus className="h-4 w-4" />새 설문 만들기
              </Link>

              <nav className="mt-4 grid gap-1 px-1 pb-1">
                <NavItem href="/dashboard" label="홈" icon={<Home className="h-4 w-4" />} />
                <NavItem
                  href="/templates"
                  label="템플릿"
                  icon={<LayoutTemplate className="h-4 w-4" />}
                />
                <NavItem
                  href="/dashboard"
                  label="결과 분석"
                  icon={<BarChart3 className="h-4 w-4" />}
                />
              </nav>

              <div className="border-border mt-4 rounded-2xl border bg-white/60 p-3">
                <div className="text-ink-3 text-xs font-semibold">최근 설문</div>
                <div className="text-ink-4 mt-2 text-xs leading-5">
                  아직 최근 설문이 없어요.
                  <br />위 버튼으로 첫 설문을 만들어보세요.
                </div>
              </div>

              <div className="border-border mt-4 flex items-center gap-2 rounded-2xl border bg-white/55 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white shadow-sm">
                  <span className="text-accent-ink text-sm font-extrabold">G</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold tracking-tight">게스트</div>
                  <div className="text-ink-3 text-[11px] font-semibold">무료 플랜</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="border-border bg-bg-elev hover:bg-bg-soft text-ink-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold shadow-sm"
            >
              <span className="bg-accent-softer text-accent-ink grid h-6 w-6 place-items-center rounded-full">
                F
              </span>
              홈으로
            </Link>
            <div className="border-border bg-bg-elev text-ink-2 hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm md:flex">
              다크 모드 — 플랜에서만 활성화할게요
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="border-border bg-bg-elev hover:bg-bg-soft grid h-10 w-10 place-items-center rounded-full border shadow-sm"
                aria-label="알림"
              >
                <Bell className="text-ink-2 h-4 w-4" />
              </button>
              <Link
                href="/s/new"
                className="border-accent bg-accent shadow-pop hover:bg-accent-ink inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-extrabold text-white"
              >
                <Plus className="h-4 w-4" />새 설문
              </Link>
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
