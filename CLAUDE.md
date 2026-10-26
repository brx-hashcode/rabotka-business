@AGENTS.md

## Project conventions

- Started from `../rabotka-agent` (Next.js): same structure, components and session design. Follow it, and `../rabotka-admin` behind it, for new patterns.
- `/` is the public landing (`src/app/(marketing)`); a signed-in visitor is sent to `/espace`. Every other page needs a session (`src/proxy.ts` redirects to `/auth/sign-in`). Whether the account is a business is the backend's call (`BusinessProfileGuard`), never the cookie's.
- Import from `src` with `#/…` (shadcn aliases use it too).
- UI: flat, borderless cards — `bg-card` on `bg-page` (or the reverse), no `border`, no shadow; only floating layers (dialogs, menus, popovers) get `shadow-soft`.
- API: one controller per backend controller in `src/lib/api/`, extending `BusinessBaseController` (a 401 triggers one single-flight session refresh and a retry).
- Browser calls stay same-origin (`/api/v1/...`); `src/proxy.ts` forwards to `BACKEND_URL` at runtime and turns the `rb_at` cookie into the `Authorization: Bearer` header the backend expects.
- Session: the backend's bearer login (`auth/mobile/*`); tokens live only in httpOnly cookies (`rb_at`/`rb_rt`), set and cleared by the route handlers in `src/app/session/`. Client JS never sees a token.
- Sign-in is `/auth/sign-in`; in-app navigations to it (an expired session) are intercepted by `src/app/@modal` into a dialog (full-screen below `md`).
- Copy is French; in visible copy the site is `www.rabotka.work`.
- Words follow `docs/lexique.md` (one word per idea: candidat, retenir, obtenir le contact, contacts inclus, métier, en ligne, Messages, Aide…); no inclusive « ·e »; never internal mechanics (déblocage, quota) on screen.
- Run tools via `node_modules/.bin/…`, not npx/pnpm exec.
