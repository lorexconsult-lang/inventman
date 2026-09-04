import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CheckList, Faq, FinalCta, PageIntro, PrimaryCta, ProductFrame, PublicPage, RelatedFeatures, TextCta } from "@/components/marketing/public-shell";
import { featurePages } from "@/lib/marketing/content";
import { breadcrumbSchema, faqSchema, publicMetadata } from "@/lib/marketing/seo";

export function generateStaticParams() { return featurePages.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = featurePages.find((item) => item.slug === slug); return page ? publicMetadata({ title: page.title, description: page.description, path: `/features/${page.slug}` }) : {}; }

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = featurePages.find((item) => item.slug === slug);
  if (!page) notFound();
  const crumbs = [{ name: "Home", path: "/" }, { name: "Features", path: "/features" }, { name: page.name, path: `/features/${page.slug}` }];
  const variant = slug.includes("pos") ? "pos" : slug.includes("financial") || slug.includes("expense") ? "finance" : slug.includes("branch") ? "branches" : "inventory";
  return <PublicPage schema={[breadcrumbSchema(crumbs), faqSchema(page.faq), { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.description }]}>
    <div className="public-container"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features", href: "/features" }, { name: page.name }]} /></div>
    <PageIntro eyebrow={page.eyebrow} title={page.intro} body={page.answer} actions={<><PrimaryCta /><TextCta href="/pricing" label="Compare plans" /></>} />
    <section className="section feature-product"><ProductFrame variant={variant} title={`${page.name} workspace`} /></section>
    <section className="section narrative-grid"><article><p className="eyebrow">The operational problem</p><h2>Why this matters</h2><p>{page.problem}</p></article><article className="accent-panel"><p className="eyebrow">The Inventman approach</p><h2>A connected workflow</h2><p>{page.answer}</p></article></section>
    <section className="section workflow-section"><div className="section-heading"><p className="eyebrow">Key workflows</p><h2>Move from setup to useful control.</h2></div><ol>{page.workflows.map((workflow, index) => <li key={workflow}><span>{String(index + 1).padStart(2, "0")}</span><p>{workflow}</p></li>)}</ol></section>
    <section className="section benefit-panel"><div><p className="eyebrow">Business benefit</p><h2>Make daily work easier to trust.</h2></div><CheckList items={page.benefits} /></section>
    <RelatedFeatures slugs={page.related} /><Faq items={page.faq} />
    <section className="section inline-cta"><div><h2>See where {page.name.toLowerCase()} fits.</h2><p>Compare current public plans and their configured capabilities.</p></div><Link className="public-button" href="/pricing">View Pricing</Link></section><FinalCta />
  </PublicPage>;
}
