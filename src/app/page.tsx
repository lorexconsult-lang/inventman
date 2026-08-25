import Link from "next/link";
import { appConfig } from "@/config/app";

export default function HomePage() {
  return <main className="grid min-h-dvh place-items-center p-6"><div className="max-w-2xl text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent font-black text-white">I</span><h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Operational clarity starts with a sound foundation.</h1><p className="mx-auto mt-5 max-w-xl text-lg text-subtle">{appConfig.name} is preparing a secure workspace for inventory-based businesses.</p><div className="mt-8 flex justify-center gap-3"><Link className="inline-flex min-h-11 items-center rounded-lg bg-ink px-5 font-semibold text-canvas" href="/auth/register">Create account</Link><Link className="inline-flex min-h-11 items-center rounded-lg border bg-surface px-5 font-semibold" href="/auth/login">Sign in</Link></div></div></main>;
}
