import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/marketing/public-shell";

export const metadata: Metadata = {
  title: "Business inventory, sales and profitability control",
  description: "Control stock, purchasing, sales, cash, POS, expenses and profitability across your business.",
  alternates: { canonical: "/" },
};

const capabilities = [
  ["Know what you have", "Track products, variants, warehouses, movements, counts and valuation."],
  ["Buy with control", "Move from supplier quotes and approvals through receiving and returns."],
  ["Sell and collect", "Manage customers, orders, fulfilment, invoices, payments and receivables."],
  ["See performance", "Connect operations to expenses, journals and financial reporting."],
];

export default function Home() {
  return <PublicPage>
    <section className="hero">
      <div>
        <p className="eyebrow">Business operations, connected</p>
        <h1>Control your stock, sales, cash and profitability from one platform.</h1>
        <p>Inventman gives inventory-based businesses a clear operating record across purchasing, branches, POS, payments, expenses and finance.</p>
        <div className="hero-actions">
          <Link className="public-button" href="/signup">Start free trial</Link>
          <Link className="text-link" href="/pricing">View pricing →</Link>
        </div>
      </div>
      <div className="product-visual">
        <p>YOUR OPERATING FLOW</p>
        {["Purchase & receive", "Track & transfer", "Sell & collect", "Reconcile & report"].map((item, index) =>
          <div key={item}><span>0{index + 1}</span><strong>{item}</strong></div>,
        )}
        <small>Illustrative workflow — no customer data</small>
      </div>
    </section>
    <section className="value-strip">
      <span>Multi-branch visibility</span><span>Role-based control</span><span>Offline-ready POS</span><span>Financial reporting</span>
    </section>
    <section className="section">
      <p className="eyebrow">One reliable operating picture</p>
      <h2>Replace disconnected records with accountable workflows.</h2>
      <div className="feature-grid">{capabilities.map(([heading, body]) =>
        <article key={heading}><h3>{heading}</h3><p>{body}</p></article>,
      )}</div>
    </section>
    <section className="dark-section">
      <div><h2>Keep supported POS sales moving through an internet interruption.</h2><p>Provisioned devices can queue supported offline sales and synchronize safely when connectivity returns. Your wider workspace remains online-first.</p></div>
      <div><h2>Follow activity through to profitability.</h2><p>Stock, sales, payments and expenses feed a controlled accounting trail without pretending to replace statutory filing.</p></div>
    </section>
    <section className="cta">
      <h2>Build a clearer, more accountable business operation.</h2>
      <p>Start with a configured trial. Add products manually or import your catalogue when ready.</p>
      <Link className="public-button" href="/signup">Start free trial</Link>
    </section>
  </PublicPage>;
}
