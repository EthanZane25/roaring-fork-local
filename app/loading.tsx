export default function Loading() {
  return (
    <main className="container-site py-10" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-24 animate-pulse rounded bg-[#e5e6e1]" />
      <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded bg-[#e5e6e1]" />
      <div className="mt-3 h-5 w-[34rem] max-w-full animate-pulse rounded bg-[#ecece8]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-[#e0e2dc] bg-white">
            <div className="aspect-[16/9] animate-pulse bg-[#ecece8]" />
            <div className="p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-[#e5e6e1]" />
              <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#efefeb]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
