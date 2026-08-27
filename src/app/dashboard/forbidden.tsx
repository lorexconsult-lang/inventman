import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-surface p-8 text-center">
      <p className="text-sm font-semibold text-warning">Access denied</p>
      <h1 className="mt-2 text-2xl font-bold">
        You do not have permission to view this area.
      </h1>
      <p className="mt-3 text-subtle">
        Ask an organization administrator if you need additional access.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
