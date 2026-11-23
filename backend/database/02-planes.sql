-- ========================================================
-- GymControl Z - Entrega 2: Funcionalidad Principal
-- Script 02: Creación de la tabla de Planes de Membresía (HU-03)
-- ========================================================

CREATE TABLE IF NOT EXISTS planes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  nombre_plan VARCHAR(50) NOT NULL,
  duracion_dias INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);
