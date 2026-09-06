import Image from "next/image";

export type InventmanLogoVariant = "primary" | "compact" | "icon" | "dark";

const logoAssets = {
  primary: {
    src: "/brand/inventman-logo-primary.png",
    width: 1600,
    height: 530,
    alt: "Inventman — Inventory. Sales. Profit. Control.",
  },
  compact: {
    src: "/brand/inventman-logo-compact.png",
    width: 1400,
    height: 510,
    alt: "Inventman",
  },
  icon: {
    src: "/brand/inventman-icon.png",
    width: 512,
    height: 512,
    alt: "Inventman",
  },
  dark: {
    src: "/brand/inventman-logo-dark.png",
    width: 1400,
    height: 510,
    alt: "Inventman",
  },
} as const;

export function InventmanLogo({
  variant = "compact",
  alt,
  decorative = false,
  eager = false,
  className,
  sizes,
}: {
  variant?: InventmanLogoVariant;
  alt?: string;
  decorative?: boolean;
  eager?: boolean;
  className?: string;
  sizes?: string;
}) {
  const asset = logoAssets[variant];

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={decorative ? "" : (alt ?? asset.alt)}
      className={className}
      loading={eager ? "eager" : undefined}
      sizes={sizes}
    />
  );
}

export function DocumentBrand({ className }: { className?: string }) {
  return (
    <div className={`document-brand${className ? ` ${className}` : ""}`}>
      <InventmanLogo
        variant="compact"
        className="w-40"
        sizes="160px"
      />
    </div>
  );
}
