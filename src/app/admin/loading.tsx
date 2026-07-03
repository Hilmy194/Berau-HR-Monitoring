export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-label="Loading admin page">
      <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl border bg-card" />
    </div>
  );
}
