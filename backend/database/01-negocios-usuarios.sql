-- ========================================================
-- GymControl Z - Entrega 1: Base
-- Script 01: Creación de tablas de Negocios y Usuarios
-- ========================================================

CREATE TABLE IF NOT EXISTS negocios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  negocio_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('dueno', 'recepcion') DEFAULT 'recepcion',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);
