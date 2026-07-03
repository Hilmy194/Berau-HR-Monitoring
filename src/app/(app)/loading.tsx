export default function AppLoading() {
  return (
    <div className="space-y-5" aria-label="Loading page">
      <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border bg-card" />
    </div>
  );
}
