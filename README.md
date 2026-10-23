# rabotka-business

Dashboard for business accounts on Rabotka — PME, écoles, ONG, administrations
(`Profile.is_business` + its `Business` in rabotka-backend). Businesses sign up
and sign in by email code, from a browser, outside WhatsApp.

Started from `rabotka-agent`: same structure, components and session design.

Next.js 16 (App Router) with the same structure and core stack as
`rabotka-admin`: Tailwind 4 + shadcn (radix / base-ui), TanStack Query & Table,
react-hook-form + zod, nuqs, zustand, sonner, `mvc-front-sdk` for API
controllers.

## Getting started

```bash
cp .env.example .env   # set BACKEND_URL
pnpm install
pnpm dev               # http://localhost:3500
```

| Variable      | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `BACKEND_URL` | rabotka-backend origin, no trailing slash. Read at runtime.    |
| `PORT`        | Port for the Docker container (dev scripts pin 3500).          |

The browser only ever calls `/api/...` on its own origin; `src/proxy.ts`
forwards those requests to `BACKEND_URL`, so the backend needs no CORS entry
for this app.

## Session

Sign-in uses the backend's bearer-token login (`auth/mobile/send-otp`,
`verify-otp`, `refresh`, `logout`). The route handlers in `src/app/session/`
put the tokens in httpOnly cookies on this origin (`rb_at`, `rb_rt`); the proxy
turns `rb_at` into the `Authorization: Bearer` header. Client JS never sees a
token. A 401 triggers one single-flight refresh and a retry.

## Scripts

| Script      | Does                          |
| ----------- | ----------------------------- |
| `dev`       | Next dev server on :3500      |
| `build`     | Production build (standalone) |
| `start`     | Serve the build on :3500      |
| `lint`      | ESLint                        |
| `typecheck` | `tsc --noEmit`                |
| `test`      | Vitest                        |

## Layout

```
src/
  app/          routes, layout, globals.css, providers/
  components/   shared components; ui/ holds shadcn primitives
  config/       appConfig (apiUrl, pagination…)
  features/     one folder per feature (auth, home, layout…)
  hooks/        React Query hooks
  lib/          utils; api/ holds one controller per backend controller
  stores/       zustand stores
  env.ts        validated server env
  proxy.ts      /api/* → BACKEND_URL; pages require a session
```

Add shadcn components with `node_modules/.bin/shadcn add <name>`.

## Docker

`Dockerfile` builds the Next standalone server. `docker-compose.prod.yml` runs
the GHCR image behind Traefik on `AGENT_DOMAIN`.

## Deployment

Same pipeline as rabotka-admin (`.github/workflows/`):

| Workflow                   | Trigger               | Does                                                              |
| -------------------------- | --------------------- | ----------------------------------------------------------------- |
| `deploy-develop.yml`       | PR merged → `develop` | Builds the image to GHCR, deploys `~/rabotka-business`, smoke-tests   |
| `deploy-production.yml`    | PR merged → `main`    | Redeploys the latest image to `~/rabotka-business-prod`, smoke-tests  |
| `sync-main-to-develop.yml` | push to `main`        | Fast-forwards `develop` to `main` after a release                 |

Each deploy reads `BACKEND_URL` and `PORT` from Vault
(`apps/rabotka-business-develop` / `apps/rabotka-business-production`) and writes
them to the VPS `.env`. Develop is served at `business-rabotka.<INFRA_DOMAIN>`;
production at the `PROD_AGENT_DOMAIN` secret.
