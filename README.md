# IMCOARCA E2E Suite (proyecto final)

Playwright (JavaScript) end-to-end tests for the IMCOARCA Núcleo ERP:
https://imcoarca.leonardojose.dev

## Project structure

Specs are grouped by feature; shared setup and helpers live under `support/`.

```
tests/desafiolatam-tae/
├── playwright.config.js          # Playwright config (HTML reporter, storageState auth)
├── package.json
├── support/                      # Shared, non-test code
│   ├── global-setup.js           #   logs in once -> .auth/user.json
│   └── helpers/
│       └── utils.js              #   shared actions & guards (ALLOW_WRITES, list helpers)
├── tests/                        # Specs, grouped by feature (testDir)
│   ├── clientes/
│   │   ├── clientes-crear.spec.js
│   │   └── clientes-gestion.spec.js
│   ├── articulos/
│   │   ├── articulos-crear.spec.js
│   │   └── articulos-gestion.spec.js
│   ├── facturas-venta/
│   │   ├── facturas-venta-crear.spec.js
│   │   └── facturas-venta-gestion.spec.js
│   ├── cobranzas/
│   │   ├── cobranzas-crear.spec.js
│   │   └── cobranzas-gestion.spec.js
│   └── roles/
│       └── vendedor-rol.spec.js
├── features/                     # BDD specs in Gherkin (.feature, español)
│   ├── pedidos-de-venta.feature  # Pedidos de Venta y flujo de Autorización
│   └── dashboard.feature         # anel principal (indicadores)
├── bruno/                        # Bruno API test collection (see bruno/README.md)
└── docs/
    └── screenshots/              # Reference screenshots captured during discovery
```

The `features/` folder holds Gherkin behavior specs (BDD) that document app
behavior in business language. They are `.feature` files only (no step
definitions) and use the Spanish Gherkin keywords (`# language: es`).

Naming convention: `<feature>-<accion>.spec.js`, one folder per feature. Test
titles are tagged `@smoke` (critical path) and `@regression` (broader coverage).

## Covered flows

**Create (alta)**

| Spec | Menu path |
|------|-----------|
| `tests/clientes/clientes-crear.spec.js` | Gestión de Clientes > Clientes > Crear Cliente |
| `tests/articulos/articulos-crear.spec.js` | Inventario > Artículos > Crear Artículo |
| `tests/facturas-venta/facturas-venta-crear.spec.js` | Gestión de Clientes > Facturas de Venta > Crear Factura de Venta |
| `tests/cobranzas/cobranzas-crear.spec.js` | Gestión de Clientes > Crear Cobranza |

**Search / Modify / Delete (buscar / modificar / eliminar)**

| Spec | Menu path |
|------|-----------|
| `tests/clientes/clientes-gestion.spec.js` | Gestión de Clientes > Clientes |
| `tests/articulos/articulos-gestion.spec.js` | Inventario > Artículos |
| `tests/facturas-venta/facturas-venta-gestion.spec.js` | Gestión de Clientes > Facturas de Venta |
| `tests/cobranzas/cobranzas-gestion.spec.js` | Gestión de Clientes > Cobranzas |

Each `-gestion` spec covers: searching the list (term + date range where available),
opening the edit form (`/{recurso}/{id}/editar`) and asserting it loads pre-populated,
and opening the delete confirmation modal and cancelling it (safe, non-destructive).

**Role-based access (rol Vendedor)**

| Spec | Focus |
|------|-------|
| `tests/roles/vendedor-rol.spec.js` | The `vendedor` role's UI access and restrictions |

This spec logs in as the `vendedor` account (not the shared admin session, via
`test.use({ storageState: ... })`) and verifies the role can reach Clientes,
Artículos and Facturas de Venta, but is blocked from **Cobranzas** ("Acceso
Denegado"), matching the role's permission set. Credentials come from
`IMCOARCA_VENDEDOR_USER` / `IMCOARCA_VENDEDOR_PASS` in `.env`.

## Setup

```bash
cd tests/e2e-proyecto-final
npm install
npx playwright install chromium
```

Credentials and configuration are read from the repository root `.env`:

```
IMCOARCA_BASE_URL=https://imcoarca.leonardojose.dev
IMCOARCA_USER=tae@testing.com
IMCOARCA_PASS=Tae@2026
IMCOARCA_VENDEDOR_USER=vendedor@testing.com
IMCOARCA_VENDEDOR_PASS=Tae@2026
IMCOARCA_ALLOW_WRITES=0
```

`support/global-setup.js` logs in once and stores the session in `.auth/user.json`,
so every spec starts authenticated.

## Write guard and data lifecycle (hooks)

Because this runs against a live ERP, mutating tests are guarded so a normal run
never changes or removes real data:

- **Create** tests fill and validate the forms but do **not** submit.
- **Modify** tests open the edit form and assert it loads, but do **not** save.
- **Delete** tests open the confirmation modal and click **Cancelar**.

Set `IMCOARCA_ALLOW_WRITES=1` to enable the real mutating tests. When enabled:

- For **Clientes** and **Artículos**, the modify/delete tests use a
  **create-then-delete lifecycle**: they create a throwaway record, edit/delete
  it, and remove it at the end — so the run cleans up after itself.
- For **Facturas** and **Cobranzas** (which can't be created cheaply without a
  client + line items), the real modify/delete tests act on an **existing**
  record. Enable these only knowingly, against a disposable environment.

With the guard off (default), those mutating tests are reported as **skipped**
with a clear reason, which is expected.

## Running

```bash
npm test                                     # all tests (HTML report, no Allure)
npm run test:headed                          # headed mode
npx playwright test --grep @smoke            # smoke only
npx playwright test --grep @regression       # regression only
npx playwright test tests/clientes           # a single feature folder
npx playwright test tests/clientes/clientes-crear.spec.js
npm run report                               # open the last HTML report
```

## Notes

- The ERP forms expose no `data-testid`, so selectors rely on element `id`s,
  ARIA roles/labels, and visible text (in that order of preference).
- API-level CRUD tests live in `bruno/` — see `bruno/README.md`.
