export default function AdminShellLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {/* Page heading skeleton */}
      <div className="h-6 w-48 rounded bg-neutral-200" />
      <div className="h-4 w-72 rounded bg-neutral-100" />

      {/* Content block skeleton */}
      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
          <div className="h-3 w-32 rounded bg-neutral-200" />
        </div>
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 flex-1 rounded bg-neutral-100" />
              <div className="h-4 w-16 rounded bg-neutral-100" />
              <div className="h-4 w-12 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
