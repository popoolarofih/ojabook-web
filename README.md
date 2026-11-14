# ojabook-web

The OjaBook marketing site and the installable, offline first app. Mobile first, with a persistent sidebar on desktop and a bottom bar on phones.

```bash
npm ci
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
```

| Command | Purpose |
|---|---|
| `npm run lint` | ESLint and `scripts/check-design-rules.mjs` |
| `npm run typecheck`, `npm test` | Types and unit tests |
| `npm run test:e2e` | Playwright on phone and desktop. Needs the API running and its log in `E2E_API_LOG`. Set `CHROMIUM_PATH` to use a browser you already have. |
| `npm run api:types` | Regenerate `src/lib/api/schema.d.ts` from `contracts/openapi.json` |
| `npm run assets` | Regenerate PNG icons and the sharing image |

## Structure

```
src/app/            Routes. (marketing) landing, login, onboarding, invite, privacy, terms, offline, app/*
src/components/     ui primitives, marketing sections, app shell
src/content/        Landing page copy (tested against the copy rules)
src/features/       auth, sales (POS, receipt), inventory, customers, shared
src/lib/            API client, money, offline (Dexie, sync engine, stock maths)
public/sw.js        Service worker: app shell cache, never API data
contracts/          Vendored OpenAPI contract
docs/               Landing brief and design system notes
```

## Offline model

1. Recording a sale, customer, repayment or expense writes it to IndexedDB first (`LOCAL_PENDING`) and only then says it is saved.
2. The sync engine sends batches whose operation ids are idempotency keys. Triggers: startup, browser online, tab visible, every 30 seconds while something is waiting, the Sync now button, and optional Background Sync as a hint only.
3. Failures retry with exponential backoff and jitter. Validation failures stop and explain. Stock conflicts are kept and shown on the Sync screen.
4. Cached stock drops as pending sales are recorded, so a cashier cannot sell the same item twice offline.
5. Tokens are never stored. See the repository README for how an offline reload works.

## Design system

Tokens and the named text styles (`heading-1` to `caption-5`) are in `src/app/globals.css`. Spacing uses only the approved scale, radii use Tailwind values, motion uses `cubic-bezier(0.22, 1, 0.36, 1)`, icons are Phosphor. `npm run lint` enforces the mechanical parts. See [`docs/design-system.md`](docs/design-system.md).
