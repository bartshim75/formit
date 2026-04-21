'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Eye } from 'lucide-react';

function Tab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        'rounded-full border px-4 py-2 text-sm font-extrabold transition',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-border bg-bg-elev text-ink-2 hover:bg-bg-soft',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export function SurveyHeader({ id }: { id: string }) {
  return (
    <div className="mb-6 grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="border-border bg-bg-elev hover:bg-bg-soft grid h-10 w-10 place-items-center rounded-full border shadow-sm"
            aria-label="대시보드로"
          >
            <ChevronLeft className="text-ink-2 h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="text-ink-3 text-xs font-extrabold">설문</div>
            <div className="truncate text-lg font-extrabold tracking-tight">{id}</div>
          </div>
          <div className="border-border bg-bg-elev text-ink-2 hidden rounded-full border px-3 py-1 text-xs font-extrabold shadow-sm md:inline-flex">
            초안
          </div>
        </div>

        <Link
          href={`/r/${id}`}
          className="border-accent bg-accent shadow-pop hover:bg-accent-ink inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-extrabold text-white"
        >
          <Eye className="h-4 w-4" />
          응답자 화면 미리보기
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tab href={`/s/${id}/edit`} label="편집" />
        <Tab href={`/s/${id}/share`} label="공유" />
        <Tab href={`/s/${id}/results`} label="결과" />
      </div>
    </div>
  );
}
