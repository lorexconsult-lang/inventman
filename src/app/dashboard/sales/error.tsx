"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-2xl border bg-surface p-8">
      <h1 className="text-xl font-semibold">Sales data could not be loaded</h1>
      <p className="mt-2 text-subtle">
        The request failed safely. No transaction was changed.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-ink px-4 py-2 text-white"
      >
        Retry
      </button>
    </div>
  );
}
