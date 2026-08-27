"use client";
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-ink px-4 py-2 text-sm text-white"
    >
      {label}
    </button>
  );
}
