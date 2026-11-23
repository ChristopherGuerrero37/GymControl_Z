# Progreso de GymControl Z

## Estado actual
- Entrega en curso: Entrega 3 (Funcionalidad Estrella) y Entrega 4 (Dashboard y Despliegue) FINALIZADAS
- Última actualización: 14 de noviembre de 2026

## Tareas por entrega
### Entrega 1: base
- [x] Repositorios y AGENTS.md
- [x] Base de datos: negocios y usuarios (`01-negocios-usuarios.sql`)
- [x] API: registro, inicio de sesión y perfil (HU-01, HU-02, RN-04)
- [x] Frontend: inicio, registro, login y panel protegido con Layout deportivo Dark Technical
- [ ] Repositorios en GitHub (Pendiente por sincronizar con remoto)

### Entrega 2: funcionalidad principal
- [x] Planes de membresía: tabla (`02-planes.sql`), API, pruebas y pantalla (HU-03)
- [x] Gestión de Socios: tabla (`03-socios.sql`), API, pruebas y pantalla (HU-04)
- [x] Búsqueda y filtros en la lista principal por nombre, DUI y estado
- [x] Prueba de separación por negocio (otro negocio recibe 404 en planes y socios)
- [x] Verificador Rápido de Acceso por DUI con banner neón inmediato (HU-05, RN-02, RN-13)
- [x] Módulo de renovación acumulativa y tabla de pagos (HU-06, RN-03, RN-12, RN-14, `04-pagos.sql`)

### Entrega 3: funcionalidad estrella ⭐
- [x] Scripts SQL de Clases, Reservas, Promociones y Migraciones (`05-clases-reservas.sql`, `06-promociones.sql`, `07-migraciones-alter.sql`)
- [x] Portal del Cliente con Carnet Digital QR dinámico con rotación de 30s (HU-07, RN-17, `/socio/:dui`)
- [x] Revocación instantánea de credenciales con banner de suspensión (RN-18)
- [x] Gestor de Clases Colectivas en Admin con cálculo de ocupación y cupos (HU-08, RN-15, RN-16, `/admin/clases`)
- [x] Inscripción presencial manual a clases desde recepción para clientes sin internet (HU-08B, RN-06, RN-07)
- [x] Reserva de Clases en Tiempo Real por el socio con control atómico de cupos (HU-09, RN-04, RN-06, RN-07)
- [x] Módulo de Promociones y Programa de Referidos con compartir en WhatsApp (HU-10, RN-09, `/admin/promociones`)
- [x] Control de Acceso por Roles (RBAC: dueño, recepción, entrenador — RN-19, HU-12)

### Entrega 4: publicación y presentación
- [x] Dashboard de métricas e ingresos del mes en curso a partir de la tabla pagos (HU-11, RN-14, RN-16)
- [x] Configuración de reescritura para despliegue SPA en Vercel (`frontend/vercel.json`)
- [x] Plantilla de variables de entorno para producción en Render/Aiven (`backend/.env.example`)
- [x] Pruebas REST Client completas (HU-01 a HU-12) en `backend/pruebas.http`
- [ ] Publicación en Vercel, Render y Aiven

## Registro de sesiones
### 03/11/2026 — Sesión 1
- **Hecho**:
  - Estructuración de carpetas separadas `backend/` y `frontend/`.
  - Configuración del backend con Express 5, mysql2/promise, JWT, bcryptjs, Zod y dotenv.
  - Implementación de HU-01 (Registro de gimnasio y administrador con slug y hash de contraseña).
  - Implementación de HU-02 (Inicio/cierre de sesión, JWT seguro con `id, rol, negocio_id`, guardián de rutas).
  - Configuración del frontend con Vite, React (JS), Tailwind CSS (paleta *Dark Technical* con Slate-950, Kinetic Green y Electric Cyan), React Router, React Hook Form y Zod.
  - Creación de scripts SQL en `backend/database/` (01 al 04) para `negocios`, `usuarios`, `planes`, `socios` y `pagos`.
  - Implementación de HU-03 (CRUD de planes con validación Zod y aislamiento por `negocio_id`).
  - Implementación de HU-04 (Inscripción de socios con validación de DUI único RN-01, cálculo de vencimiento inicial RN-11, generación de código de referido y registro en pagos RN-14).
  - Implementación de HU-05 (Verificador rápido de acceso por DUI con banners gigantes neón "ACCESO PERMITIDO" y "MEMBRESÍA VENCIDA", cálculo de días restantes RN-13).
  - Implementación de HU-06 (Renovación acumulativa RN-03/RN-12 sumando días a la fecha futura y registro de transacción en pagos RN-14).
  - Pruebas REST Client completas en `backend/pruebas.http`.

