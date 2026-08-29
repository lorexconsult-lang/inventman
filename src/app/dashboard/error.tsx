"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="app-surface mx-auto max-w-xl p-8 text-center" role="alert">
    <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger"><AlertTriangle aria-hidden="true" className="size-5" /></span>
    <h1 className="mt-4 text-xl font-semibold">This page could not be loaded</h1>
    <p className="mt-2 text-sm text-subtle">Your data is safe. Check your connection and try the request again.</p>
    <Button className="mt-5" onClick={reset}>Try again</Button>
  </section>;
}
