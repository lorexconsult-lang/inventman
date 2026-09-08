import {
  FinalCta,
  PageIntro,
  PrimaryCta,
  PublicPage,
  TextCta,
} from "@/components/marketing/public-shell";
import { getPublicPlans } from "@/features/commercial/plans";
import { PricingTable } from "@/features/commercial/pricing";
import { getCommercialAccessMode } from "@/features/subscriptions/queries";
import { breadcrumbSchema, publicMetadata } from "@/lib/marketing/seo";

export const dynamic = "force-dynamic";
export const metadata = publicMetadata({
  title: "Inventman Access and Plans",
  description:
    "Review Inventman’s current open-access availability and retained subscription architecture.",
  path: "/pricing",
});

export default async function PricingPage() {
  const [plans, accessMode] = await Promise.all([
    getPublicPlans(),
    getCommercialAccessMode(),
  ]);
  const openAccess = accessMode === "OPEN_ACCESS";

  return (
    <PublicPage
      schema={breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Access and plans", path: "/pricing" },
      ])}
    >
      <PageIntro
        eyebrow={openAccess ? "Early access" : "Plans for real operations"}
        title={
          openAccess
            ? "Use the complete Inventman application without a subscription."
            : "Start with a trial. Choose capacity as you grow."
        }
        body={
          openAccess
            ? "Inventman is temporarily operating in open-access mode for legitimate tenant users while real-world feedback is collected. No subscription purchase or payment is required."
            : "Prices, trial periods, features and limits come directly from Inventman’s active public plan configuration."
        }
      />

      <section className="section pricing-section">
        {openAccess ? (
          <div className="notice">
            <p className="eyebrow">Open access is active</p>
            <h2 className="mt-3 text-3xl font-semibold">
              Full functional access, with the existing security boundary.
            </h2>
            <p className="mt-3 max-w-3xl text-subtle">
              Authentication, organization membership, role permissions,
              branch restrictions, tenant isolation and offline-device controls
              remain mandatory. The subscription system is retained for future
              commercial activation.
            </p>
            <div className="mt-6">
              <PrimaryCta label="Create Free Account" />
            </div>
          </div>
        ) : plans.length ? (
          <PricingTable plans={plans} />
        ) : (
          <div className="notice">
            <h2>Plan details are temporarily unavailable</h2>
            <p>
              You can still create an account. No payment will be taken without
              a configured checkout.
            </p>
            <TextCta href="/signup" label="Create an account" />
          </div>
        )}
      </section>

      <section className="section honest-note">
        <h2>
          {openAccess
            ? "No subscription payment is currently required"
            : "Clear commercial boundaries"}
        </h2>
        <p>
          {openAccess
            ? "Existing plans, subscription histories, provider integrations and billing administration remain intact, but they do not restrict ordinary tenant access while open-access mode is active."
            : "Account creation does not take payment. Enterprise pricing is handled as a contact state, and negotiated pricing is never exposed publicly. Live checkout remains unavailable until a supported billing provider is configured."}
        </p>
      </section>
      <FinalCta
        title={
          openAccess
            ? "Start using Inventman and help shape what comes next."
            : undefined
        }
        body={
          openAccess
            ? "Create a secure account, configure your business workspace and use the complete implemented application."
            : undefined
        }
      />
    </PublicPage>
  );
}
