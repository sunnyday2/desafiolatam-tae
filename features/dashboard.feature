# language: es
# Reflejado desde la app real IMCOARCA (https://imcoarca.leonardojose.dev/dashboard):
#   Encabezado "Dashboard" + "Bienvenido al sistema ERP."
#   Tarjetas:
#     - "Cotización Dólar (Venta)"  -> monto, "Fuente: DolarApi (oficial)", "Actualizado: <fecha>"
#     - "Total Saldo Clientes"      -> monto, "Clic para ver detalle por cliente"
#     - "Total Saldo Proveedores"   -> monto, "Clic para ver detalle por proveedor"

@dashboard
Característica: Panel principal (Dashboard)
  Como usuario del sistema
  Quiero ver un panel con indicadores clave al iniciar sesión
  Para conocer de un vistazo la cotización del dólar y los saldos de clientes y proveedores

  Antecedentes:
    Dado que inicié sesión en el sistema
    Y que estoy en la página "Dashboard"

  # ---------------------------------------------------------------------------
  # Visibilidad de los indicadores
  # ---------------------------------------------------------------------------

  @smoke
  Escenario: El dashboard es la página inicial tras iniciar sesión
    Entonces veo el encabezado "Dashboard"
    Y veo el mensaje de bienvenida "Bienvenido al sistema ERP."

  @smoke
  Escenario: Ver las tarjetas de indicadores del dashboard
    Entonces veo la tarjeta "Cotización Dólar (Venta)"
    Y veo la tarjeta "Total Saldo Clientes"
    Y veo la tarjeta "Total Saldo Proveedores"

  @regression
  Esquema del escenario: Cada tarjeta muestra un valor monetario
    Entonces la tarjeta "<tarjeta>" muestra un importe con formato de moneda

    Ejemplos:
      | tarjeta                   |
      | Cotización Dólar (Venta)  |
      | Total Saldo Clientes      |
      | Total Saldo Proveedores   |

  # ---------------------------------------------------------------------------
  # Cotización del dólar
  # ---------------------------------------------------------------------------

  @regression
  Escenario: La tarjeta de cotización indica la fuente y la fecha de actualización
    Cuando observo la tarjeta "Cotización Dólar (Venta)"
    Entonces muestra la fuente "DolarApi (oficial)"
    Y muestra la fecha de última actualización

  # ---------------------------------------------------------------------------
  # Saldos de clientes / proveedores
  # ---------------------------------------------------------------------------

  @regression
  Escenario: La tarjeta de saldo de clientes invita a ver el detalle
    Cuando observo la tarjeta "Total Saldo Clientes"
    Entonces muestra el texto "Clic para ver detalle por cliente"

  @regression
  Escenario: La tarjeta de saldo de proveedores invita a ver el detalle
    Cuando observo la tarjeta "Total Saldo Proveedores"
    Entonces muestra el texto "Clic para ver detalle por proveedor"

  @regression
  Esquema del escenario: Abrir el detalle desde una tarjeta de saldo
    Cuando hago clic en la tarjeta "<tarjeta>"
    Entonces se muestra el detalle de saldos "<detalle>"

    Ejemplos:
      | tarjeta                  | detalle                |
      | Total Saldo Clientes     | detalle por cliente    |
      | Total Saldo Proveedores  | detalle por proveedor  |

  # ---------------------------------------------------------------------------
  # Consistencia de datos
  # ---------------------------------------------------------------------------

  @regression
  Escenario: El saldo total de clientes coincide con el detalle
    Cuando hago clic en la tarjeta "Total Saldo Clientes"
    Entonces la suma de los saldos individuales por cliente es igual al "Total Saldo Clientes"

  # ---------------------------------------------------------------------------
  # Sesión
  # ---------------------------------------------------------------------------

  Escenario: Cerrar sesión desde el dashboard
    Cuando presiono "Cerrar Sesión"
    Entonces la sesión se cierra
    Y soy redirigido a la página de inicio de sesión
