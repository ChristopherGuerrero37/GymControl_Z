-- ========================================================
-- GymControl Z - Entrega 3: Funcionalidad Estrella
-- Script 05: Creación de tablas de Clases Colectivas y Reservas (HU-08, HU-09)
-- ========================================================

CREATE TABLE IF NOT EXISTS clases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  nombre_clase VARCHAR(100) NOT NULL,
  coach VARCHAR(100) NOT NULL,
  fecha_hora DATETIME NOT NULL,
  cupo_maximo INT NOT NULL,
  cupos_disponibles INT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clase_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clase_id INT NOT NULL,
  socio_id INT NOT NULL,
  fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
  asistio BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reserva_clase FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE CASCADE,
  CONSTRAINT fk_reserva_socio FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE,
  -- RN-04 / RN-07: Un socio no puede reservar la misma clase dos veces
  CONSTRAINT uq_reserva_clase_socio UNIQUE (clase_id, socio_id)
);
