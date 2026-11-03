# Historias de usuario de GymControl Z

Cada funcionalidad se escribe como una historia: **quién** la necesita, **qué** quiere y **para qué**. Debajo van sus criterios de aceptación: frases que se pueden **comprobar** en el navegador o en REST Client.

Cada historia es una unidad de trabajo con el agente: un pedido, sus pruebas y un commit.

---

## Entrega 1: Base

### HU-01 Registrar el gimnasio

**Como** dueño de un gimnasio, **quiero** registrar mi negocio y mi cuenta de administrador, **para** comenzar a gestionar las membresías de mis socios.

**Criterios de aceptación:**

- Al registrar el gimnasio con datos válidos (nombre, teléfono, correo, contraseña), el sistema me redirige al Dashboard con mi sesión activa.
- Si el correo ya está registrado en la plataforma, muestra el mensaje: _"Ya existe una cuenta registrada con este correo"_.
- La contraseña se almacena encriptada en la base de datos utilizando `bcryptjs` (RN-04).

**Reglas involucradas:** RN-04

---

### HU-02 Iniciar y cerrar sesión

**Como** administrador o recepcionista, **quiero** iniciar sesión con mis credenciales, **para** acceder al panel de administración del gimnasio.

**Criterios de aceptación:**

- Si ingreso correo y contraseña correctos, obtengo acceso y un token `JWT` válido.
- Si las credenciales son incorrectas, muestra el error: _"Correo o contraseña incorrectos"_.
- Al recargar la página, la sesión se mantiene activa.
- Al hacer clic en "Cerrar sesión", el token se destruye y si intento ingresar a `/admin/*` sin sesión, me redirige al Login (RN-04).

**Reglas involucradas:** RN-04

---

## Entrega 2: Funcionalidad Principal

### HU-03 Configurar planes de membresía

**Como** administrador, **quiero** crear y gestionar los planes ofrecidos por el gimnasio (Mensual, Trimestral, Anual), **para** asignarlos a los nuevos socios.

**Criterios de aceptación:**

- Puedo crear un plan especificando nombre, duración en días (ej. 30, 90) y precio.
- Si omito un campo obligatorio, el formulario resaltará los errores mediante validación con Zod.
- Un gimnasio no puede ver ni modificar los planes configurados por otro gimnasio en la plataforma.

**Reglas involucradas:** RN-01

---

### HU-04 Inscripción y registro de socios

**Como** recepcionista, **quiero** registrar nuevos socios capturando sus datos y asignándoles un plan, **para** habilitar su acceso al gimnasio.

**Criterios de aceptación:**

- Al registrar un socio con nombre, DUI (formato 00000000-0), teléfono y plan, el sistema calcula automáticamente la `fecha_vencimiento` inicial (RN-11).
- Si intento registrar un DUI que ya existe en el gimnasio, muestra el error: _"Ya existe un socio registrado con este DUI"_ (RN-01).
- El sistema asigna automáticamente un `codigo_referido` único al socio para el programa de promoción.

**Reglas involucradas:** RN-01, RN-02, RN-11

---

### HU-05 Verificador Rápido de Acceso por DUI

**Como** recepcionista, **quiero** digitar o buscar el DUI de un socio en una pantalla de acceso directo, **para** verificar si su membresía está activa en segundos durante horas pico.

**Criterios de aceptación:**

- Al ingresar el DUI o nombre en el buscador, la pantalla muestra de inmediato un banner de gran tamaño:
  - **Verde ("ACCESO PERMITIDO"):** Si la membresía está `activa` o `por_vencer`.
  - **Rojo ("MEMBRESÍA VENCIDA"):** Si la `fecha_vencimiento` es menor a la fecha actual (RN-02).
- Muestra los días restantes calculados exactamente en tiempo real (RN-13).

**Reglas involucradas:** RN-02, RN-13

---

### HU-06 Renovación de membresías

**Como** recepcionista, **quiero** registrar el pago de renovación de un socio, **para** extender la vigencia de su plan sin perder sus días previamente pagados.

