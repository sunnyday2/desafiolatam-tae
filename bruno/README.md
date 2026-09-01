# IMCOARCA API — Bruno Collection

API-level CRUD tests for the IMCOARCA ERP backend, built with
[Bruno](https://www.usebruno.com/).

Backend base URL: `https://back-imcoarca.leonardojose.dev/api`

## What it covers

The collection tests the REST endpoints for **Clientes** (`/clients`) and
**Artículos** (`/products`), validating HTTP status codes and response payload
structure at each step.

Requests are **logically ordered** so each resource runs a full lifecycle:

```
01 - Auth
  └─ Login                     POST /login          -> 200, stores {{accessToken}}

02 - Clientes
  ├─ 01 - List Clientes        GET    /clients      -> 200, { data: [...] }
  ├─ 02 - Create Cliente       POST   /clients      -> 201, { data: {...} }, stores id
  ├─ 03 - Get Cliente by ID    GET    /clients/{id} -> 200, echoes created values
  ├─ 04 - Update Cliente       PUT    /clients/{id} -> 200, name updated
  ├─ 05 - Delete Cliente       DELETE /clients/{id} -> 204
  └─ 06 - Verify Cliente Deleted GET  /clients/{id} -> 404

03 - Articulos
  ├─ 01 - List Articulos       GET    /products      -> 200, { data: [...] }
  ├─ 02 - Create Articulo      POST   /products      -> 201, { data: {...} }, stores id
  ├─ 03 - Get Articulo by ID   GET    /products/{id} -> 200, echoes created values
  ├─ 04 - Update Articulo      PUT    /products/{id} -> 200, price/name updated
  ├─ 05 - Delete Articulo      DELETE /products/{id} -> 204
  └─ 06 - Verify Articulo Deleted GET /products/{id} -> 404

04 - Rol Vendedor (run with --env vendedor)
  ├─ 01 - Login Vendedor           POST /login  -> 200, asserts role "Vendedor" + permission set
  ├─ 02 - Vendedor Puede Listar Clientes  GET  /clients       -> 200
  ├─ 03 - Vendedor Crea Cliente           POST /clients       -> 201, stores id
  ├─ 04 - Vendedor Edita Cliente          PUT  /clients/{id}  -> 200
  ├─ 05 - Vendedor Elimina Cliente        DELETE /clients/{id}-> 204  (see security note)
  ├─ 06 - Vendedor Crea Articulo          POST /products      -> 201, stores id
  └─ 07 - Vendedor Elimina Articulo       DELETE /products/{id}-> 204
```

## Roles / environments

Two environments are provided:

| Environment | Account | Role |
|-------------|---------|------|
| `imcoarca` | `tae@testing.com` | admin (full permissions) |
| `vendedor` | `vendedor@testing.com` | Vendedor (sales rep) |

The `04 - Rol Vendedor` folder must be run with `--env vendedor` so the login uses
the sales-rep account.

### Security note (observed)

The `Vendedor` role does **not** have `clientes.delete` (nor any `cobranzas`)
permission — the UI blocks those. But the **API does not enforce role
permissions**: a vendedor token can still `DELETE /clients/{id}` (204) and read
`/collections` (200). The vendedor folder asserts this **observed** backend
behavior and documents it in the request `docs`. Treat it as a finding to raise
with the backend team, not as desired behavior.

Every request created during the run is deleted by the end, so the collection
**cleans up after itself** and leaves no test data behind.

## Auth flow

`01 - Auth/Login` posts the credentials and, on success, stores the bearer token
in a runtime variable `accessToken` (via a post-response script). Every
subsequent request sends `Authorization: Bearer {{accessToken}}`.

## Assertions

Each request uses both:

- an `assert` block for the HTTP status code (and key fields), and
- a `tests` block with `expect(...)` assertions that check the payload
  structure — the `{ data: {...} }` / `{ data: [...] }` envelope, presence of the
  core fields, and that created/updated values are echoed back.

## Configuration

The `imcoarca` environment (`environments/imcoarca.bru`) holds:

| Variable | Value |
|----------|-------|
| `baseUrl` | `https://back-imcoarca.leonardojose.dev/api` |
| `email` | `tae@testing.com` |
| `password` | `Tae@2026` |
| `lineId` | `37` (LINEA 1 — required to create a product) |
| `categoryId` | `53` (CATEGORIA 1 — required to create a product) |

## Running

**GUI:** open this folder as a collection in the Bruno app, select the
`imcoarca` environment, and run the folders top to bottom.

**CLI:**

```bash
cd tests/e2e-proyecto-final/bruno

# Admin collection (auth -> clientes -> articulos)
npx @usebruno/cli run "01 - Auth" "02 - Clientes" "03 - Articulos" --env imcoarca

# Vendedor role folder (must use the vendedor environment)
npx @usebruno/cli run "04 - Rol Vendedor" --env vendedor

# A single folder
npx @usebruno/cli run "02 - Clientes" --env imcoarca

# Produce a report
npx @usebruno/cli run "04 - Rol Vendedor" --env vendedor --reporter-html results.html
```

> Run the admin folders with `--env imcoarca` and the `04 - Rol Vendedor` folder
> with `--env vendedor`. Avoid running the whole collection in one command with a
> single env, since the two role folders expect different accounts.

> The requests must run in order (auth first) because later requests depend on
> the `accessToken` and the created record ids stored during the run. Running
> the whole collection or a full folder top-to-bottom preserves that order.
