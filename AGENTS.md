<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# family-tree project notes

## Stack
- Next.js 16.2.6 App Router / React 19.2.4 / TypeScript / Tailwind v4
- Firebase client SDK (Auth + Firestore). No Admin SDK or Server Actions in v1
- Visualization: `@xyflow/react` + `dagre`
- Hosting: Firebase App Hosting, region `asia-northeast2` (Osaka)
- CI: GitHub Actions on PR — ESLint + `next build`
- Formatter: Prettier (single quotes, no semi, trailing comma all, 100 width). Tailwind class sort via `prettier-plugin-tailwindcss`

## Conventions
- Dynamic route params/searchParams are `Promise<...>` — always `await` (Next.js 16 requirement)
- Firestore writes from the browser are gated by Security Rules; do not implement parallel server-side write paths
- Tree-level data lives under `trees/{treeId}/...`; the `trees` doc has a `memberIds` array used with `array-contains` for "my trees"
- Auth is Google provider only

## Commands
- `npm run dev` — start dev server (Turbopack)
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- `npm run build` — production build

## Firebase setup expected from the user
Create Firebase project, enable Google auth provider, copy web config into `.env.local` (see `.env.local.example`).
