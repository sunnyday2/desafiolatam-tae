# Reflejado desde la app real IMCOARCA (https://imcoarca.leonardojose.dev):
#   - Listado:      /pedidos-de-venta        (encabezado "Listado de Pedidos de Venta")
#   - Alta:         /pedidos-de-venta/nuevo   (botón "Guardar Pedido")
#   - Autorización: /autorizacion-pedidos     (pestañas "Por autorizar" / "Pedidos autorizados")

@pedidos @ventas
Feature: Pedidos de Venta y Autorización
  Como usuario del área de ventas
  Quiero registrar pedidos de venta y gestionar su autorización
  Para controlar qué pedidos avanzan antes de facturarse

  # ---------------------------------------------------------------------------
  # Establece Given para todos los escenarios
  # ---------------------------------------------------------------------------

  Background:
    Given que inicié sesión en el sistema
    And que estoy en el módulo "Gestión de Clientes"

  # ---------------------------------------------------------------------------
  # Listado
  # ---------------------------------------------------------------------------

  @smoke
  Scenario: Ver el listado de pedidos de venta
    When abro la sección "Pedidos de Venta"
    Then veo el encabezado "Listado de Pedidos de Venta"
    And veo el botón "Crear Pedido de Venta"
    And veo los filtros "Desde", "Hasta" y "Buscar"

  Scenario: El listado sin resultados muestra un estado vacío
    Given que estoy en el "Listado de Pedidos de Venta"
    When filtro por un rango de fechas sin pedidos
    Then veo el mensaje "No hay pedidos de venta"

  @regression
  Scenario Outline: Filtrar pedidos por fecha y término de búsqueda
    Given que estoy en el "Listado de Pedidos de Venta"
    When establezco el filtro "Desde" en "<desde>"
    And establezco el filtro "Hasta" en "<hasta>"
    And escribo "<termino>" en el buscador
    And presiono "Buscar"
    Then la tabla de pedidos se actualiza con los resultados del filtro

    Ejemplos:
      | desde      | hasta      | termino  |
      | 2026-05-01 | 2026-08-31 | 00001    |
      | 2026-05-01 | 2026-08-31 |          |

  # ---------------------------------------------------------------------------
  # Establecer límite de búsqueda por rango de las fechas
  # ---------------------------------------------------------------------------

  @regression
  Scenario Outline: Filtrar pedidos por fecha y término de búsqueda
    Given que estoy en el "Listado de Pedidos de Venta"
    When establezco el filtro "Desde" en "<desde>" 
    And establezco el filtro "Hasta" en "<hasta>"
    And escribo "<termino>" en el buscador
    And presiono "Buscar"
    Then aparece modal con alerta sobre que el rango de las fechas debe ser menor de 6 meses

    Ejemplos:
      | desde      | hasta      | termino  |
      | 2020-01-01 | 2035-12-31 | 00001    |

  # ---------------------------------------------------------------------------
  # Alta de pedido
  # ---------------------------------------------------------------------------

  @smoke
  Scenario: Abrir el formulario de creación de pedido
    Given que estoy en el "Listado de Pedidos de Venta"
    When presiono "Crear Pedido de Venta"
    Then se abre el formulario de alta de pedido
    And veo la sección "Items del Pedido"
    And veo el botón "Guardar Pedido"

  @regression
  Scenario: Los campos obligatorios están señalizados en el formulario
    Given que estoy creando un nuevo pedido de venta
    Then el campo "Cliente" es obligatorio
    And el campo "Fecha Pedido" es obligatorio
    And el campo "Moneda" es obligatorio

  @regression
  Scenario: No se puede guardar un pedido sin cliente ni ítems
    Given que estoy creando un nuevo pedido de venta
    When presiono "Guardar Pedido" sin completar los datos obligatorios
    Then el pedido no se guarda
    And permanezco en el formulario de alta de pedido

  @regression
  Scenario: Crear un pedido de venta con un ítem
    Given que estoy creando un nuevo pedido de venta
    When selecciono un cliente por su código
    And establezco la "Fecha Pedido"
    And selecciono la "Moneda"
    And presiono "Agregar Ítem"
    And agrego un artículo con cantidad 2
    And presiono "Guardar Pedido"
    Then el pedido se registra correctamente
    And el pedido aparece en el "Listado de Pedidos de Venta"

  Scenario: Cancelar la creación de un pedido
    Given que estoy creando un nuevo pedido de venta
    When presiono "Cancelar"
    Then vuelvo al "Listado de Pedidos de Venta"
    And no se crea ningún pedido

  # ---------------------------------------------------------------------------
  # Flujo de autorización
  # ---------------------------------------------------------------------------

  @smoke
  Scenario: Ver la bandeja de pedidos por autorizar
    When abro la sección "Autorizar pedidos"
    Then veo el encabezado "Listado de Pedidos por autorizar"
    And veo la pestaña "Por autorizar"
    And veo la pestaña "Pedidos autorizados"

  @regression
  Scenario: Un pedido nuevo queda pendiente de autorización
    Given que se creó un pedido de venta
    When abro la sección "Autorizar pedidos"
    And selecciono la pestaña "Por autorizar"
    Then el pedido aparece en la lista de pendientes con estado "Por autorizar"

  @regression
  Scenario: Autorizar un pedido pendiente
    Given que hay un pedido en la pestaña "Por autorizar"
    When autorizo el pedido
    Then el pedido deja de aparecer en "Por autorizar"
    And el pedido aparece en la pestaña "Pedidos autorizados"

  @regression
  Scenario: Rechazar un pedido pendiente de autorización
    Given que hay un pedido en la pestaña "Por autorizar"
    When rechazo el pedido
    Then el pedido deja de estar pendiente de autorización
    And el pedido no aparece en la pestaña "Pedidos autorizados"

  @regression
  Scenario Outline: Transiciones de estado del pedido según la decisión de autorización
    Given que hay un pedido con estado "Por autorizar"
    When el autorizador realiza la acción "<accion>"
    Then el estado del pedido cambia a "<estado_final>"

    Ejemplos:
      | accion    | estado_final |
      | Autorizar | Autorizado   |
      | Rechazar  | Rechazado    |

  Scenario: La bandeja de autorización sin pendientes muestra un estado vacío
    Given que no hay pedidos pendientes de autorización
    When abro la sección "Autorizar pedidos"
    Then veo el mensaje "No hay pedidos por autorizar"