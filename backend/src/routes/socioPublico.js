import { Router } from 'express';
import { pool } from '../db.js';
import { z } from 'zod';
import { validarSchema } from '../middlewares/validarSchema.js';
import { calcularDiasRestantes, calcularEstadoSocio } from '../utils/fechas.js';

const router = Router();

const reservarSchema = z.object({
  claseId: z
    .number({ required_error: 'El identificador de la clase es obligatorio' })
    .int()
    .positive('ID de clase inválido')
});

/**
 * GET /api/public/socios/:dui
 * HU-07: Consulta pública y segura del socio para visualización del Carnet Digital QR
 * Acceso directo sin contraseña (RN-05)
 */
router.get('/:dui', async (req, res) => {
  const { dui } = req.params;

  try {
    const [socios] = await pool.query(
      `SELECT s.id, s.nombre, s.dui, s.telefono, s.fecha_inicio AS fechaInicio,
              s.fecha_vencimiento AS fechaVencimiento, s.codigo_referido AS codigoReferido,
              s.acceso_revocado AS accesoRevocado, s.negocio_id AS negocioId,
              p.nombre_plan AS nombrePlan,
              n.nombre AS nombreGimnasio, n.telefono AS telefonoGimnasio
       FROM socios s
       INNER JOIN planes p ON s.plan_id = p.id
       INNER JOIN negocios n ON s.negocio_id = n.id
       WHERE s.dui = ?`,
      [dui.trim()]
    );

    if (socios.length === 0) {
      return res.status(404).json({
        error: 'No se encontró ningún carnet registrado con este número de DUI'
      });
    }

    const socio = socios[0];
    const accesoRevocado = Boolean(socio.accesoRevocado);
    const estado = calcularEstadoSocio(socio.fechaVencimiento, accesoRevocado);
    const diasRestantes = calcularDiasRestantes(socio.fechaVencimiento);

    return res.status(200).json({
      id: socio.id,
      nombre: socio.nombre,
      dui: socio.dui,
      telefono: socio.telefono,
      nombrePlan: socio.nombrePlan,
      fechaInicio: socio.fechaInicio,
      fechaVencimiento: socio.fechaVencimiento,
      diasRestantes,
      estado,
      accesoRevocado,
      codigoReferido: socio.codigoReferido,
      gimnasio: {
        nombre: socio.nombreGimnasio,
        telefono: socio.telefonoGimnasio
      }
    });
  } catch (error) {
    console.error('Error al consultar carnet del socio:', error);
    return res.status(500).json({ error: 'Error al consultar el carnet digital' });
  }
});

/**
 * GET /api/public/socios/:dui/clases
 * HU-09: Lista las clases disponibles para el socio con indicador de si ya reservó
 */
