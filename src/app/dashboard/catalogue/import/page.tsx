import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CatalogueImportForm } from "@/features/catalogue/components/import-form";
export default function ImportPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="Import products"
        description="Validate every row before creating up to 500 simple products."
        actions={
          <Link
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
            href="/dashboard/catalogue/template"
          >
            Download template
          </Link>
        }
      />
      <CatalogueImportForm />
    </div>
  );
}
