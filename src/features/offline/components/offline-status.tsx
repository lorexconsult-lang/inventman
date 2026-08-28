"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { offlineDb, pendingForOrganization } from "../db";
import { OFFLINE_SYNC_EVENT, processSyncQueue, verifyConnectivity } from "../sync";
import type { NetworkState } from "../types";

export function OfflineStatus({
  organizationId,
  canSync,
}: {
  organizationId: string;
  canSync: boolean;
}) {
  const [state, setState] = useState<NetworkState>("ONLINE");
  const [pending, setPending] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const count = await pendingForOrganization(organizationId);
      setPending(count);
      return count;
    } catch {
      setState("SYNC_FAILED");
      return 0;
    }
  }, [organizationId]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const waiting = await refresh();
      const online = waiting > 0 ? await verifyConnectivity() : navigator.onLine;
      if (active) setState(online ? "ONLINE" : "OFFLINE");
      if (online && canSync && waiting > 0) await processSyncQueue();
      await refresh();
    };
    const handleOnline = () => void check();
    const handleOffline = () => setState("OFFLINE");
    const handleSync = (event: Event) => {
      setState((event as CustomEvent<NetworkState>).detail);
      void refresh();
    };
    void check();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OFFLINE_SYNC_EVENT, handleSync);
    const interval = window.setInterval(() => void check(), pending ? 60_000 : 180_000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OFFLINE_SYNC_EVENT, handleSync);
    };
  }, [canSync, pending, refresh]);

  const sync = async () => {
    if (!canSync || state === "SYNCING") return;
    setState("SYNCING");
    await processSyncQueue();
    await refresh();
  };
  const Icon =
    state === "OFFLINE"
      ? CloudOff
      : state === "CONFLICTS_PRESENT" || state === "SYNC_FAILED"
        ? TriangleAlert
        : state === "SYNCING"
          ? RefreshCw
          : Cloud;
  const label =
    state === "OFFLINE"
      ? `Offline${pending ? ` — ${pending} waiting` : ""}`
      : state === "SYNCING"
        ? `Syncing${pending ? ` ${pending}` : ""}`
        : state === "CONFLICTS_PRESENT"
          ? `${pending} need attention`
          : state === "SYNC_FAILED"
            ? "Sync unavailable"
            : pending
              ? `Online — ${pending} waiting`
              : "Online";
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/dashboard/settings/offline"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold hover:bg-muted"
        aria-label={`Synchronization status: ${label}`}
      >
        <Icon
          className={`size-4 ${state === "SYNCING" ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        <span className="hidden lg:inline">{label}</span>
      </Link>
      {pending > 0 && canSync && state !== "OFFLINE" ? (
        <button
          type="button"
          onClick={sync}
          disabled={state === "SYNCING"}
          className="rounded-lg border px-2 py-1 text-xs font-semibold"
        >
          Sync now
        </button>
      ) : null}
    </div>
  );
}

export async function hasPendingOfflineWork(organizationId: string) {
  try {
    await offlineDb().open();
    return (await pendingForOrganization(organizationId)) > 0;
  } catch {
    return false;
  }
}
