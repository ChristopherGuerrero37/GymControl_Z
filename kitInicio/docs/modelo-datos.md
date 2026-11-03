# Modelo de datos de GymControl Z

Tablas, columnas y relaciones acordadas. El agente debe respetar este modelo; si necesita cambiarlo, lo propone y espera aprobación.

## Reglas del modelo

- Toda tabla tiene `id INT AUTO_INCREMENT PRIMARY KEY` y `creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
- Toda tabla con datos de un negocio tiene `negocio_id INT NOT NULL` con llave foránea hacia `negocios(id)` (RN-01).
- Nombres de tablas y columnas en español y en snake_case.
- Dinero en `DECIMAL(10,2)`; fechas en `DATE`; horas en `TIME`; fecha y hora en `DATETIME`.

## Tablas

# Modelo de Datos Inicial — GymControl

Todas las tablas del sistema incluyen `negocio_id` para garantizar la arquitectura multitenant (aislamiento por gimnasio).

---

## Esquema de Tablas (MySQL)

### 1. `negocios`

Almacena la información de cada gimnasio suscrito al sistema.

- `id` (VARCHAR/UUID, PK)
- `nombre` (VARCHAR(100), NOT NULL)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- `telefono` (VARCHAR(20))
- `created_at` (TIMESTAMP)

### 2. `usuarios`

Cuentas de acceso para administradores y recepcionistas.

- `id` (VARCHAR/UUID, PK)
- `negocio_id` (VARCHAR/UUID, FK -> negocios.id)
- `nombre` (VARCHAR(100), NOT NULL)
- `correo` (VARCHAR(100), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `rol` (ENUM('dueno', 'recepcion'), DEFAULT 'recepcion')
- `created_at` (TIMESTAMP)

### 3. `planes`

Tipos de membresía ofrecidos por el gimnasio.

- `id` (VARCHAR/UUID, PK)
- `negocio_id` (VARCHAR/UUID, FK -> negocios.id)
- `nombre_plan` (VARCHAR(50), NOT NULL) -- ej: Mensual, Trimestral, Pase Diario
- `duracion_dias` (INT, NOT NULL) -- ej: 30, 90, 365
- `precio` (DECIMAL(10,2), NOT NULL)
- `activo` (BOOLEAN, DEFAULT true)

### 4. `socios`

Registro de los clientes/socios del gimnasio.

- `id` (VARCHAR/UUID, PK)
- `negocio_id` (VARCHAR/UUID, FK -> negocios.id)
- `plan_id` (VARCHAR/UUID, FK -> planes.id)
- `nombre` (VARCHAR(100), NOT NULL)
- `dui` (VARCHAR(10), NOT NULL) -- Formato 00000000-0
- `telefono` (VARCHAR(20))
- `fecha_inicio` (DATE, NOT NULL)
- `fecha_vencimiento` (DATE, NOT NULL)
- `codigo_referido` (VARCHAR(20), UNIQUE)
- `created_at` (TIMESTAMP)

### 5. `pagos`

Historial de transacciones e ingresos generados.

- `id` (VARCHAR/UUID, PK)
- `negocio_id` (VARCHAR/UUID, FK -> negocios.id)
- `socio_id` (VARCHAR/UUID, FK -> socios.id)
- `plan_id` (VARCHAR/UUID, FK -> planes.id)
- `monto` (DECIMAL(10,2), NOT NULL)
- `fecha_pago` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### 6. `clases`

Clases colectivas organizadas por el gimnasio (Spinning, Coach, etc.).

- `id` (VARCHAR/UUID, PK)
- `negocio_id` (VARCHAR/UUID, FK -> negocios.id)
- `nombre_clase` (VARCHAR(100), NOT NULL)
- `coach` (VARCHAR(100), NOT NULL)
- `fecha_hora` (DATETIME, NOT NULL)
- `cupo_maximo` (INT, NOT NULL)
- `cupos_disponibles` (INT, NOT NULL)

### 7. `reservas`

Cupos reservados por los socios en las clases colectivas.

- `id` (VARCHAR/UUID, PK)
- `clase_id` (VARCHAR/UUID, FK -> clases.id)
- `socio_id` (VARCHAR/UUID, FK -> socios.id)
- `fecha_reserva` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- `asistio` (BOOLEAN, DEFAULT false)

### 8. `promociones`

Anuncios globales y ofertas publicadas por la administración.

- `id` (VARCHAR/UUID, PK)
- `negocio_id` (VARCHAR/UUID, FK -> negocios.id)
- `titulo` (VARCHAR(100), NOT NULL)
- `descripcion` (TEXT)
- `descuento` (VARCHAR(50)) -- ej: '20% en renovación'
- `fecha_fin` (DATE)
- `activa` (BOOLEAN, DEFAULT true)

---

## Relaciones Principales

- Un **negocio** tiene múltiples **usuarios**, **planes**, **socios**, **clases** y **promociones**.
- Un **socio** pertenece a un **plan** y puede registrar múltiples **pagos** y **reservas**.
- Una **clase** puede tener múltiples **reservas** hasta agotar `cupos_disponibles`.
