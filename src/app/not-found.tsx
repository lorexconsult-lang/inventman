import Link from "next/link";

export default function NotFound() {
  return <div className="mx-auto max-w-lg py-20 text-center"><p className="text-sm font-semibold text-accent">404</p><h1 className="mt-2 text-3xl font-semibold">Page not found</h1><p className="mt-3 text-subtle">The requested workspace page does not exist.</p><Link className="mt-6 inline-block font-semibold text-accent underline-offset-4 hover:underline" href="/">Return to overview</Link></div>;
}
