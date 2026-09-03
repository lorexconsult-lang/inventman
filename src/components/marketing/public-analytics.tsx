"use client";
import { useEffect } from "react";

type PublicEvent = "PUBLIC_CTA" | "FEATURE_VIEW" | "INDUSTRY_VIEW" | "PRICING_VIEW" | "PLAN_SELECTED" | "SIGNUP_STARTED";
const allowed = ["utm_source", "utm_medium", "utm_campaign"] as const;
const safe = (value: string | null) => value && /^[\w .-]{1,80}$/.test(value) ? value : null;

function emit(name: PublicEvent, detail: Record<string, string> = {}) { window.dispatchEvent(new CustomEvent("inventman:analytics", { detail: { name, ...detail } })); }

export function PublicAnalytics() {
  useEffect(() => {
    const current = new URL(window.location.href);
    const attribution = Object.fromEntries(allowed.flatMap((key) => { const value = safe(current.searchParams.get(key)); return value ? [[key, value]] : []; }));
    if (Object.keys(attribution).length) sessionStorage.setItem("inventman:attribution", JSON.stringify(attribution));
    const stored = sessionStorage.getItem("inventman:attribution");
    let values: Record<string, string> = {};
    try { values = stored ? JSON.parse(stored) : {}; } catch { values = {}; }
    document.querySelectorAll<HTMLAnchorElement>('a[href^="/signup"]').forEach((link) => { const next = new URL(link.href); for (const key of allowed) { const value = safe(values[key]); if (value) next.searchParams.set(key, value); } link.href = `${next.pathname}${next.search}`; });
    if (current.pathname.startsWith("/features/")) emit("FEATURE_VIEW", { path: current.pathname });
    if (current.pathname.startsWith("/industries/")) emit("INDUSTRY_VIEW", { path: current.pathname });
    if (current.pathname === "/pricing") emit("PRICING_VIEW", { path: current.pathname });
    const click = (event: MouseEvent) => { const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-analytics]"); if (link) emit(link.dataset.analytics as PublicEvent, { path: new URL(link.href).pathname }); };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
