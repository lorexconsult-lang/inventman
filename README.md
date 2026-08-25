# Inventman

A multi-tenant business operations SaaS foundation built with Next.js 16 and Supabase. The working name is centralized in `src/config/app.ts` and is intentionally replaceable.

## Local development

1. Copy `.env.example` to `.env.local` and provide development Supabase values.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev -- --port 3100` (or use port 3000 when it is available).
4. Generate database types with `npx supabase gen types typescript --local > src/types/database.generated.ts`.
5. Run `npm run dev`.

Never use production credentials for local database reset or migration commands.

## Quality checks

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before merging.
