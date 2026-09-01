# language: es
# Reflejado desde la app real IMCOARCA (https://imcoarca.leonardojose.dev):
#   - Listado:      /pedidos-de-venta        (encabezado "Listado de Pedidos de Venta")
#   - Alta:         /pedidos-de-venta/nuevo   (botón "Guardar Pedido")
#   - Autorización: /autorizacion-pedidos     (pestañas "Por autorizar" / "Pedidos autorizados")

@pedidos @ventas
Característica: Pedidos de Venta y Autorización
  Como usuario del área de ventas
  Quiero registrar pedidos de venta y gestionar su autorización
  Para controlar qué pedidos avanzan antes de facturarse

  Antecedentes:
    Dado que inicié sesión en el sistema
    Y que estoy en el módulo "Gestión de Clientes"

  # ---------------------------------------------------------------------------
  # Listado
  # ---------------------------------------------------------------------------

  @smoke
  Escenario: Ver el listado de pedidos de venta
    Cuando abro la sección "Pedidos de Venta"
    Entonces veo el encabezado "Listado de Pedidos de Venta"
    Y veo el botón "Crear Pedido de Venta"
    Y veo los filtros "Desde", "Hasta" y "Buscar"

  Escenario: El listado sin resultados muestra un estado vacío
    Dado que estoy en el "Listado de Pedidos de Venta"
    Cuando filtro por un rango de fechas sin pedidos
    Entonces veo el mensaje "No hay pedidos de venta"

  @regression
  Esquema del escenario: Filtrar pedidos por fecha y término de búsqueda
    Dado que estoy en el "Listado de Pedidos de Venta"
    Cuando establezco el filtro "Desde" en "<desde>"
    Y establezco el filtro "Hasta" en "<hasta>"
    Y escribo "<termino>" en el buscador
    Y presiono "Buscar"
    Entonces la tabla de pedidos se actualiza con los resultados del filtro

    Ejemplos:
      | desde      | hasta      | termino  |
      | 2020-01-01 | 2035-12-31 | 00001    |
      | 2026-01-01 | 2026-12-31 |          |

  # ---------------------------------------------------------------------------
  # Alta de pedido
  # ---------------------------------------------------------------------------

  @smoke
  Escenario: Abrir el formulario de creación de pedido
    Dado que estoy en el "Listado de Pedidos de Venta"
    Cuando presiono "Crear Pedido de Venta"
    Entonces se abre el formulario de alta de pedido
    Y veo la sección "Items del Pedido"
    Y veo el botón "Guardar Pedido"

  @regression
  Escenario: Los campos obligatorios están señalizados en el formulario
    Dado que estoy creando un nuevo pedido de venta
    Entonces el campo "Cliente" es obligatorio
    Y el campo "Fecha Pedido" es obligatorio
    Y el campo "Moneda" es obligatorio

  @regression
  Escenario: No se puede guardar un pedido sin cliente ni ítems
    Dado que estoy creando un nuevo pedido de venta
    Cuando presiono "Guardar Pedido" sin completar los datos obligatorios
    Entonces el pedido no se guarda
    Y permanezco en el formulario de alta de pedido

  @regression
  Escenario: Crear un pedido de venta con un ítem
    Dado que estoy creando un nuevo pedido de venta
    Cuando selecciono un cliente por su código
    Y establezco la "Fecha Pedido"
    Y selecciono la "Moneda"
    Y presiono "Agregar Ítem"
    Y agrego un artículo con cantidad 2
    Y presiono "Guardar Pedido"
    Entonces el pedido se registra correctamente
    Y el pedido aparece en el "Listado de Pedidos de Venta"

  Escenario: Cancelar la creación de un pedido
    Dado que estoy creando un nuevo pedido de venta
    Cuando presiono "Cancelar"
    Entonces vuelvo al "Listado de Pedidos de Venta"
    Y no se crea ningún pedido

  # ---------------------------------------------------------------------------
  # Flujo de autorización
  # ---------------------------------------------------------------------------

  @smoke
  Escenario: Ver la bandeja de pedidos por autorizar
    Cuando abro la sección "Autorizar pedidos"
    Entonces veo el encabezado "Listado de Pedidos por autorizar"
    Y veo la pestaña "Por autorizar"
    Y veo la pestaña "Pedidos autorizados"

  @regression
  Escenario: Un pedido nuevo queda pendiente de autorización
    Dado que se creó un pedido de venta
    Cuando abro la sección "Autorizar pedidos"
    Y selecciono la pestaña "Por autorizar"
    Entonces el pedido aparece en la lista de pendientes con estado "Por autorizar"

  @regression
  Escenario: Autorizar un pedido pendiente
    Dado que hay un pedido en la pestaña "Por autorizar"
    Cuando autorizo el pedido
    Entonces el pedido deja de aparecer en "Por autorizar"
    Y el pedido aparece en la pestaña "Pedidos autorizados"

  @regression
  Escenario: Rechazar un pedido pendiente de autorización
    Dado que hay un pedido en la pestaña "Por autorizar"
    Cuando rechazo el pedido
    Entonces el pedido deja de estar pendiente de autorización
    Y el pedido no aparece en la pestaña "Pedidos autorizados"

  @regression
  Esquema del escenario: Transiciones de estado del pedido según la decisión de autorización
    Dado que hay un pedido con estado "Por autorizar"
    Cuando el autorizador realiza la acción "<accion>"
    Entonces el estado del pedido cambia a "<estado_final>"

    Ejemplos:
      | accion    | estado_final |
      | Autorizar | Autorizado   |
      | Rechazar  | Rechazado    |

  Escenario: La bandeja de autorización sin pendientes muestra un estado vacío
    Dado que no hay pedidos pendientes de autorización
    Cuando abro la sección "Autorizar pedidos"
    Entonces veo el mensaje "No hay pedidos por autorizar"
