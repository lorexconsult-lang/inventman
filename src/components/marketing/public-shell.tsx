import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, Building2, Check, Menu, ShieldCheck, ShoppingCart, X } from "lucide-react";
import type { ReactNode } from "react";
import { featurePages, industryPages } from "@/lib/marketing/content";
import { StructuredData } from "./structured-data";
import { PublicAnalytics } from "./public-analytics";

const links = [["Features", "/features"], ["Industries", "/industries"], ["Pricing", "/pricing"], ["Security", "/security"], ["Resources", "/resources"], ["About", "/about"]] as const;

export function Brand() { return <Link className="brand" href="/" aria-label="Inventman home"><span aria-hidden="true">I</span>Inventman</Link>; }

export function PublicHeader() {
  return <header className="public-header-shell"><div className="public-header"><Brand /><nav aria-label="Primary navigation" className="desktop-public-nav">{links.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}</nav><div className="header-actions"><Link className="login-link" href="/login">Log in</Link><Link className="public-button public-button-sm" href="/signup">Start Free Trial</Link></div><details className="mobile-public-nav"><summary aria-label="Open navigation"><Menu className="menu-open" aria-hidden="true" /><X className="menu-close" aria-hidden="true" /></summary><nav aria-label="Mobile navigation">{links.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}<Link href="/login">Log in</Link><Link className="public-button" href="/signup">Start Free Trial</Link></nav></details></div></header>;
}

export function PublicFooter() {
  return <footer className="public-footer-shell"><div className="public-footer"><div className="footer-brand"><Brand /><p>Business inventory, sales and profitability control from one connected platform.</p></div><div><strong>Product</strong><Link href="/features">Features</Link><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link></div><div><strong>Solutions</strong>{industryPages.slice(0, 4).map((page) => <Link key={page.slug} href={`/industries/${page.slug}`}>{page.name}</Link>)}</div><div><strong>Resources</strong><Link href="/resources">Guides</Link><Link href="/support">Support</Link><Link href="/contact">Contact</Link></div><div><strong>Company</strong><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><p className="footer-note">© {new Date().getUTCFullYear()} Inventman. Production legal and contact information remains subject to owner approval.</p></div></footer>;
}

export function PublicPage({ children, schema }: { children: ReactNode; schema?: Record<string, unknown> | Array<Record<string, unknown>> }) { return <><PublicAnalytics /><PublicHeader />{schema && <StructuredData data={schema} />}<main id="main-content">{children}</main><PublicFooter /></>; }

export function PageIntro({ eyebrow, title, body, actions }: { eyebrow: string; title: string; body: string; actions?: ReactNode }) { return <section className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{body}</p>{actions && <div className="hero-actions">{actions}</div>}</section>; }

export function PrimaryCta({ label = "Start Free Trial", href = "/signup" }: { label?: string; href?: string }) { return <Link className="public-button" href={href} data-analytics="PUBLIC_CTA">{label}<ArrowRight aria-hidden="true" className="size-4" /></Link>; }
export function TextCta({ label, href }: { label: string; href: string }) { return <Link className="text-link" href={href}>{label}<ArrowRight aria-hidden="true" className="size-4" /></Link>; }
export function FinalCta({ title = "Put your operation on one accountable system.", body = "Start a configured trial and build your workspace around the way your business actually runs." }: { title?: string; body?: string }) { return <section className="final-cta"><div><p className="eyebrow">Start with clarity</p><h2>{title}</h2><p>{body}</p></div><PrimaryCta /></section>; }

export function Breadcrumbs({ items }: { items: Array<{ name: string; href?: string }> }) { return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={item.name}>{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</span>)}</nav>; }
export function Faq({ items }: { items: Array<{ question: string; answer: string }> }) { return <section className="section faq-section"><div className="section-heading"><p className="eyebrow">Questions, answered</p><h2>Practical answers before you start.</h2></div><div className="faq-list">{items.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>; }
export function CheckList({ items }: { items: readonly string[] }) { return <ul className="check-list">{items.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>; }
export const capabilityIcons = [Boxes, ShoppingCart, BarChart3, Building2, ShieldCheck];
export function RelatedFeatures({ slugs }: { slugs: string[] }) { const pages = featurePages.filter((page) => slugs.includes(page.slug)); return <section className="section related-section"><div className="section-heading"><p className="eyebrow">Connected capabilities</p><h2>Keep the workflow moving.</h2></div><div className="card-grid three">{pages.map((page) => <article className="link-card" key={page.slug}><h3>{page.name}</h3><p>{page.intro}</p><TextCta href={`/features/${page.slug}`} label={`Explore ${page.name.toLowerCase()}`} /></article>)}</div></section>; }