router.get('/:dui/clases', async (req, res) => {
  const { dui } = req.params;

  try {
    // 1. Obtener socio y su negocio
    const [socios] = await pool.query(
      'SELECT id, negocio_id FROM socios WHERE dui = ?',
      [dui.trim()]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const socio = socios[0];

    // 2. Obtener clases del negocio con fecha futura o actual
    const [clases] = await pool.query(
      `SELECT c.id, c.nombre_clase AS nombreClase, c.coach, c.fecha_hora AS fechaHora,
              c.cupo_maximo AS cupoMaximo, c.cupos_disponibles AS cuposDisponibles,
              r.id AS miReservaId
       FROM clases c
       LEFT JOIN reservas r ON r.clase_id = c.id AND r.socio_id = ?
       WHERE c.negocio_id = ?
       ORDER BY c.fecha_hora ASC`,
      [socio.id, socio.negocio_id]
    );

    const clasesFormateadas = clases.map((clase) => ({
      id: clase.id,
      nombreClase: clase.nombreClase,
      coach: clase.coach,
      fechaHora: clase.fechaHora,
      cupoMaximo: clase.cupoMaximo,
      cuposDisponibles: clase.cuposDisponibles,
      agotada: clase.cuposDisponibles <= 0,
      yaReservada: Boolean(clase.miReservaId),
      reservaId: clase.miReservaId || null
    }));

    return res.status(200).json(clasesFormateadas);
  } catch (error) {
    console.error('Error al consultar clases del socio:', error);
    return res.status(500).json({ error: 'Error al obtener clases colectivas' });
  }
});

/**
 * POST /api/public/socios/:dui/reservar
 * HU-09: Reserva de cupo en clase colectiva en tiempo real por el socio
 * Valida:
 *  - RN-06: Membresía activa o por vencer (no vencida)
 *  - RN-07: Cupos disponibles > 0 y sin duplicados
 *  - RN-18: Credencial no revocada
 */
router.post('/:dui/reservar', validarSchema(reservarSchema), async (req, res) => {
  const { dui } = req.params;
  const { claseId } = req.body;
  let connection;

  try {
    // 1. Obtener y validar al socio
    const [socios] = await pool.query(
      `SELECT id, nombre, dui, fecha_vencimiento, acceso_revocado, negocio_id
       FROM socios
       WHERE dui = ?`,
      [dui.trim()]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const socio = socios[0];

    // RN-18: Validar revocación instantánea
    if (socio.acceso_revocado) {
      return res.status(403).json({
        error: 'Credencial revocada: Tu acceso se encuentra suspendido. Contacta a administración'
      });
    }

    // RN-06: Validar estado de membresía
    const estado = calcularEstadoSocio(socio.fecha_vencimiento, false);
    if (estado === 'vencida') {
      return res.status(400).json({
        error: 'Membresía vencida. Renueva tu plan para reservar clases colectivas (RN-06)'
      });
    }

    // 2. Validar que la clase exista y pertenezca al mismo gimnasio
    const [clases] = await pool.query(
      `SELECT id, nombre_clase, cupos_disponibles 
       FROM clases 
       WHERE id = ? AND negocio_id = ?`,
      [claseId, socio.negocio_id]
    );

    if (clases.length === 0) {
      return res.status(404).json({ error: 'Clase colectiva no encontrada' });
    }

    const clase = clases[0];

    // RN-07: Validar disponibilidad de cupos
    if (clase.cupos_disponibles <= 0) {
      return res.status(400).json({
        error: 'Esta clase ya no cuenta con cupos disponibles (AGOTADA)'
      });
    }

    // RN-04 / RN-07: Validar que no haya reservado previamente
    const [reservasPrevias] = await pool.query(
      'SELECT id FROM reservas WHERE clase_id = ? AND socio_id = ?',
      [claseId, socio.id]
    );

    if (reservasPrevias.length > 0) {
      return res.status(409).json({
        error: 'Ya tienes un cupo confirmado en esta clase'
      });
    }

    // 3. Transacción atómica de reserva y decremento de cupos (RN-07, RN-15)
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [reservaResult] = await connection.query(
      'INSERT INTO reservas (clase_id, socio_id, asistio) VALUES (?, ?, false)',
      [claseId, socio.id]
    );

    await connection.query(
      `UPDATE clases 
       SET cupos_disponibles = cupos_disponibles - 1 
       WHERE id = ? AND cupos_disponibles > 0`,
      [claseId]
    );

    await connection.commit();

    return res.status(201).json({
      mensaje: `¡Cupo confirmado para ${clase.nombre_clase}!`,
      reserva: {
        id: reservaResult.insertId,
        claseId,
        socioId: socio.id,
        nombreSocio: socio.nombre
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya tienes un cupo confirmado en esta clase' });
    }
    console.error('Error al reservar clase para socio:', error);
    return res.status(500).json({ error: 'Error interno al procesar la reserva' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * DELETE /api/public/socios/:dui/reservas/:reservaId
 * Permite al socio cancelar su reserva y liberar el cupo en tiempo real
 */
router.delete('/:dui/reservas/:reservaId', async (req, res) => {
  const { dui, reservaId } = req.params;
  let connection;

  try {
    const [socios] = await pool.query(
      'SELECT id, negocio_id FROM socios WHERE dui = ?',
      [dui.trim()]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const socio = socios[0];

    const [reservas] = await pool.query(
      `SELECT r.id, r.clase_id AS claseId 
       FROM reservas r
       INNER JOIN clases c ON r.clase_id = c.id
       WHERE r.id = ? AND r.socio_id = ? AND c.negocio_id = ?`,
      [reservaId, socio.id, socio.negocio_id]
    );

    if (reservas.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no pertenece a este socio' });
    }

    const reserva = reservas[0];

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM reservas WHERE id = ?', [reservaId]);
    await connection.query(
      'UPDATE clases SET cupos_disponibles = cupos_disponibles + 1 WHERE id = ?',
      [reserva.claseId]
    );

    await connection.commit();

    return res.status(200).json({ mensaje: 'Reserva cancelada exitosamente y cupo liberado' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al cancelar reserva:', error);
    return res.status(500).json({ error: 'Error al cancelar la reserva' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/public/socios/:dui/promociones
 * HU-10: Lista promociones activas y no vencidas (RN-09) para el portal del socio
 */
router.get('/:dui/promociones', async (req, res) => {
  const { dui } = req.params;

  try {
    const [socios] = await pool.query(
      'SELECT negocio_id FROM socios WHERE dui = ?',
      [dui.trim()]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const negocioId = socios[0].negocio_id;

    // RN-09: Solo promociones activas cuya fecha_fin no haya vencido
    const [promociones] = await pool.query(
      `SELECT id, titulo, descripcion, descuento, fecha_fin AS fechaFin
       FROM promociones
       WHERE negocio_id = ? AND activa = true 
         AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
       ORDER BY id DESC`,
      [negocioId]
    );

    return res.status(200).json(promociones);
  } catch (error) {
    console.error('Error al obtener promociones para el socio:', error);
    return res.status(500).json({ error: 'Error al obtener las promociones' });
  }
});

export default router;