### 14/11/2026 — Sesión 2
- **Hecho**:
  - Modelado SQL y scripts de migración: `05-clases-reservas.sql`, `06-promociones.sql` y `07-migraciones-alter.sql`.
  - Backend API de Clases Colectivas (`/api/clases`): Creación, cupos disponibles (RN-15), ocupación (RN-16), lista de asistentes y check-in de asistencia.
  - Implementación de HU-08B: Endpoint y modal para inscripción presencial en recepción con validación estricta de vigencia (RN-06), control de cupos y no duplicidad (RN-07).
  - Backend API de Promociones (`/api/promociones`): CRUD y toggle de activación con filtro de expiración automática (RN-09).
  - Extensión de Socios: Revocación instantánea (RN-18) mediante `PATCH /api/socios/:id/revocar`, y Verificador adaptado para validar marca de tiempo de QR dinámico (RN-17) con expiración a los 60 segundos.
  - Rutas públicas del socio (`/api/public/socios`): Consulta segura por DUI sin contraseña (RN-05), carnet digital, clases disponibles y reserva atómica en tiempo real (HU-09).
  - Control de Acceso por Roles (RBAC: dueño, recepción, entrenador — RN-19, HU-12) en backend (`autorizarRoles`) y frontend (`Layout.jsx` y `RutaProtegida.jsx`).
  - Frontend Portal del Socio (`/socio/:dui`): Carnet deportivo Kinetic Onyx con QR dinámico (`qrcode.react`), rotación visual a los 30s con cronómetro regresivo, contador de días restantes (RN-13), alerta de revocación (RN-18), reserva de clases y módulo de promociones con compartir en WhatsApp.
  - Frontend Gestor de Clases (`/admin/clases`), Gestor de Promociones (`/admin/promociones`), y actualización de `Socios.jsx` y `VerificadorAcceso.jsx`.
  - Entrega 4: Endpoint `/api/dashboard/metricas` y rediseño completo de `Dashboard.jsx` con 5 KPIs numéricos neón en tiempo real, desglose de ingresos del mes (RN-14), ocupación global (RN-16), lista de pagos recientes y próximas clases.
  - Configuración para despliegue en Vercel (`frontend/vercel.json`) y plantilla de entorno (`backend/.env.example`).
  - Pruebas REST Client ampliadas del test 24 al 45 en `backend/pruebas.http`.

## Decisiones del proyecto
| Fecha | Decisión | Motivo |
| --- | --- | --- |
| 03/11/2026 | Separación estricta de `frontend/` y `backend/` | Modularidad y preparación para despliegues independientes en Vercel y Render. |
| 03/11/2026 | JavaScript puro sin TypeScript | Requisito pedagógico del proyecto para mantener el código simple y fácil de explicar. |
| 03/11/2026 | Cálculo dinámico de estados de socios (RN-02) | Evita inconsistencias en la base de datos derivadas de no ejecutar cronjobs diarios. |
| 03/11/2026 | Transacciones atómicas en renovaciones e inscripciones | Garantiza que no se cree un socio o renovación sin su correspondiente asiento en la tabla de pagos (RN-14). |
| 03/11/2026 | Renovación acumulativa (RN-03 / RN-12) | Garantiza que el cliente no pierda días de membresía si renueva con antelación. |
| 14/11/2026 | QR Dinámico con timestamp embebido y rotación de 30s (RN-17) | Impide que se utilicen capturas de pantalla o fotografías compartidas de carnets digitales. |
| 14/11/2026 | Revocación instantánea en BD y frontend (RN-18) | Permite suspender inmediatamente a un socio problemático sin esperar a que venza su fecha pagada. |
| 14/11/2026 | Transacción atómica en reservas de clases (RN-07, RN-15) | Evita sobrecupos concurrentes al descontar cupos en tiempo real con bloqueo seguro. |
| 14/11/2026 | RBAC estricto de 3 niveles (RN-19, HU-12) | Protege la privacidad financiera del gimnasio aislando métricas solo para el dueño. |
