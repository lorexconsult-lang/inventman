import { z } from "zod";

export const deploymentEnvironmentSchema = z.enum(["local", "development", "staging", "production"]);

const serverEnvironmentSchema = z.object({
  APP_ENV: deploymentEnvironmentSchema.default("local"),
  APP_VERSION: z.string().min(1).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(8).optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(8).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  EMAIL_FROM: z.email().optional(),
  ERROR_MONITORING_DSN: z.url().optional(),
  RATE_LIMIT_REST_URL: z.url().optional(),
  RATE_LIMIT_REST_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(20).optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(values: Record<string, string | undefined> = process.env): ServerEnvironment {
  const parsed = serverEnvironmentSchema.parse(values);
  if (parsed.APP_ENV === "production" && parsed.APP_VERSION === "development") {
    throw new Error("APP_VERSION must identify the deployed release in production");
  }
  return parsed;
}

export function productionReadiness(environment = parseServerEnvironment()) {
  const smtpConfigured = Boolean(environment.SMTP_HOST && environment.SMTP_PORT && environment.SMTP_USER && environment.SMTP_PASSWORD && environment.EMAIL_FROM);
  return {
    environment: environment.APP_ENV,
    version: environment.APP_VERSION,
    smtpConfigured,
    billingConfigured: Boolean(environment.PAYSTACK_SECRET_KEY || environment.FLUTTERWAVE_WEBHOOK_SECRET),
    monitoringConfigured: Boolean(environment.ERROR_MONITORING_DSN),
    distributedRateLimitConfigured: Boolean(environment.RATE_LIMIT_REST_URL && environment.RATE_LIMIT_REST_TOKEN),
  };
}
