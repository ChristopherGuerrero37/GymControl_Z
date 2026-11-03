# Progreso de GymControl Z

## Estado actual
- Entrega en curso: Entrega 2 finalizada (Listo para Entrega 3: Funcionalidad Estrella)
- Última actualización: 03 de noviembre de 2026

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
- [ ] Portal del Cliente con Carnet Digital QR (HU-07)
- [ ] Gestor de Clases Colectivas en Admin (HU-08)
- [ ] Reserva de Clases en Tiempo Real por el socio (HU-09)
- [ ] Módulo de Promociones y Referidos (HU-10)

### Entrega 4: publicación y presentación
- [ ] Panel con métricas e ingresos del negocio (HU-11)
- [ ] Página pública / Landing
- [ ] Datos de demostración (Seeders)
- [ ] Publicación en Vercel, Render y Aiven
- [ ] README de los repositorios

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
- **Decisiones**:
  - Toda consulta y mutación valida y filtra por `req.usuario.negocio_id` extraído del token JWT para garantizar aislamiento total multitenant.
  - El estado del socio (`activa`, `por_vencer`, `vencida`) se calcula en tiempo de ejecución (`fechas.js`), respetando la regla RN-02 de nunca almacenarlo como texto estático editable.
  - Se implementó transacción SQL en inscripción y renovación para asegurar que el pago (RN-14) y la membresía se actualicen atómicamente.
- **Problemas encontrados**:
  - Ninguno. La compilación de frontend con Vite y la verificación de sintaxis de backend finalizaron con éxito.
- **Pendiente para la próxima sesión**:
  - Comenzar la Entrega 3 (HU-07 a HU-10): Portal del Cliente móvil por DUI con Carnet QR dinámico, gestor de clases colectivas y reservas en tiempo real.

## Decisiones del proyecto
| Fecha | Decisión | Motivo |
| --- | --- | --- |
| 03/11/2026 | Separación estricta de `frontend/` y `backend/` | Modularidad y preparación para despliegues independientes en Vercel y Render. |
| 03/11/2026 | JavaScript puro sin TypeScript | Requisito pedagógico del proyecto para mantener el código simple y fácil de explicar. |
| 03/11/2026 | Cálculo dinámico de estados de socios (RN-02) | Evita inconsistencias en la base de datos derivadas de no ejecutar cronjobs diarios. |
| 03/11/2026 | Transacciones atómicas en renovaciones e inscripciones | Garantiza que no se cree un socio o renovación sin su correspondiente asiento en la tabla de pagos (RN-14). |
| 03/11/2026 | Renovación acumulativa (RN-03 / RN-12) | Garantiza que el cliente no pierda días de membresía si renueva con antelación. |
