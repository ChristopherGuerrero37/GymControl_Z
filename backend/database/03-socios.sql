-- ========================================================
-- GymControl Z - Entrega 2: Funcionalidad Principal
-- Script 03: Creación de la tabla de Socios (HU-04)
-- ========================================================

CREATE TABLE IF NOT EXISTS socios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  plan_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  dui VARCHAR(10) NOT NULL,
  telefono VARCHAR(20),
  fecha_inicio DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  codigo_referido VARCHAR(20) NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_socio_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  CONSTRAINT fk_socio_plan FOREIGN KEY (plan_id) REFERENCES planes(id),
  -- RN-01: Unicidad del DUI dentro del mismo gimnasio
  CONSTRAINT uq_negocio_dui UNIQUE (negocio_id, dui)
);
