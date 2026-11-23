-- ========================================================
-- GymControl Z - Entrega 3: Funcionalidad Estrella
-- Script 06: Creación de la tabla de Promociones (HU-10)
-- ========================================================

CREATE TABLE IF NOT EXISTS promociones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  descuento VARCHAR(50),
  fecha_fin DATE,
  activa BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_promocion_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);
