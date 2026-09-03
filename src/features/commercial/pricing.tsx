"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { useState } from "react";
import { formatPlanPrice, type PublicPlan } from "./domain";

const labels: Record<string, string> = {
  "core.catalogue": "Product catalogue",
  "core.inventory": "Inventory control",
  procurement: "Purchasing workflows",
  sales: "Sales and invoicing",
  payments: "Payment settlement",
  finance: "Financial reporting",
  pos: "Point of sale",
  offline: "Offline POS continuity",
  multi_branch: "Branches",
  staff: "Team members",
  warehouses: "Warehouses",
  pos_terminals: "POS terminals",
  custom_roles: "Custom roles",
};

export function PricingTable({ plans }: { plans: PublicPlan[] }) {
  const [interval, setInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const featureCodes = [...new Set(plans.flatMap((plan) => plan.entitlements.filter((item) => labels[item.feature_code]).map((item) => item.feature_code)))];
  return <><div className="pricing-controls"><div className="pricing-toggle" aria-label="Billing interval"><button type="button" aria-pressed={interval === "MONTHLY"} onClick={() => setInterval("MONTHLY")}>Monthly</button><button type="button" aria-pressed={interval === "ANNUAL"} onClick={() => setInterval("ANNUAL")}>Annual</button></div><p>Annual prices are shown as configured totals, not estimated discounts.</p></div><div className="pricing-grid">{plans.map((plan, index) => <article className={`price-card ${index === 1 ? "featured" : ""}`} key={plan.code}>{index === 1 && <span className="plan-marker">For growing operations</span>}<p className="eyebrow">{plan.name}</p><h2>{formatPlanPrice(plan, interval)}</h2><p className="price-period">{plan.is_custom ? "Built around approved operating requirements." : `per ${interval === "MONTHLY" ? "month" : "year"}`}</p><p>{plan.description}</p>{plan.trial_days > 0 && !plan.is_custom && <strong className="trial-note">{plan.trial_days}-day free trial</strong>}<ul>{plan.entitlements.filter((item) => labels[item.feature_code] && (item.enabled || item.value)).slice(0, 8).map((item) => <li key={item.feature_code}><Check aria-hidden="true" />{labels[item.feature_code]}{item.value ? `: ${item.value}` : ""}</li>)}</ul><Link className="public-button" data-analytics={plan.is_custom ? "PUBLIC_CTA" : "PLAN_SELECTED"} href={plan.is_custom ? "/contact?topic=sales" : `/signup?plan=${plan.code}`}>{plan.is_custom ? "Contact Sales" : "Start Free Trial"}</Link></article>)}</div><div className="comparison-wrap"><table className="plan-comparison"><caption>Plan feature and limit comparison</caption><thead><tr><th>Capability</th>{plans.map((plan) => <th key={plan.code}>{plan.name}</th>)}</tr></thead><tbody>{featureCodes.map((code) => <tr key={code}><th>{labels[code]}</th>{plans.map((plan) => { const item = plan.entitlements.find((entry) => entry.feature_code === code); const content = item?.value ?? item?.text ?? item?.enabled; return <td key={plan.code}>{typeof content === "number" || typeof content === "string" ? content : content ? <Check aria-label="Included" /> : <Minus aria-label="Not included" />}</td>; })}</tr>)}</tbody></table></div></>;
}
