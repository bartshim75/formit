import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg text-ink min-h-screen">
      <header className="border-border bg-bg/90 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-sm font-extrabold tracking-tight">
            Formit
          </a>
          <nav className="flex items-center gap-3">
            <a className="text-ink-2 hover:text-ink text-sm font-semibold" href="/templates">
              템플릿
            </a>
            <a className="text-ink-2 hover:text-ink text-sm font-semibold" href="/dashboard">
              대시보드
            </a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-border bg-bg border-t">
        <div className="text-ink-3 mx-auto max-w-6xl px-6 py-10 text-xs">
          © {new Date().getFullYear()} Formit. 응답자 경험을 최우선으로 설계합니다.
        </div>
      </footer>
    </div>
  );
}
