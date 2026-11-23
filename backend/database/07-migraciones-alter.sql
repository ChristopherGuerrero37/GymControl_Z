-- ========================================================
-- GymControl Z - Entrega 3: Funcionalidad Estrella
-- Script 07: Migraciones y alteraciones para bases de datos existentes
-- ========================================================

-- RN-18: Asegurar columna de revocación instantánea en socios
ALTER TABLE socios ADD COLUMN acceso_revocado BOOLEAN DEFAULT FALSE;

-- RN-19: Asegurar soporte para rol 'entrenador' en usuarios
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('dueno', 'recepcion', 'entrenador') DEFAULT 'recepcion';
