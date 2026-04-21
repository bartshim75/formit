import type { ReactNode } from 'react';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg text-ink min-h-screen">
      <header className="bg-bg/80 sticky top-0 z-20 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white shadow-sm">
              <div className="bg-accent h-4 w-4 rounded-sm" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight">Formit</div>
              <div className="text-ink-3 text-[11px] font-semibold">설문을 쉽고 따뜻하게</div>
            </div>
          </a>

          <nav className="flex items-center gap-4">
            <a
              className="text-ink-2 hover:text-ink inline-flex text-sm font-extrabold"
              href="/templates"
            >
              템플릿
            </a>
            <a
              className="text-ink-2 hover:text-ink inline-flex text-sm font-extrabold"
              href="/dashboard"
            >
              대시보드
            </a>
          </nav>

          <a
            href="/dashboard"
            className="border-accent bg-accent shadow-pop hover:bg-accent-ink rounded-full border px-5 py-2.5 text-sm font-extrabold text-white"
          >
            무료로 시작하기
          </a>
        </div>
      </header>

      {children}

      <footer className="border-border bg-bg border-t">
        <div className="text-ink-3 mx-auto max-w-[1240px] px-6 py-10 text-xs">
          © {new Date().getFullYear()} Formit. 응답자 경험을 최우선으로 설계합니다.
        </div>
      </footer>
    </div>
  );
}
