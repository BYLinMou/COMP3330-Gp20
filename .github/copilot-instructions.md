## Quick orientation

This is an Expo + React Native (Expo Router) TypeScript app named AuraSpend. Key runtime/service pieces:

- Routing & layout: `app/_layout.tsx` uses Expo Router and contains a `Gate` that redirects between the `(auth)` group and `(tabs)` group based on Supabase auth session.
- Auth: `src/providers/AuthProvider.tsx` exposes `useAuth()` which returns `{ session, loading }`. Use this to gate pages or read the current user session.
- Backend: Supabase client is at `src/services/supabase.ts`. It reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from `expo-constants` (via `app.config.js`) or process.env. Those env vars are required at runtime — the client will throw if missing.
- Storage adapter: `src/services/supabase.ts` uses a platform-aware storage adapter (AsyncStorage on native, localStorage on web). Keep that in mind when adjusting auth persistence.
- Additional tools: `TestTools/ReceiptSmartAnalyzer` contains an external Python tool for receipt OCR/analysis — not part of the Expo app but useful for AI-assisted data entry features.

## How to run & common workflows

- Install dependencies and start Expo: `npm install` then `npm run start` (uses `expo start`). The `package.json` contains convenience scripts: `start`, `android`, `ios`, `web`, `reset-project` (runs `scripts/reset-project.js`) and `lint` (uses `expo lint`).
- Env vars: create a `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, or set them in your environment. `app.config.js` exposes them to `expo-constants.extra` so the app can read them at runtime.

Example: to test auth flows locally

1. Ensure `.env` has the two EXPO_PUBLIC_SUPABASE_* values.
2. npm run start → open simulator or web.
3. The `Gate` in `app/_layout.tsx` will redirect unauthenticated users to `/(auth)/sign-in` and authenticated users to `/(tabs)`.

## Coding patterns and conventions (project-specific)

- Route groups: pages are organized with route groups like `(auth)` and `(tabs)` under `app/`. Respect these group names when adding pages — the `Gate` depends on segments like `segments[0] === '(auth)'`.
- Typed routes: `app.config.js` enables `experiments.typedRoutes`. Prefer route paths that map directly to file names in `app/` to keep navigation consistent.
- Auth state: rely on `useAuth()` from `src/providers/AuthProvider.tsx` for session checks rather than calling Supabase directly in UI components. This centralizes loading state handling.
- Supabase config: update only `src/services/supabase.ts` or `.env`/`app.config.js` for keys. The file currently logs the URL and anon key for debugging — remove or mute those logs in production.
- Theming: lightweight theme files live in `constants/theme.ts` and reused by `components/themed-*.tsx`. Use these themed components where possible for consistent styling.

## Where to look for examples

- Auth + routing: `app/_layout.tsx` and `src/providers/AuthProvider.tsx` (Gate + redirect logic)
- Supabase client: `src/services/supabase.ts` (env, storage adapter)
- UI components: `components/themed-text.tsx`, `components/themed-view.tsx`, `components/ui/*` for common UI primitives and idioms
- Scripts & build: `package.json` and `app.config.js` (expo + env wiring)

## Integration notes & gotchas for agents

- Do not hardcode Supabase keys into source. Use `app.config.js`/`.env` and `expo-constants` as the project does.
- The Supabase client enforces presence of env vars and throws if missing; include a brief check before running flows that expect Supabase to be available.
- Web vs native differences: authentication persistence uses different storage adapters; tests that mock storage should account for `AsyncStorage` vs `localStorage`.
- Small utilities and scripts: `scripts/reset-project.js` exists to reset local state — useful when testing onboarding/auth flows.

## Editing guidance for AI agents

- When adding new screens, create files under `app/` and follow the route-group naming convention (e.g., add `app/(tabs)/new-feature.tsx`).
- For auth-protected screens, use `useAuth()` and show sensible fallback UIs when `loading` is true.
- For database work, put client helpers in `src/services/` and avoid scattering raw Supabase calls across many components.
- Add tests or small demo screens rather than changing `Gate` logic unless you fully replicate its behavior — it's central to navigation.

## Tool calling architecture (for AI-chat features)

**Do NOT hardcode tool implementations into UI components or monolithic files.** Instead:

1. **Group related tools by domain** in `src/services/`. Combine tools for the same feature area in one service file:
   - E.g., all transaction-related tools (get recent transactions, query transactions, transaction stats, etc.) → `src/services/transactions.ts`
   - E.g., all receipt-related tools → `src/services/receipt.ts`
   - E.g., all analytics/reporting tools → `src/services/reports.ts`
2. **Define clear interfaces** for tool inputs and outputs in these service files.
3. **Implement the business logic** completely in the service file — handle data fetching, validation, error handling, and formatting. Export separate functions for each tool.
4. **Register tool definitions and handlers** in `src/services/chat-tools.ts`:
   - Add tool definitions (name, description, parameters schema) to the tools array, grouped by domain.
   - Import the service functions and write handlers that call them.
   - Format responses appropriately for the AI chat interface.

**Example pattern:**
- Domain: transaction-related tools
- Service file: `src/services/transactions.ts` (exports `getRecentTransactions(...)`, `queryTransactions(...)`, `getTransactionStats(...)`, etc.)
- Registration: In `chat-tools.ts`, add multiple tool definitions for transactions, then import the transaction functions and write handlers for each.

This keeps `chat-tools.ts` clean (acts as an orchestrator), reduces file clutter, and makes related service logic testable and reusable across the app.

If anything here is unclear or you want more detail in any section (scripts, env setup, routing examples, or a small example PR), tell me which part to expand and I will iterate.
