# Observability operations

Structured logs use timestamp, level, event name, correlation ID, safe dimensions, duration and outcome. Sensitive keys are redacted. Configure `ERROR_MONITORING_DSN` or a Vercel log/trace drain in production and enable provider privacy scrubbing; repository configuration alone is not proof of ingestion.

Minimum dashboards: request rate/error rate/latency p50-p95-p99; live/readiness; auth failures; 429s; webhook failures/retries/duplicates; email failures; scheduled-job lag; database connections/query latency; and PWA sync failures. Alert on sustained 5xx/readiness failure, webhook backlog, cron miss, database saturation, and anomalous authorization failures. Tune thresholds from staging and production baselines.

Use correlation IDs to join customer reports, runtime logs and provider events. Never paste secrets or unredacted tenant records into tickets. Retention and access must follow the approved privacy policy. Review alert ownership and run a synthetic alert test before each production launch.
