# E2E Suite

Playwright (JavaScript) end-to-end tests para Núcleo ERP.

## Estructura del proyecto

Specs son agrupados por la funcionalidad (feature); se usan setup y helpers guardados dentro de `support/`.

```
desafiolatam-tae/
├── playwright.config.js          # Playwright config (HTML reporter, storageState auth)
├── package.json
├── support/                      # archivos de configuraciones globales
│   ├── global-setup.js           # login una vez -> .auth/user.json
│   └── helpers/
│       └── utils.js              # acciones compartidas (ALLOW_WRITES, helpers)
├── tests/                        # Specs, agrupados por la funcioanalidad (feature)
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
│   └── dashboard.feature         # Panel principal (indicadores)
├── bruno/                        # Bruno API test collection (see bruno/README.md)
└── docs/
    └── screenshots/              # Screenshots
```

La carpeta `features/` tiene escenarios de prueba definidos con la sintaxis de
Gherkin (BDD) cual documenta el compartamiento de la app con lenguaje de negocio. 

Convensión de nombres: `<feature>-<accion>.spec.js`, una carpeta por feature. Los tipos de test estan definidos con las anotaciones `@smoke` y `@regression`.

## Los flujos cubiertos

**Crear**

| Spec | Ubicación |
|------|-----------|
| `tests/clientes/clientes-crear.spec.js` | Gestión de Clientes > Clientes > Crear Cliente |
| `tests/articulos/articulos-crear.spec.js` | Inventario > Artículos > Crear Artículo |
| `tests/facturas-venta/facturas-venta-crear.spec.js` | Gestión de Clientes > Facturas de Venta > Crear Factura de Venta |
| `tests/cobranzas/cobranzas-crear.spec.js` | Gestión de Clientes > Crear Cobranza |

**Búscar / Actualizar / Eliminar**

| Spec | Ubicación |
|------|-----------|
| `tests/clientes/clientes-gestion.spec.js` | Gestión de Clientes > Clientes |
| `tests/articulos/articulos-gestion.spec.js` | Inventario > Artículos |
| `tests/facturas-venta/facturas-venta-gestion.spec.js` | Gestión de Clientes > Facturas de Venta |
| `tests/cobranzas/cobranzas-gestion.spec.js` | Gestión de Clientes > Cobranzas |

Todos los archivos `-gestion` spec cubren: búsqueda, actualización form (`/{recurso}/{id}/editar`) y eliminación, en el modal cancelacion.

**Acceso basado en el rol de Vendedor**

| Spec | Focus |
|------|-------|
| `tests/roles/vendedor-rol.spec.js` | `vendedor` UI de ese rol tiene restricciones de accesos |

Es spec para la cuenta de `vendedor` ese tiene accesos a Clientes,
Artículos y Facturas, pero no tener acceso a  **Cobranzas** ("Acceso
Denegado"), de acuerdo con los permisos. Las credenciales estan guardadas en
`VENDEDOR_USER` / `VENDEDOR_PASS` in `.env`.

## Setup

```bash
cd tests
npm install
npx playwright install chromium
```

Lad credenciales y configuraciones deben estar ne la raiz dentro de `.env`:

```
FRONTEND_BASE_URL=http://localhost
BACKEND_BASE_URL=
ADMIN_USER=
ADMIN_PASS=
ADMIN_LINE_ID=
ADMIN_CATEGORY_ID=
VENDEDOR_USER=
VENDEDOR_PASS=
VENDEDOR_LINE_ID=
VENDEDOR_CATEGORY_ID=
PLAYWRIGHT_CHROMIUM_CHANNEL=chrome
IMCOARCA_ALLOW_WRITES=0
```

`support/global-setup.js` permite logearse una vez y mantiene la session `.auth/user.json` para iniciar cada suit de pruebas ya autenticado.

## Hooks

Al indicar `IMCOARCA_ALLOW_WRITES=1` permite hacer pruebas de creacion/actualizacion y eliminacion.
```bash
IMCOARCA_ALLOW_WRITES=1 npx playwright test
```

## Ejecución suit de prueba

```bash
npm test                                     # todos (HTML report, no Allure)
npm run test:headed                          # headed mode
npx playwright test --grep @smoke            # smoke
npx playwright test --grep @regression       # regression
npx playwright test tests/clientes           # solo desde la carpeta
npx playwright test tests/clientes/clientes-crear.spec.js
npm run report                               # abrir reporte-HTML
```

## Notas

- API-level CRUD tests estan en `bruno/` — vea `bruno/README.md`.
