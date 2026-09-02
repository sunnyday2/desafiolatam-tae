# E2E Suite (proyecto final)

Playwright (JavaScript) end-to-end tests para Núcleo ERP:
https://ADMIN.leonardojose.dev

## Estructura del proyecto

Specs son agrupados por la funcionalidad (feature); se usan setup y helpers guardados dentro de `support/`.

```
desafiolatam-tae/
├── playwright.config.js          # Playwright config (HTML reporter, storageState auth)
├── package.json
├── support/                      # Shared, non-test code
│   ├── global-setup.js           #   logs in once -> .auth/user.json
│   └── helpers/
│       └── utils.js              #   shared actions & guards (ALLOW_WRITES, list helpers)
├── features/                     # BDD specs in Gherkin (.feature, español)
│   ├── pedidos-de-venta.feature  # Pedidos de Venta y flujo de Autorización
│   └── dashboard.feature         # panel principal (indicadores)
├── bruno/                        # Bruno API test collection (see bruno/README.md)
└── docs/
    └── screenshots/              # Screenshots
```

La carpeta `features/` tiene escenarios de prueba definidos con la sintaxis de
Gherkin (BDD) cual documenta el compartamiento de la app con lenguaje de negocio. 

Convensión de nombres: `<feature>-<accion>.spec.js`, una carpeta por feature. Los tipos de test
estan definidos con las anotaciones `@smoke` y `@regression`.

Credenciales y las configuraciones deben ser guardados dentro de  `.env`:

```
BASE_URL=http://localhost
ADMIN_USER=
ADMIN_PASS=
VENDEDOR_USER=
VENDEDOR_PASS=
ADMIN_ALLOW_WRITES=0
```

## Notas

- API-level CRUD tests estan en `bruno/` — vea `bruno/README.md`.
