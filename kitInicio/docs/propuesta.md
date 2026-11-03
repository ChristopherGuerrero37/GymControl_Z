# Propuesta del proyecto

# Propuesta de Proyecto — GymControl

## 1. Datos generales

| Campo                       | Respuesta                                                                                |
| :-------------------------- | :--------------------------------------------------------------------------------------- |
| **Nombre de estudiante(s)** | Christopher Guerrero                                                                     |
| **Nombre del proyecto**     | GymControl Z                                                                             |
| **Frase que lo describe**   | Plataforma de gestión de membresías, accesos por QR y reservas de clases para gimnasios. |
| **Fecha de la propuesta**   | 28 de octubre de 2026                                                                    |

---

## 2. El problema

### 2.1 ¿Qué problema resuelve tu proyecto?

Los gimnasios locales independientes de El Salvador llevan el control de pagos y vencimientos de sus socios en cuadernos o tablas de Excel. La recepción pierde tiempo buscando socios manualmente, no hay control exacto de accesos en horas pico, los clientes olvidan su fecha de pago y no existe un canal ágil para reservar cupos en clases colectivas (como spinning o yoga), provocando pérdida de ingresos y aglomeraciones desorganizadas.

### 2.2 ¿Cómo lo resuelven hoy sin tu aplicación?

Anotando pagos a mano en cuadernos de registro, usando listas impresas en recepción, tablas de Excel actualizadas manualmente o gestionando reservas y dudas por mensajes individuales de WhatsApp.

### 2.3 Evidencia

| Persona o negocio consultado         | Lo que dijo                                                                                                                                                                                                                                      |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrenador / Dueño de Gimnasio Local | "Se nos dificulta saber rápidamente quién debe la mensualidad cuando entran muchas personas en horas pico. Además, coordinar los cupos de las clases de spinning por WhatsApp es un caos y los clientes siempre preguntan cuándo vence su plan." |

---

## 3. Los usuarios

### 3.1 Cliente objetivo

Gimnasios independientes, centros de entrenamiento funcional, boxes de crossfit y academias deportivas pequeñas/medianas (de 1 a 5 empleados) en El Salvador.

### 3.2 Roles de la aplicación

| Rol                   | Qué puede hacer                                                                                                                    | ¿Necesita cuenta?            |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- |
| **Dueño / Recepción** | Administra socios, registra pagos/renovaciones, crea y gestiona clases colectivas, publica promociones y analiza ingresos.         | Sí                           |
| **Cliente / Socio**   | Consulta su carnet digital QR, visualiza sus días restantes, reserva cupos en clases colectivas y aprovecha promociones/referidos. | No (Acceso por DUI/ID único) |

---

## 4. La solución

### 4.1 ¿Qué hace tu aplicación?

Ofrece un panel web administrativo donde la recepción verifica la vigencia de los socios y gestiona inscripciones en segundos. A su vez, proporciona un portal móvil para el socio con su carnet digital QR de acceso, un contador visual de días restantes de membresía y un sistema de reserva de cupos para clases colectivas en tiempo real.

### 4.2 ¿Qué la hace diferente?

Elimina por completo el uso de papel y Excel, automatiza la verificación en recepción mediante escaneo o búsqueda rápida, otorga autonomía al cliente para consultar su estado y reservar clases desde su teléfono, y promueve la fidelización mediante promociones y códigos de referidos.

### 4.3 Modelo de ingresos

| Plan                                                                                    | Precio mensual estimado |
| :-------------------------------------------------------------------------------------- | :---------------------- |
| **Plan Básico** (1 Sucursal, hasta 100 socios activos)                                  | $15.00 / mes            |
| **Plan Pro** (Socios ilimitados, múltiples recepcionistas, gestor de clases y reportes) | $30.00 / mes            |

---

## 5. Funcionalidades

### 5.1 Funcionalidades obligatorias

