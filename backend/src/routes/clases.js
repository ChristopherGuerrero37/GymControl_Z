import { Router } from 'express';
import { pool } from '../db.js';
import { verificarToken, autorizarRoles } from '../middlewares/authMiddleware.js';
import { validarSchema } from '../middlewares/validarSchema.js';
import { 
  claseSchema, 
  inscribirSocioManualSchema, 
  asistenciaSchema 
} from '../schemas/claseSchema.js';
import { calcularEstadoSocio } from '../utils/fechas.js';

const router = Router();

// Todas las rutas de clases colectivas administrativas requieren autenticación JWT
router.use(verificarToken);

/**
 * Helper para formatear fecha a formato MySQL DATETIME 'YYYY-MM-DD HH:MM:SS'
 */
function formatearFechaMySQL(fechaStr) {
  if (!fechaStr) return null;
  const limpia = fechaStr.replace('T', ' ').trim();
  return limpia.length === 16 ? `${limpia}:00` : limpia.slice(0, 19);
}

/**
 * GET /api/clases
 * Lista todas las clases colectivas del gimnasio (HU-08)
 * Calcula en tiempo real los cupos y la ocupación (RN-15, RN-16)
 */
router.get('/', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { rol, nombre } = req.usuario;

  try {
    let sql = `
      SELECT c.id, c.negocio_id AS negocioId, c.nombre_clase AS nombreClase,
             c.coach, c.fecha_hora AS fechaHora, c.cupo_maximo AS cupoMaximo,
             c.cupos_disponibles AS cuposDisponibles, c.creado_en AS creadoEn,
             (SELECT COUNT(*) FROM reservas r WHERE r.clase_id = c.id) AS totalInscritos
      FROM clases c
      WHERE c.negocio_id = ?
    `;
    const params = [negocioId];

    // Si el usuario es entrenador, opcionalmente puede ver preferentemente sus clases
    if (rol === 'entrenador' && req.query.soloMias === 'true') {
      sql += ` AND c.coach LIKE ?`;
      params.push(`%${nombre}%`);
    }

    sql += ` ORDER BY c.fecha_hora ASC`;

    const [filas] = await pool.query(sql, params);

    const clasesConMetricas = filas.map((clase) => {
      const cupoMaximo = Number(clase.cupoMaximo);
      const cuposDisponibles = Number(clase.cuposDisponibles);
      const reservasActivas = Number(clase.totalInscritos);
      // RN-16: Porcentaje de ocupación
      const porcentajeOcupacion = cupoMaximo > 0
        ? Math.round((reservasActivas / cupoMaximo) * 100)
        : 0;

      return {
        id: clase.id,
        negocioId: clase.negocioId,
        nombreClase: clase.nombreClase,
        coach: clase.coach,
        fechaHora: clase.fechaHora,
        cupoMaximo,
        cuposDisponibles,
        totalInscritos: reservasActivas,
        porcentajeOcupacion: Math.min(porcentajeOcupacion, 100),
        agotada: cuposDisponibles <= 0
      };
    });

    return res.status(200).json(clasesConMetricas);
  } catch (error) {
    console.error('Error al listar clases:', error);
    return res.status(500).json({ error: 'Error al obtener las clases colectivas' });
  }
});

/**
 * POST /api/clases
 * HU-08: Agendar una nueva clase colectiva (Solo Dueño o Recepción)
 */
