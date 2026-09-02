# IMCOARCA API — Bruno Collection

Tests de backend API CRUD con [Bruno](https://www.usebruno.com/) para the IMCOARCA ERP.
URL de Backend: `http://localhost/api`

## Que cubren las pruebas

Collección de pruebas de REST endpoints para **Clientes** (`/clients`) y
**Artículos** (`/products`), que validan estados de las respuestas HTTP y sus códigos.

Las peticiones estan **logicamente ordenadas** para ser ejecutadas:

```
01 - Auth
  └─ Login                     POST /login          -> 200, guarda el {{accessToken}}

02 - Clientes
  ├─ 01 - List Clientes        GET    /clients      -> 200, { data: [...] }
  ├─ 02 - Create Cliente       POST   /clients      -> 201, { data: {...} }, guarda el id
  ├─ 03 - Get Cliente by ID    GET    /clients/{id} -> 200, retorna los valores creados
  ├─ 04 - Update Cliente       PUT    /clients/{id} -> 200, actualiza name
  ├─ 05 - Delete Cliente       DELETE /clients/{id} -> 204
  └─ 06 - Verify Cliente Deleted GET  /clients/{id} -> 404

03 - Articulos
  ├─ 01 - List Articulos       GET    /products      -> 200, { data: [...] }
  ├─ 02 - Create Articulo      POST   /products      -> 201, { data: {...} }, guarda el id
  ├─ 03 - Get Articulo by ID   GET    /products/{id} -> 200, retorna los valores creados
  ├─ 04 - Update Articulo      PUT    /products/{id} -> 200, actualiza price/name
  ├─ 05 - Delete Articulo      DELETE /products/{id} -> 204
  └─ 06 - Verify Articulo Deleted GET /products/{id} -> 404

04 - Rol Vendedor (ejecuta con --env vendedor)
  ├─ 01 - Login Vendedor           POST /login  -> 200, asserts para rol de "Vendedor" + permisos
  ├─ 02 - Vendedor Puede Listar Clientes  GET  /clients       -> 200
  ├─ 03 - Vendedor Crea Cliente           POST /clients       -> 201, guarda el id
  ├─ 04 - Vendedor Edita Cliente          PUT  /clients/{id}  -> 200
  ├─ 05 - Vendedor Elimina Cliente        DELETE /clients/{id}-> 204 
  ├─ 06 - Vendedor Crea Articulo          POST /products      -> 201, guarda el id
  └─ 07 - Vendedor Elimina Articulo       DELETE /products/{id}-> 204
```

## Pasos para agregar los Secrets en GitHub
- Ir a la página principal de tu repositorio en GitHub.
- Hacer clic en Settings (Configuración) > Secrets and variables > Actions.
- Hacer clic en New repository secret con nombre `BRUNO_TEST`.
- Agregar los dos secretos con formato JSON, con su data entre las comillas dobles:
  - Secret: `ENV_ADMIN`
```json  
{
  "BASE_URL": "http://localhost/api",
  "ADMIN_USER": "",
  "ADMIN_PASS": "",
  "ADMIN_LINE_ID": "",
  "ADMIN_CATEGORY_ID": ""
}
```
  - Secret: `ENV_VENDEDOR`
```json  
{
  "BASE_URL": "http://localhost/api",
  "VENDEDOR_USER": "",
  "VENDEDOR_PASS": "",
  "VENDEDOR_LINE_ID": "",
  "VENDEDOR_CATEGORY_ID": ""
}
```


## Roles / environments

Crear un archivo `.env` y ingresa los credenciales:
```bash
cp .env.example .env  
```

Tiene dos reoles:

| Environment | Account | Role |
|-------------|---------|------|
| `admin`     | `admin@correo.com`    | admin (permisos totales) |
| `vendedor`  | `vendedor@correo.com` | Vendedor                 |

Carpeta `04 - Rol Vendedor` debe ser ejecutada con `--env vendedor` para que login usa la cuenta de vendedor.


### Observaciones sobre la seguridad en backend

El `Vendedor` **no** puede eliminar `clientes` o `cobranzas`
La interfaz UI no lo permite. Pero, en backend la **API no controla los permisos para ese rol**: con un token de vendedor permite ejecutar `DELETE /clients/{id}` (204) y listar la collección
`/collections` (200). Ese compartamiento no deseable debe ser alertado al equipo de backend.

## Auth flow

`01 - Auth/Login` envia los credenciales y los guarda en bearer token
dentro de la variable del entorno `accessToken` (post-response script). Cada peticion envia `Authorization: Bearer {{accessToken}}`. 

## Configuración

Entorno de `admin` (`environments/admin.bru`) y de `vendedor` (`environments/vendedor.bru`)

## Ejecución

**GUI:** abrir la carpeta con la collection de Bruno app, y eleguir entorno
`admin`, ejecutar la colleccion.

**CLI:**

```bash
cd bruno

# pruebas para administrador
npx dotenv-cli -e ../.env -- npx @usebruno/cli run "01 - Auth" "02 - Clientes" "03 - Articulos" --env admin

# pruebas para vendedor
npx dotenv-cli -e ../.env -- npx @usebruno/cli run "04 - Rol Vendedor" --env vendedor

# solo una carpeta
npx dotenv-cli -e ../.env -- npx @usebruno/cli run "02 - Clientes" --env admin

# crear reporte
npx dotenv-cli -e ../.env -- npx @usebruno/cli run "04 - Rol Vendedor" --env vendedor --reporter-html results.html

```

> Cada rol debe ser ejecutado dentro su carpeta con el entorno correspondiente: vendedor debe ser ejecutado con `--env vendedor` y la `04 - Rol Vendedor`.

