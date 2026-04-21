export default function Loading() {
  return (
    <div className="bg-bg text-ink min-h-screen">
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <div className="border-border bg-bg-elev rounded-xl border p-8 shadow-sm">
          <div className="bg-bg-soft h-4 w-24 animate-pulse rounded" />
          <div className="bg-bg-soft mt-4 h-8 w-2/3 animate-pulse rounded" />
          <div className="bg-bg-soft mt-3 h-4 w-full animate-pulse rounded" />
          <div className="bg-bg-soft mt-2 h-4 w-5/6 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