router.post('/', autorizarRoles('dueno', 'recepcion'), validarSchema(claseSchema), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { nombreClase, coach, fechaHora, cupoMaximo } = req.body;

  try {
    const fechaFormateada = formatearFechaMySQL(fechaHora);

    const [resultado] = await pool.query(
      `INSERT INTO clases (negocio_id, nombre_clase, coach, fecha_hora, cupo_maximo, cupos_disponibles)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [negocioId, nombreClase, coach, fechaFormateada, cupoMaximo, cupoMaximo]
    );

    return res.status(201).json({
      mensaje: 'Clase colectiva agendada exitosamente',
      clase: {
        id: resultado.insertId,
        negocioId,
        nombreClase,
        coach,
        fechaHora: fechaFormateada,
        cupoMaximo,
        cuposDisponibles: cupoMaximo,
        totalInscritos: 0,
        porcentajeOcupacion: 0,
        agotada: false
      }
    });
  } catch (error) {
    console.error('Error al crear clase:', error);
    return res.status(500).json({ error: 'Error interno al agendar la clase colectiva' });
  }
});

/**
 * DELETE /api/clases/:id
 * HU-08: Cancelar / eliminar una clase colectiva (Solo Dueño o Recepción)
 */
router.delete('/:id', autorizarRoles('dueno', 'recepcion'), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [filas] = await pool.query(
      'SELECT id FROM clases WHERE id = ? AND negocio_id = ?',
      [id, negocioId]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: 'Clase colectiva no encontrada en este gimnasio' });
    }

    await pool.query('DELETE FROM clases WHERE id = ? AND negocio_id = ?', [id, negocioId]);

    return res.status(200).json({ mensaje: 'Clase colectiva cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar clase:', error);
    return res.status(500).json({ error: 'Error al cancelar la clase' });
  }
});

/**
 * GET /api/clases/:id/asistentes
 * Lista los socios inscritos en una clase colectiva
 * Disponible para dueños, recepcionistas y entrenadores (RN-19)
 */
router.get('/:id/asistentes', autorizarRoles('dueno', 'recepcion', 'entrenador'), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    // 1. Verificar existencia de la clase en el gimnasio
    const [clases] = await pool.query(
      `SELECT id, nombre_clase AS nombreClase, coach, fecha_hora AS fechaHora,
              cupo_maximo AS cupoMaximo, cupos_disponibles AS cuposDisponibles
       FROM clases
       WHERE id = ? AND negocio_id = ?`,
      [id, negocioId]
    );

    if (clases.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada en este gimnasio' });
    }

    const clase = clases[0];

    // 2. Obtener lista de reservas y datos de los socios
    const [asistentes] = await pool.query(
      `SELECT r.id AS reservaId, r.asistio, r.fecha_reserva AS fechaReserva,
              s.id AS socioId, s.nombre AS nombreSocio, s.dui, s.telefono,
              s.fecha_vencimiento AS fechaVencimiento, s.acceso_revocado AS accesoRevocado
       FROM reservas r
       INNER JOIN socios s ON r.socio_id = s.id
       WHERE r.clase_id = ?
       ORDER BY r.fecha_reserva ASC`,
      [id]
    );

    const asistentesConEstado = asistentes.map((asistente) => ({
      ...asistente,
      asistio: Boolean(asistente.asistio),
      accesoRevocado: Boolean(asistente.accesoRevocado),
      estadoMembresia: calcularEstadoSocio(asistente.fechaVencimiento)
    }));

    return res.status(200).json({
      clase: {
        ...clase,
        totalInscritos: asistentesConEstado.length,
        porcentajeOcupacion: Math.round((asistentesConEstado.length / clase.cupoMaximo) * 100)
      },
      asistentes: asistentesConEstado
    });
  } catch (error) {
    console.error('Error al obtener asistentes:', error);
    return res.status(500).json({ error: 'Error al consultar asistentes de la clase' });
  }
});

/**
 * POST /api/clases/:id/inscribir-socio
 * HU-08B: Inscripción presencial manual desde recepción (Dueño o Recepción)
 * Valida:
 *  - RN-06: Membresía activa o por vencer (no vencida)
 *  - RN-07: Cupos disponibles > 0 y sin duplicados
 *  - RN-18: Credencial no revocada
 * Realiza transacción atómica: inserta reserva y descuenta cupo en clases
 */
router.post(
  '/:id/inscribir-socio',
  autorizarRoles('dueno', 'recepcion'),
  validarSchema(inscribirSocioManualSchema),
  async (req, res) => {
    const negocioId = req.usuario.negocio_id;
    const claseId = req.params.id;
    const { socioId } = req.body;
    let connection;

    try {
      // 1. Validar que la clase exista y pertenezca al negocio
      const [clases] = await pool.query(
        `SELECT id, nombre_clase, cupos_disponibles, cupo_maximo 
         FROM clases 
         WHERE id = ? AND negocio_id = ?`,
        [claseId, negocioId]
      );

      if (clases.length === 0) {
        return res.status(404).json({ error: 'Clase colectiva no encontrada' });
      }

      const clase = clases[0];

      // RN-07: Validar cupos disponibles
      if (clase.cupos_disponibles <= 0) {
        return res.status(400).json({
          error: 'No hay cupos disponibles en esta clase colectiva (AGOTADA)'
        });
      }

      // 2. Validar que el socio exista y pertenezca al negocio
      const [socios] = await pool.query(
        `SELECT id, nombre, dui, fecha_vencimiento, acceso_revocado
         FROM socios
         WHERE id = ? AND negocio_id = ?`,
        [socioId, negocioId]
      );

      if (socios.length === 0) {
        return res.status(404).json({ error: 'El socio indicado no existe en este gimnasio' });
      }

      const socio = socios[0];

      // RN-18: Validar revocación instantánea
      if (socio.acceso_revocado) {
        return res.status(403).json({
          error: 'Credencial revocada: El socio tiene el acceso suspendido y no puede inscribirse'
        });
      }

      // RN-06: Validar estado de membresía (activa o por_vencer)
      const estadoMembresia = calcularEstadoSocio(socio.fecha_vencimiento);
      if (estadoMembresia === 'vencida') {
        return res.status(400).json({
          error: 'Membresía vencida. El socio debe renovar su plan para inscribirse a clases colectivas (RN-06)'
        });
      }

      // RN-04 / RN-07: Validar que el socio no esté ya inscrito en esta clase
      const [reservasExistentes] = await pool.query(
        `SELECT id FROM reservas WHERE clase_id = ? AND socio_id = ?`,
        [claseId, socioId]
      );

      if (reservasExistentes.length > 0) {
        return res.status(409).json({
          error: 'El socio ya se encuentra inscrito en esta clase colectiva'
        });
      }

      // 3. Transacción atómica: Insertar reserva y decrementar cupo disponible
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [reservaResult] = await connection.query(
        `INSERT INTO reservas (clase_id, socio_id, asistio) VALUES (?, ?, false)`,
        [claseId, socioId]
      );

      await connection.query(
        `UPDATE clases
         SET cupos_disponibles = cupos_disponibles - 1
         WHERE id = ? AND cupos_disponibles > 0`,
        [claseId]
      );

      await connection.commit();

      return res.status(201).json({
        mensaje: `Socio ${socio.nombre} inscrito exitosamente en ${clase.nombre_clase}`,
        reserva: {
          id: reservaResult.insertId,
          claseId: Number(claseId),
          socioId,
          nombreSocio: socio.nombre,
          cuposDisponibles: clase.cupos_disponibles - 1
        }
      });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El socio ya está inscrito en esta clase' });
      }
      console.error('Error al inscribir socio en clase:', error);
      return res.status(500).json({ error: 'Error interno al inscribir al socio en la clase' });
    } finally {
      if (connection) connection.release();
    }
  }
);

/**
 * PATCH /api/clases/:id/reservas/:reservaId/asistencia
 * Marca check-in de asistencia a la clase (asistio: true/false)
 * Accesible por Dueño, Recepción y Entrenador
 */
router.patch(
  '/:id/reservas/:reservaId/asistencia',
  autorizarRoles('dueno', 'recepcion', 'entrenador'),
  validarSchema(asistenciaSchema),
  async (req, res) => {
    const negocioId = req.usuario.negocio_id;
    const { id: claseId, reservaId } = req.params;
    const { asistio } = req.body;

    try {
      // Validar que la clase pertenezca al negocio
      const [clases] = await pool.query(
        'SELECT id FROM clases WHERE id = ? AND negocio_id = ?',
        [claseId, negocioId]
      );

      if (clases.length === 0) {
        return res.status(404).json({ error: 'Clase no encontrada en este gimnasio' });
      }

      // Validar que la reserva pertenezca a la clase
      const [reservas] = await pool.query(
        'SELECT id FROM reservas WHERE id = ? AND clase_id = ?',
        [reservaId, claseId]
      );

      if (reservas.length === 0) {
        return res.status(404).json({ error: 'Reserva no encontrada para esta clase' });
      }

      await pool.query(
        'UPDATE reservas SET asistio = ? WHERE id = ?',
        [asistio, reservaId]
      );

      return res.status(200).json({
        mensaje: `Asistencia ${asistio ? 'confirmada' : 'anulada'} exitosamente`,
        reservaId: Number(reservaId),
        asistio
      });
    } catch (error) {
      console.error('Error al actualizar asistencia:', error);
      return res.status(500).json({ error: 'Error al registrar asistencia' });
    }
  }
);

export default router;
