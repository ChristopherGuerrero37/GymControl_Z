-- ========================================================
-- GymControl Z - Entrega 2: Funcionalidad Principal
-- Script 04: Creación de la tabla de Pagos e Ingresos (HU-06, RN-14)
-- ========================================================

CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  socio_id INT NOT NULL,
  plan_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  CONSTRAINT fk_pago_socio FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE,
  CONSTRAINT fk_pago_plan FOREIGN KEY (plan_id) REFERENCES planes(id)
);
