# Inventman authenticated UI design system

Phase 13 establishes one restrained, operations-first visual language for tenant workspaces and a related but distinct internal platform console. The system favors scan speed, dense business data, explicit state, and predictable actions over decorative surfaces.

## Foundations

- Typography: Geist Sans for interface copy and Geist Mono for identifiers, quantities, and tabular values. Numerals use tabular figures.
- Canvas: `canvas` is the workspace background; `surface` is the primary content plane; `muted` is for secondary controls and skeletons; `line` separates related regions.
- Semantic colors: `accent` is interactive emphasis, `positive` is successful/available, `warning` is attention/pending, `danger` is destructive/failed, and `info` is informational. Each has a soft background token. Never communicate state by color alone.
- Shape: controls use 8px corners, application surfaces 12px, and status badges may use a pill. Large ornamental rounding is intentionally avoided.
- Elevation: borders define hierarchy. Shadows are limited to overlays and a subtle one-pixel surface lift.
- Spacing: pages use a 4px base rhythm, 16–24px mobile gutters, and 32–40px desktop gutters. Related fields use 12–16px; sections use 24–32px.

Tokens live in `src/app/globals.css` through Tailwind theme variables. Authenticated cross-cutting selectors are scoped beneath `.app-main`, `.app-workspace`, and `.platform-shell` so the public site remains independently expressive.

## Shared components

- `PageHeader`: eyebrow, single page title, concise description, and right-aligned actions. It owns the section divider.
- `Button`: primary, secondary, ghost, and danger variants with consistent size, disabled state, and focus treatment.
- `StatusBadge`: neutral, positive, warning, danger, and info tones. The text must always name the state.
- `EmptyState`: explains why a collection is empty and may contain one next action.
- `MetricCard`: compact label/value/detail summary for operational dashboards.
- `Field` and action feedback components: preserve server-action validation and provide adjacent, readable feedback.
- Dashboard `loading.tsx` and `error.tsx`: stable skeleton geometry and a recoverable error boundary.

Existing tables and forms receive shared behavior under `.app-main`: compact headers, tabular alignment, hover rows, consistent inputs, visible focus rings, and disabled affordances. Feature pages should migrate to explicit shared components when they need sorting, selection, pagination, or custom states; cosmetic wrapper duplication should not be reintroduced.

## Application shell

Desktop uses a persistent dark 256px sidebar, a sticky contextual topbar, and a bounded fluid content region. Navigation remains capability- and entitlement-filtered. Grouping is stable: Main, Operations, Business setup, Administration.

Mobile replaces the former overflowing destination strip with a single menu trigger and off-canvas drawer. The drawer closes after navigation, on backdrop interaction, or with Escape. It uses the same filtered information architecture as desktop.

Breadcrumbs are derived from the route and use human-readable resource names. Opaque database identifiers are represented as “Details” to avoid exposing implementation noise. Organization switching and offline safety checks retain their original behavior.

## Responsive and accessibility rules

- Support starts at 360 CSS pixels. No application-level horizontal overflow is permitted; wide data tables may scroll inside their own bounded region.
- Touch targets are at least 40px, with the primary mobile navigation target at 44px.
- Every interactive control requires an accessible name. Landmarks and current-page state must remain explicit.
- Keyboard focus uses a three-pixel accent ring with offset. Escape closes the mobile navigation overlay.
- Reduced-motion preference suppresses nonessential motion.
- Print removes application navigation/topbar and prints tables on a white canvas.
- Empty, loading, error, offline, disabled, and permission-denied states must explain both the condition and available recovery.

## Content and numbers

Use sentence case, direct verbs, and domain language already established in business rules. Dates, money, and quantities must continue through the existing formatters and organization settings; visual redesign must not introduce client-only arithmetic or alternate financial truth.

## Extension checklist

Before shipping a new authenticated screen, confirm that it has one page title, a visible current navigation context, a deliberate empty state, keyboard-reachable actions, a 360px check, a wide-table containment strategy, semantic status text, server-owned authorization, and no hard-coded domain formatting that bypasses existing helpers.
