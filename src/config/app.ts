export const appConfig = {
  name: "Inventman",
  description: "Business inventory, sales and profitability operating system.",
  locale: "en-GB",
  defaultCurrency: "GBP",
  supportEmail: "support@example.invalid",
  version: "8.0.0",
} as const;

export type AppConfig = typeof appConfig;