**Criterios de aceptación:**

- Al hacer clic en "Renovar", si la membresía aún no vence, la nueva duración se suma a su `fecha_vencimiento` futura (RN-03, RN-12).
- Si la membresía ya estaba vencida, el nuevo ciclo se calcula a partir del día de hoy.
- Cada renovación genera automáticamente un nuevo registro en la tabla de `pagos`.

**Reglas involucradas:** RN-03, RN-12, RN-14

---

## Entrega 3: Funcionalidad Estrella ⭐

### HU-07 Portal del Cliente y Carnet Digital QR

**Como** cliente/socio, **quiero** ingresar desde mi teléfono a mi portal personal por mi DUI o enlace único, **para** consultar mi carnet digital con código QR y mis días restantes.

**Criterios de aceptación:**

- El cliente accede sin ingresar contraseña desde la ruta `/socio/:dui` (RN-05).
- Muestra un carnet digital con el código QR renderizado dinámicamente (`qrcode.react`).
- Muestra una barra/contador visual con los días restantes antes de que venza su plan (RN-13).
- La vista del socio no incluye controles administrativos ni información financiera del negocio.

**Reglas involucradas:** RN-02, RN-05, RN-13

---

### HU-08 Gestión de Clases Colectivas (Admin)

**Como** administrador, **quiero** agendar clases colectivas (Spinning, Yoga, Coach), **para** organizar los horarios y limitar los cupos de las instalaciones.

**Criterios de aceptación:**

- El administrador crea una clase especificando nombre, coach, fecha/hora y `cupo_maximo`.
- La clase aparece inmediatamente disponible en la agenda del gimnasio y en el portal de los socios.
- El administrador puede cancelar o marcar asistencia a las clases agendadas.

**Reglas involucradas:** RN-15, RN-16

---

### HU-09 Reserva de Clases en Tiempo Real (Cliente)

**Como** socio activo, **quiero** reservar mi lugar en una clase colectiva desde mi portal móvil, **para** asegurar mi cupo con anticipación.

**Criterios de aceptación:**

- Si el socio tiene estado `activa` o `por_vencer`, puede presionar "Reservar cupo" (RN-06).
- Si el socio está `vencido`, el botón se deshabilita mostrando el mensaje: _"Membresía vencida. Renueva tu plan para reservar"_.
- Si se confirma la reserva, se descuenta en 1 el contador de `cupos_disponibles` en tiempo real (RN-07, RN-15).
- El socio no puede reservar 2 veces la misma clase. Si `cupos_disponibles === 0`, la clase se marca como "AGOTADA".

**Reglas involucradas:** RN-06, RN-07, RN-08, RN-15

---

### HU-10 Módulo de Promociones y Referidos

**Como** cliente, **quiero** visualizar las promociones globales del gimnasio y obtener mi código de referido ("Trae a un amigo"), **para** compartirlo con mis contactos y obtener beneficios.

**Criterios de aceptación:**

- El portal del cliente despliega las tarjetas promocionales activas creadas por la administración.
- Las promociones con `fecha_fin` vencida no se muestran (RN-09).
- Incluye un botón para copiar mi código de referido o abrir WhatsApp directamente con un mensaje predeterminado.

**Reglas involucradas:** RN-09, RN-10

---

## Entrega 4: Publicación y Presentación

### HU-11 Dashboard de Métricas e Ingresos del Negocio

**Como** dueño del gimnasio, **quiero** ver un panel general con tarjetas numéricas y gráficas, **para** conocer el estado de mi negocio y mis ingresos del mes.

**Criterios de aceptación:**

- Muestra el total de socios activos, socios por vencer en los próximos 5 días y socios vencidos.
- Muestra la suma total de ingresos generados en el mes en curso a partir de la tabla de pagos (RN-14).
- Muestra el porcentaje global de ocupación de las clases colectivas (RN-16).

**Reglas involucradas:** RN-14, RN-16
