import { Router } from 'express';
import { pool } from '../db.js';
import { verificarToken, autorizarRoles } from '../middlewares/authMiddleware.js';
import { validarSchema } from '../middlewares/validarSchema.js';
import { promocionSchema } from '../schemas/promocionSchema.js';

const router = Router();

// Todas las rutas administrativas de promociones requieren autenticación (Dueño o Recepción)
router.use(verificarToken, autorizarRoles('dueno', 'recepcion'));

/**
 * GET /api/promociones
 * Lista las promociones del gimnasio (HU-10)
 */
router.get('/', async (req, res) => {
  const negocioId = req.usuario.negocio_id;

  try {
    const [filas] = await pool.query(
      `SELECT id, negocio_id AS negocioId, titulo, descripcion, descuento,
              fecha_fin AS fechaFin, activa, creado_en AS creadoEn
       FROM promociones
       WHERE negocio_id = ?
       ORDER BY id DESC`,
      [negocioId]
    );

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const promocionesConEstado = filas.map((promo) => {
      const fechaFinDate = promo.fechaFin ? new Date(promo.fechaFin) : null;
      if (fechaFinDate) fechaFinDate.setHours(0, 0, 0, 0);

      const expirada = fechaFinDate !== null && fechaFinDate < hoy;

      return {
        id: promo.id,
        negocioId: promo.negocioId,
        titulo: promo.titulo,
        descripcion: promo.descripcion,
        descuento: promo.descuento,
        fechaFin: promo.fechaFin,
        activa: Boolean(promo.activa) && !expirada,
        expirada,
        creadoEn: promo.creadoEn
      };
    });

    return res.status(200).json(promocionesConEstado);
  } catch (error) {
    console.error('Error al listar promociones:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de promociones' });
  }
});

/**
 * POST /api/promociones
 * HU-10: Crear una nueva promoción u oferta global
 */
router.post('/', validarSchema(promocionSchema), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { titulo, descripcion, descuento, fechaFin, activa } = req.body;

  try {
    const fechaFinValor = fechaFin ? fechaFin : null;
    const activaValor = activa !== undefined ? activa : true;

    const [resultado] = await pool.query(
      `INSERT INTO promociones (negocio_id, titulo, descripcion, descuento, fecha_fin, activa)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [negocioId, titulo, descripcion || null, descuento, fechaFinValor, activaValor]
    );

    return res.status(201).json({
      mensaje: 'Promoción creada exitosamente',
      promocion: {
        id: resultado.insertId,
        negocioId,
        titulo,
        descripcion,
        descuento,
        fechaFin: fechaFinValor,
        activa: activaValor
      }
    });
  } catch (error) {
    console.error('Error al crear promoción:', error);
    return res.status(500).json({ error: 'Error interno al crear la promoción' });
  }
});

/**
 * PATCH /api/promociones/:id/toggle
 * Activa o desactiva una promoción
 */
router.patch('/:id/toggle', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [promos] = await pool.query(
      'SELECT id, activa, fecha_fin FROM promociones WHERE id = ? AND negocio_id = ?',
      [id, negocioId]
    );

    if (promos.length === 0) {
      return res.status(404).json({ error: 'Promoción no encontrada en este gimnasio' });
    }

    const promo = promos[0];
    const nuevoEstado = !promo.activa;

    await pool.query(
      'UPDATE promociones SET activa = ? WHERE id = ? AND negocio_id = ?',
      [nuevoEstado, id, negocioId]
    );

    return res.status(200).json({
      mensaje: `Promoción ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
      id: Number(id),
      activa: nuevoEstado
    });
  } catch (error) {
    console.error('Error al alternar estado de promoción:', error);
    return res.status(500).json({ error: 'Error al cambiar estado de la promoción' });
  }
});

/**
 * DELETE /api/promociones/:id
 * Elimina una promoción
 */
router.delete('/:id', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [filas] = await pool.query(
      'SELECT id FROM promociones WHERE id = ? AND negocio_id = ?',
      [id, negocioId]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: 'Promoción no encontrada en este gimnasio' });
    }

    await pool.query('DELETE FROM promociones WHERE id = ? AND negocio_id = ?', [id, negocioId]);

    return res.status(200).json({ mensaje: 'Promoción eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar promoción:', error);
    return res.status(500).json({ error: 'Error al eliminar la promoción' });
  }
});

export default router;
