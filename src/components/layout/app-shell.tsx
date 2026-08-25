import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { appConfig } from "@/config/app";
import { logout } from "@/features/auth/actions";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur md:px-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-black text-white">I</span>
          {appConfig.name}
        </Link>
        <div className="flex items-center gap-3 text-sm text-subtle">
          <span className="hidden sm:inline">Workspace foundation</span>
          <span className="size-2 rounded-full bg-positive" aria-label="Online" />
          <form action={logout}><button className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 hover:bg-muted hover:text-ink" type="submit"><LogOut className="size-4" aria-hidden="true" />Sign out</button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] md:grid-cols-[220px_1fr]">
        <aside className="hidden min-h-[calc(100dvh-4rem)] border-r border-line p-4 md:block">
          <nav aria-label="Primary navigation" className="space-y-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-subtle hover:bg-muted hover:text-ink">
                <Icon aria-hidden="true" className="size-4" />{label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