|   #   | Funcionalidad                                                                   | Rol que la usa    | Entrega |
| :---: | :------------------------------------------------------------------------------ | :---------------- | :-----: |
| **1** | Registro del negocio e inicio de sesión seguro (JWT/bcryptjs)                   | Dueño / Recepción |    1    |
| **2** | Registro e inscripción de socios (Nombre, DUI, Teléfono, Plan)                  | Dueño / Recepción |    2    |
| **3** | Verificador Rápido de Acceso por DUI con respuesta visual inmediata             | Dueño / Recepción |    2    |
| **4** | Módulo de renovación acumulativa de membresías y registro de pagos              | Dueño / Recepción |    2    |
| **5** | Gestor de Clases Colectivas (Creación de horarios, asignación de coach y cupos) | Dueño / Recepción |    3    |
| **6** | Portal del Cliente con carnet digital QR y contador visual decreciente de días  | Cliente           |    3    |
| **7** | Sistema de Reserva de Clases en tiempo real con control automático de cupos     | Cliente           |    3    |
| **8** | Módulo de Promociones Globales y Programa de Referidos ("Trae a un amigo")      | Dueño y Cliente   |    3    |

### 5.2 Funcionalidad estrella

**Ecosistema de Acceso Inteligente y Reservas Colectivas:**  
Una solución integrada donde el cliente accede desde su teléfono a su **Carnet Digital con QR dinámico y contador de días restantes**, permitiéndole reservar su cupo en clases colectivas (ej. Spinning) en tiempo real con validación de membresía activa. En la recepción, el sistema ofrece una **pantalla de verificación instantánea por DUI/QR** que muestra alertas de color gigante (Verde: _Acceso Permitido_ / Rojo: _Membresía Vencida_), agilizando el ingreso en horas pico sin cuellos de botella.

### 5.3 Mejoras opcionales

1. Exportación de reportes de ingresos mensuales en formato PDF / Excel.
2. Historial y registro automático de asistencias a las clases colectivas.

### 5.4 Fuera del alcance

|   #   | No incluye                                                                     |
| :---: | :----------------------------------------------------------------------------- |
| **1** | Pasarela de cobros automáticos con tarjeta de crédito/débito en línea real.    |
| **2** | Aplicación móvil nativa en Play Store / App Store (es una Web App responsiva). |
| **3** | Integración por hardware con torniquetes mecánicos o puertas electrónicas.     |

---

## 6. Diseño inicial

