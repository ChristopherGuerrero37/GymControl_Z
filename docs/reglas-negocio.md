# Reglas de negocio de GymControl Z

Una regla de negocio es una condición que el sistema debe cumplir **siempre**, sin importar quién lo use ni desde dónde. Se numeran (RN-01, RN-02…) para citarlas en los pedidos al agente, en las pruebas y en los commits.

Toda regla se valida **en la API**. La validación en React es solo una ayuda para el usuario.

## Reglas

### Lógica de Socios y Verificación

RN-01 (DUI/ID Único): No se pueden registrar dos socios con el mismo número de DUI o documento de identidad en el mismo gimnasio.

RN-02 (Cálculo Dinámico de Estado): El estado del socio (activa, por_vencer, vencida) no se edita a mano; se calcula comparando la fecha actual contra la fecha_vencimiento. Si faltan 5 días o menos, pasa automáticamente a por_vencer.

RN-03 (Renovaciones Acumulativas): Si un socio renueva su membresía antes de que venza la actual, los nuevos días (ej. 30 días) se le suman a su fecha de vencimiento futura, no a la fecha de hoy, para no quitarle los días que ya pagó.

### Lógica de Reservas y Clases

RN-04 (Cupo Limitado y Sin Duplicados): Un socio no puede reservar la misma clase dos veces, ni se pueden emitir reservas si cupos_disponibles === 0.

RN-05 (Reserva Solo para Socios Activos): Si la membresía del socio está vencida, el sistema debe bloquear el botón de reserva e indicarle que debe renovar su plan primero.

RN-06: Restricción de Reservas para Socios Activos

- Solo los socios con estado `activa` o `por_vencer` pueden reservar cupos en clases colectivas (ya sea desde su portal móvil o inscritos manualmente por el recepcionista).
- Si un socio está `vencido`, el sistema bloquea la inscripción y solicita renovar su plan primero.

### Lógica de Promociones y Referidos

RN-07: Control Riguroso de Cupos y Duplicados

- Un socio no puede ser inscrito en la misma clase más de una vez, sin importar si la reserva se hace desde el portal cliente o desde recepción.
- La reserva se confirma únicamente si `cupos_disponibles > 0`, reduciendo en 1 el contador disponible.

RN-08 (Límite de Uso de Código): Un socio solo puede canjear una vez la oferta "Trae a un amigo" por cada cliente nuevo registrado que presente su código.

## Estados

Dibuja los estados de cada entidad que los tenga y qué cambios están permitidos. Cada flecha permitida (y cada una prohibida) es una regla de negocio.

### socios (membresía)

┌──────────────┐
│ │ (faltan > 5 días)
▼ │
┌────────┐ ┌────┴─────┐ ┌──────────┐
──► ───►│ activa │────►│por_vencer│────►│ vencida │
└────────┘ └──────────┘ └────┬─────┘
▲ ▲ │
│ │ │
└──────────────┴────────────────┘
(renovación de plan)

Prohibido: pasar manualmente a `vencida` si la fecha actual es menor o igual a `fecha_vencimiento`. El cambio de estado es automático según el tiempo restante.

---

### reservas (clases colectivas)

confirmada ──► completada
│
└──► cancelada

Prohibido: modificar una reserva en estado completada o cancelada. No se puede pasar de cancelada a confirmada sin validar cupos en tiempo real (RN-07).

---

### promociones

activa ──► expirada
│
└──► desactivada

Prohibido: reactivar automáticamente una promoción cuya fecha_fin ya venció.

---

## Cálculos

Fórmulas que el sistema debe aplicar siempre igual (totales, impuestos, fechas de vencimiento, cupos…).

| Código    | Cálculo                                                                                                                                         | Ejemplo                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **RN-11** | **Fecha de vencimiento (Inscripción inicial)** = `fecha_inicio` + `duracion_dias` del plan                                                      | Inscripción el 01/11/2026 con plan Mensual (30 días) = Vence el 01/12/2026.                               |
| **RN-12** | **Fecha de vencimiento (Renovación anticipada)** = `fecha_vencimiento_actual` + `duracion_dias` del nuevo plan                                  | Socio vence el 15/11/2026 y renueva el 10/11/2026 con plan Mensual (30 días) = Nueva fecha el 15/12/2026. |
| **RN-13** | **Días restantes de membresía** = `CEIL((fecha_vencimiento - fecha_actual) en milisegundos / 86,400,000)`                                       | Si la fecha actual es 10/11 y vence 20/11 = Quedan 10 días. Si es menor a 0 = 0 días.                     |
| **RN-14** | **Ingresos del mes** = Suma de la columna `monto` en la tabla `pagos` donde `MONTH(fecha_pago) = mes_actual` y `YEAR(fecha_pago) = anio_actual` | 10 renovaciones de $25.00 en el mes = $250.00 de ingreso mensual.                                         |
| **RN-15** | **Cupos disponibles de clase** = `cupo_maximo` - (conteo de registros en `reservas` con estado `confirmada` o `completada`)                     | Clase de Spinning con `cupo_maximo` = 15 y 12 reservas activas = 3 cupos disponibles.                     |
| **RN-16** | **Porcentaje de ocupación de clase** = `(reservas_confirmadas / cupo_maximo) * 100`                                                             | 12 reservas en clase de 15 cupos = 80% de ocupación.                                                      |

---

## Otras Reglas

RN-17 (QR Dinámico Anti-Fraude): El código QR del portal del socio se regenera cada 30 segundos incluyendo una marca de tiempo (timestamp). El verificador rechaza códigos cuya marca de tiempo tenga más de 60 segundos de antigüedad.

RN-18 (Revocación Instantánea): Si un socio tiene acceso_revocado = true, su estado pasa a suspendida de inmediato y el verificador bloquea su entrada mostrando "CREDENCIAL REVOCADA — Contactar Administración", sin importar si tiene días vigentes.

RN-19 (Control de Acceso por Roles - RBAC):

- dueno: Acceso total (finanzas, reportes, socios, clases, usuarios).
- recepcion: Gestión de socios, pagos, verificador de acceso y clases (sin acceso a métricas financieras globales ni configuración de usuarios).
- entrenador: Acceso exclusivo al módulo de clases asignadas a su nombre y listado de socios inscritos en ellas.
