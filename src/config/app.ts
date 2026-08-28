export const appConfig = {
  name: "Inventman",
  description: "Inventory and business operations, kept under control.",
  locale: "en-GB",
  defaultCurrency: "GBP",
  supportEmail: "support@example.invalid",
  version: "8.0.0",
} as const;

export type AppConfig = typeof appConfig;
