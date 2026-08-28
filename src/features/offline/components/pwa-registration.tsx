"use client";

import { useEffect, useState } from "react";

export function PwaRegistration() {
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    const register = async () => {
      registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      registration.addEventListener("updatefound", () => {
        const worker = registration?.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller)
            setUpdate(worker);
        });
      });
    };
    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "INVENTMAN_SYNC")
        window.dispatchEvent(new Event("online"));
    };
    void register();
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
  if (!update) return null;
  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm rounded-xl border bg-surface p-4 shadow-xl md:bottom-4">
      <p className="text-sm font-semibold">An application update is ready.</p>
      <p className="mt-1 text-xs text-subtle">
        Finish the current checkout before reloading.
      </p>
      <button
        type="button"
        className="mt-3 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white"
        onClick={() => {
          update.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }}
      >
        Update and reload
      </button>
    </div>
  );
}
