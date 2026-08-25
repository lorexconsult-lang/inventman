export default function Loading() {
  return <div className="animate-pulse space-y-6" aria-label="Loading"><div className="h-10 w-72 rounded-lg bg-muted" /><div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 rounded-2xl bg-muted" />)}</div><div className="h-72 rounded-2xl bg-muted" /></div>;
}
