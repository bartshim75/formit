export default function NotFound() {
  return (
    <div className="bg-bg text-ink min-h-screen">
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <div className="border-border bg-bg-elev rounded-xl border p-8 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">설문을 찾을 수 없어요</h1>
          <p className="text-ink-2 mt-2 text-sm">링크가 만료되었거나 공개 상태가 아닐 수 있어요.</p>
          <a
            className="border-accent bg-accent shadow-pop hover:bg-accent-ink mt-6 inline-flex rounded-full border px-4 py-2 text-sm font-semibold text-white"
            href="/"
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  );
}
