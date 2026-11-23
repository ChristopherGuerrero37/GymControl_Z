import { Router } from 'express';
import { pool } from '../db.js';
import { verificarToken, autorizarRoles } from '../middlewares/authMiddleware.js';
import { validarSchema } from '../middlewares/validarSchema.js';
import { planSchema } from '../schemas/planSchema.js';

const router = Router();

// Todas las rutas de planes requieren autenticación (RN-04)
router.use(verificarToken);

/**
 * GET /api/planes
 * Lista los planes de membresía pertenecientes únicamente al negocio autenticado
 */
router.get('/', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { q } = req.query;

  try {
    let sql = `
      SELECT id, negocio_id AS negocioId, nombre_plan AS nombrePlan,
             duracion_dias AS duracionDias, precio, activo, creado_en AS creadoEn
      FROM planes
      WHERE negocio_id = ?
    `;
    const params = [negocioId];

    if (q) {
      sql += ` AND nombre_plan LIKE ?`;
      params.push(`%${q}%`);
    }

    sql += ` ORDER BY activo DESC, duracion_dias ASC`;

    const [planes] = await pool.query(sql, params);
    return res.status(200).json(planes);
  } catch (error) {
    console.error('Error al listar planes:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de planes' });
  }
});

/**
 * GET /api/planes/:id
 * Obtiene un plan específico, validando pertenencia al negocio (404 si es de otro negocio)
 */
router.get('/:id', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [planes] = await pool.query(
      `SELECT id, negocio_id AS negocioId, nombre_plan AS nombrePlan,
              duracion_dias AS duracionDias, precio, activo, creado_en AS creadoEn
       FROM planes
       WHERE id = ? AND negocio_id = ?`,
      [id, negocioId]
    );

    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan no encontrado o no pertenece a su gimnasio' });
    }

    return res.status(200).json(planes[0]);
  } catch (error) {
    console.error('Error al obtener plan:', error);
    return res.status(500).json({ error: 'Error al consultar el plan' });
  }
});

/**
 * POST /api/planes
 * HU-03: Crear un nuevo plan de membresía para el negocio
 */
router.post('/', autorizarRoles('dueno'), validarSchema(planSchema), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { nombrePlan, duracionDias, precio, activo = true } = req.body;

  try {
    const [resultado] = await pool.query(
      `INSERT INTO planes (negocio_id, nombre_plan, duracion_dias, precio, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [negocioId, nombrePlan, duracionDias, precio, activo]
    );

    return res.status(201).json({
      mensaje: 'Plan creado con éxito',
      plan: {
        id: resultado.insertId,
        negocioId,
        nombrePlan,
        duracionDias,
        precio,
        activo
      }
    });
  } catch (error) {
    console.error('Error al crear plan:', error);
    return res.status(500).json({ error: 'Error al guardar el plan de membresía' });
  }
});

/**
 * PUT /api/planes/:id
 * Actualiza los datos de un plan existente del negocio
 */
router.put('/:id', autorizarRoles('dueno'), validarSchema(planSchema), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;
  const { nombrePlan, duracionDias, precio, activo } = req.body;

  try {
    const [resultado] = await pool.query(
      `UPDATE planes 
       SET nombre_plan = ?, duracion_dias = ?, precio = ?, activo = ?
       WHERE id = ? AND negocio_id = ?`,
      [nombrePlan, duracionDias, precio, activo, id, negocioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan no encontrado o no pertenece a su gimnasio' });
    }

    return res.status(200).json({
      mensaje: 'Plan actualizado con éxito',
      plan: {
        id: Number(id),
        negocioId,
        nombrePlan,
        duracionDias,
        precio,
        activo
      }
    });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    return res.status(500).json({ error: 'Error al actualizar el plan' });
  }
});

/**
 * DELETE /api/planes/:id
 * Elimina o desactiva un plan. Si tiene socios o pagos vinculados, responde 409
 */
router.delete('/:id', autorizarRoles('dueno'), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [resultado] = await pool.query(
      `DELETE FROM planes WHERE id = ? AND negocio_id = ?`,
      [id, negocioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan no encontrado o no pertenece a su gimnasio' });
    }

    return res.status(200).json({ mensaje: 'Plan eliminado correctamente' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        error: 'No se puede eliminar el plan porque ya está asignado a uno o más socios. Puede desactivarlo en su lugar.'
      });
    }
    console.error('Error al eliminar plan:', error);
    return res.status(500).json({ error: 'Error al procesar la eliminación del plan' });
  }
});

export default router;
