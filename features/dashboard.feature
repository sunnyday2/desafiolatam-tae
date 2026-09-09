
# Reflejado desde la app real IMCOARCA (https://imcoarca.leonardojose.dev/dashboard):
#   Tarjetas:
#     - "Cotización Dólar (Venta)"  -> monto, "Fuente: DolarApi (oficial)", "Actualizado: <fecha>"
#     - "Total Saldo Clientes"      -> monto, "Clic para ver detalle por cliente"
#     - "Total Saldo Proveedores"   -> monto, "Clic para ver detalle por proveedor"

@dashboard
Feature: Panel principal (Dashboard)
  Como usuario del sistema
  Quiero ver un panel con indicadores clave al iniciar sesión
  Para conocer de un vistazo la cotización del dólar y los saldos de clientes y proveedores

  # ---------------------------------------------------------------------------
  # Establece Given para todos los escenarios
  # ---------------------------------------------------------------------------

  Background:
    Given que inicié sesión en el sistema
    And que estoy en la página "Dashboard"

  # ---------------------------------------------------------------------------
  # Visibilidad de los indicadores
  # ---------------------------------------------------------------------------

  @smoke
  Scenario: El dashboard es la página inicial tras iniciar sesión
    Then veo el encabezado "Dashboard"
    And veo el mensaje de bienvenida "Bienvenido al sistema ERP."

  @smoke
  Scenario: Ver las tarjetas de indicadores del dashboard
    Then veo la tarjeta "Cotización Dólar (Venta)"
    And veo la tarjeta "Total Saldo Clientes"
    And veo la tarjeta "Total Saldo Proveedores"

  @regression
  Esquema del escenario: Cada tarjeta muestra un valor monetario
    Then la tarjeta "<tarjeta>" muestra un importe con formato de moneda

    Ejemplos:
      | tarjeta                   |
      | Cotización Dólar (Venta)  |
      | Total Saldo Clientes      |
      | Total Saldo Proveedores   |

  # ---------------------------------------------------------------------------
  # Cotización del dólar
  # ---------------------------------------------------------------------------

  @regression
  Scenario: La tarjeta de cotización indica la fuente y la fecha de actualización
    When observo la tarjeta "Cotización Dólar (Venta)"
    Then muestra la fuente "DolarApi (oficial)"
    And muestra la fecha de última actualización

  # ---------------------------------------------------------------------------
  # Saldos de clientes / proveedores
  # ---------------------------------------------------------------------------

  @regression
  Scenario: La tarjeta de saldo de clientes invita a ver el detalle
    When observo la tarjeta "Total Saldo Clientes"
    Then muestra el texto "Clic para ver detalle por cliente"

  @regression
  Scenario: La tarjeta de saldo de proveedores invita a ver el detalle
    When observo la tarjeta "Total Saldo Proveedores"
    Then muestra el texto "Clic para ver detalle por proveedor"

  @regression
  Esquema del escenario: Abrir el detalle desde una tarjeta de saldo
    When hago clic en la tarjeta "<tarjeta>"
    Then se muestra el detalle de saldos "<detalle>"

    Ejemplos:
      | tarjeta                  | detalle                |
      | Total Saldo Clientes     | detalle por cliente    |
      | Total Saldo Proveedores  | detalle por proveedor  |

  # ---------------------------------------------------------------------------
  # Consistencia de datos
  # ---------------------------------------------------------------------------

  @regression
  Scenario: El saldo total de clientes coincide con el detalle
    When hago clic en la tarjeta "Total Saldo Clientes"
    Then la suma de los saldos individuales por cliente es igual al "Total Saldo Clientes"

  # ---------------------------------------------------------------------------
  # Sesión
  # ---------------------------------------------------------------------------

  Scenario: Cerrar sesión desde el dashboard
    When presiono "Cerrar Sesión"
    Then la sesión se cierra
    And soy redirigido a la página de inicio de sesión