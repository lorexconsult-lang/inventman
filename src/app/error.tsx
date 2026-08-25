"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-lg rounded-2xl border bg-surface p-8 text-center"><h1 className="text-2xl font-semibold">Something went wrong</h1><p className="mt-3 text-sm text-subtle">The request could not be completed. No sensitive diagnostic details have been shown.</p><Button className="mt-6" onClick={reset}>Try again</Button></div>;
}