|     **Elemento**     |                                          **Elección de diseño**                                          |
| :------------------: | :------------------------------------------------------------------------------------------------------: |
| **Color principal**  |          surface-canvas (#0F131C / slate-950) — Negro obsidiana profundo estilo Dark Technical.          |
| **Color secundario** | primary (#0AFEDF / Electric Cyan) y secondary (#4AE176 / Kinetic Green) para estados e indicadores neón. |
|      **Estilo**      |      Deportivo, moderno, Dark Mode con estética Kinetic Onyx y bordes traslúcidos (glassmorphism).       |
|    **Tipografía**    |       Space Grotesk (para títulos y métricas geométricas) e Inter (para datos de tablas y listas).       |
|   **Logo o ícono**   |            Silueta de pesa/disco con borde brillante neón y check de verificación de acceso.             |

### 6.1 Pantallas

| Pantalla                     | Pública / Protegida  | Qué muestra                                                                   |
| :--------------------------- | :------------------- | :---------------------------------------------------------------------------- |
| **Landing Page**             | Pública              | Presentación del software GymControl, planes y botón de login.                |
| **Login Admin**              | Pública              | Formulario de autenticación para la administración del gimnasio.              |
| **Dashboard Admin**          | Protegida            | Métricas clave, tabla de socios, renovaciones y reporte de ingresos.          |
| **Verificador de Acceso**    | Protegida            | Pantalla limpia para digitar DUI/esccanear QR con banners gigantes de estado. |
| **Gestor de Clases (Admin)** | Protegida            | Formulario para agendar clases, definir coaches y asignar cupos.              |
| **Portal del Socio**         | Pública (por ID/DUI) | Carnet digital QR, días restantes, reserva de clases y promociones.           |

### 6.2 Identidad visual

| Elemento             | Tu elección                                                                   |
| :------------------- | :---------------------------------------------------------------------------- |
| **Color principal**  | `slate-900` / `zinc-900` (Negro/Gris oscuro deportivo - Dark Mode)            |
| **Color secundario** | `emerald-500` / `cyan-500` (Verde neón / Azul eléctrico para estados activos) |
| **Estilo**           | Moderno, sobrio, estilo _Dark Mode_ y alto contraste deportivo.               |
| **Logo o ícono**     | Silueta de disco/pesa combinada con un check de verificación de acceso.       |

---

## 7. Modelo de datos inicial

| Tabla           | Columnas principales                                                                               | Se relaciona con     |
| :-------------- | :------------------------------------------------------------------------------------------------- | :------------------- |
| **negocios**    | `id`, `nombre`, `slug`, `telefono`                                                                 | —                    |
| **usuarios**    | `id`, `negocio_id`, `nombre`, `correo`, `password_hash`, `rol`                                     | `negocios`           |
| **planes**      | `id`, `negocio_id`, `nombre_plan`, `duracion_dias`, `precio`                                       | `negocios`           |
| **socios**      | `id`, `negocio_id`, `plan_id`, `nombre`, `dui`, `telefono`, `fecha_vencimiento`, `codigo_referido` | `negocios`, `planes` |
| **pagos**       | `id`, `negocio_id`, `socio_id`, `plan_id`, `monto`, `fecha_pago`                                   | `negocios`, `socios` |
| **clases**      | `id`, `negocio_id`, `nombre_clase`, `coach`, `fecha_hora`, `cupo_maximo`, `cupos_disponibles`      | `negocios`           |
| **reservas**    | `id`, `clase_id`, `socio_id`, `fecha_reserva`, `asistio`                                           | `clases`, `socios`   |
| **promociones** | `id`, `negocio_id`, `titulo`, `descripcion`, `descuento`, `fecha_fin`, `activa`                    | `negocios`           |

---

## 8. Tecnología

- **Frontend:** React, Vite, React Router, Tailwind CSS, React Hook Form y Zod (Vercel).
- **Backend:** Node.js con Express, JWT y bcryptjs (Render).
- **Base de Datos:** MySQL (Aiven).
- **Librerías adicionales:**
  - `qrcode.react`: Generación de códigos QR en el carnet digital del socio.
  - `lucide-react`: Iconografía moderna para métricas, estados e interfaz.

---

## 9. Plan de entregas

| Entrega            | Qué tendrás funcionando                                                                    | Fecha       |
| :----------------- | :----------------------------------------------------------------------------------------- | :---------- |
| **1. Base**        | Registro del gimnasio, login seguro del administrador y layout principal.                  | Por definir |
| **2. Principal**   | CRUD de socios, asignación de planes y Verificador Rápido por DUI.                         | Por definir |
| **3. Estrella**    | Portal del socio con Carnet QR, reserva de clases en tiempo real, promociones y Dashboard. | Por definir |
| **4. Publicación** | Despliegue en Vercel/Render, BD en producción, README y demostración.                      | Por definir |

---

## 10. Riesgos

| Riesgo                                                    | Qué haré si pasa                                                                                        |
| :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| Se agota la cuota del agente de IA                        | Cambio a mi opción de respaldo; las reglas y la memoria funcionan en cualquier agente.                  |
| Errores al manejar zonas horarias y fechas de vencimiento | Centralizar los cálculos de fechas y cupos mediante helpers puros de JavaScript en el Frontend/Backend. |

---

## 11. Criterios de éxito

1. Un socio escanea su carnet QR o ingresa por su DUI desde el celular, visualiza sus días restantes de membresía y reserva una clase colectiva sin necesidad de crear contraseña.
2. La recepción digita un DUI en el verificador y la pantalla despliega de inmediato un banner gigante "ACCESO PERMITIDO" (Verde) o "MEMBRESÍA VENCIDA" (Rojo).
3. Un administrador puede agendar una clase colectiva (ej. Spinning) definiendo el cupo máximo, y el sistema descuenta los cupos automáticamente conforme los socios reservan.
4. El botón "Renovar" suma los nuevos días a la fecha de vencimiento futura del socio (sin perder días pagados) y registra la transacción en el reporte de ingresos.
5. Si un socio con membresía vencida intenta reservar una clase, el sistema bloquea la acción y emite una alerta solicitando la renovación de su plan.
