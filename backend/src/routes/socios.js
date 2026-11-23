import { Router } from 'express';
import { pool } from '../db.js';
import { verificarToken, autorizarRoles } from '../middlewares/authMiddleware.js';
import { validarSchema } from '../middlewares/validarSchema.js';
import { socioSchema, renovarPlanSchema } from '../schemas/socioSchema.js';
import { 
  calcularDiasRestantes, 
  calcularEstadoSocio, 
  calcularVencimientoInicial, 
  calcularVencimientoRenovacion, 
  generarCodigoReferido 
} from '../utils/fechas.js';

const router = Router();

// Todas las operaciones de socios requieren token JWT válido (RN-04)
router.use(verificarToken);

/**
 * GET /api/socios
 * Lista todos los socios del gimnasio con cálculo dinámico de estado (RN-02) y días (RN-13)
 * Soporta búsqueda ?q= y filtro ?estado=activa|por_vencer|vencida|suspendida
 */
router.get('/', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { q, estado } = req.query;

  try {
    let sql = `
      SELECT s.id, s.negocio_id AS negocioId, s.plan_id AS planId, s.nombre,
             s.dui, s.telefono, s.fecha_inicio AS fechaInicio,
             s.fecha_vencimiento AS fechaVencimiento, s.codigo_referido AS codigoReferido,
             s.acceso_revocado AS accesoRevocado,
             s.creado_en AS creadoEn,
             p.nombre_plan AS nombrePlan, p.precio AS precioPlan
      FROM socios s
      INNER JOIN planes p ON s.plan_id = p.id
      WHERE s.negocio_id = ?
    `;
    const params = [negocioId];

    if (q) {
      sql += ` AND (s.nombre LIKE ? OR s.dui LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY s.id DESC`;

    const [filas] = await pool.query(sql, params);

    // Mapear cada socio con sus cálculos dinámicos y revocación (RN-02, RN-18)
    const sociosConEstado = filas.map(socio => {
      const accesoRevocado = Boolean(socio.accesoRevocado);
      const estadoCalculado = calcularEstadoSocio(socio.fechaVencimiento, accesoRevocado);
      const diasRestantes = calcularDiasRestantes(socio.fechaVencimiento);
      return {
        ...socio,
        accesoRevocado,
        estado: estadoCalculado,
        diasRestantes
      };
    });

    // Filtrar por estado si se especificó en query
    const resultadoFinal = estado
      ? sociosConEstado.filter(s => s.estado === estado)
      : sociosConEstado;

    return res.status(200).json(resultadoFinal);
  } catch (error) {
    console.error('Error al listar socios:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de socios' });
  }
});

/**
 * GET /api/socios/verificar/:dui
 * HU-05: Verificador Rápido de Acceso por DUI con banner inmediato (RN-02, RN-13)
 * RN-17: Validación de QR dinámico (expira a los 60s)
 * RN-18: Revocación instantánea (CREDENCIAL REVOCADA)
 */
router.get('/verificar/:dui', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { dui } = req.params;
  const { t } = req.query; // Timestamp del QR dinámico (RN-17)

  // RN-17: Si se envía timestamp del QR, validar que no tenga más de 60 segundos de antigüedad
  if (t) {
    const timestampQr = Number(t);
    const ahora = Date.now();
    const sesentaSegundosMs = 60 * 1000;

    if (isNaN(timestampQr) || (ahora - timestampQr) > sesentaSegundosMs || timestampQr > (ahora + 10000)) {
      return res.status(400).json({
        accesoPermitido: false,
        qrExpirado: true,
        error: 'CÓDIGO QR EXPIRADO — Por favor regenera o muestra tu carnet actualizado (RN-17)'
      });
    }
  }

  try {
    const [socios] = await pool.query(
      `SELECT s.id, s.nombre, s.dui, s.telefono, s.fecha_vencimiento AS fechaVencimiento,
              s.acceso_revocado AS accesoRevocado,
              p.nombre_plan AS nombrePlan
       FROM socios s
       INNER JOIN planes p ON s.plan_id = p.id
       WHERE s.negocio_id = ? AND s.dui = ?`,
      [negocioId, dui.trim()]
    );

    if (socios.length === 0) {
      return res.status(404).json({
        error: 'Socio no encontrado en este gimnasio',
        accesoPermitido: false
      });
    }

    const socio = socios[0];
    const accesoRevocado = Boolean(socio.accesoRevocado);

    // RN-18: Si el acceso está revocado, bloquear de inmediato sin importar días vigentes
    if (accesoRevocado) {
      return res.status(200).json({
        accesoPermitido: false,
        mensajeBanner: 'CREDENCIAL REVOCADA — Contactar Administración',
        estado: 'suspendida',
        diasRestantes: 0,
        socio: {
          id: socio.id,
          nombre: socio.nombre,
          dui: socio.dui,
          nombrePlan: socio.nombrePlan,
          fechaVencimiento: socio.fechaVencimiento,
          accesoRevocado: true
        }
      });
    }

    const estado = calcularEstadoSocio(socio.fechaVencimiento, false);
    const diasRestantes = calcularDiasRestantes(socio.fechaVencimiento);
    const accesoPermitido = estado === 'activa' || estado === 'por_vencer';

    return res.status(200).json({
      accesoPermitido,
      mensajeBanner: accesoPermitido ? 'ACCESO PERMITIDO' : 'MEMBRESÍA VENCIDA',
      estado,
      diasRestantes,
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        dui: socio.dui,
        nombrePlan: socio.nombrePlan,
        fechaVencimiento: socio.fechaVencimiento,
        accesoRevocado: false
      }
    });
  } catch (error) {
    console.error('Error en verificador de acceso:', error);
    return res.status(500).json({ error: 'Error interno al verificar acceso' });
  }
});

/**
 * GET /api/socios/:id
 * Consulta los detalles de un socio específico por ID
 */
router.get('/:id', async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [socios] = await pool.query(
      `SELECT s.id, s.negocio_id AS negocioId, s.plan_id AS planId, s.nombre,
              s.dui, s.telefono, s.fecha_inicio AS fechaInicio,
              s.fecha_vencimiento AS fechaVencimiento, s.codigo_referido AS codigoReferido,
              s.acceso_revocado AS accesoRevocado,
              p.nombre_plan AS nombrePlan, p.duracion_dias AS duracionDias, p.precio AS precioPlan
       FROM socios s
       INNER JOIN planes p ON s.plan_id = p.id
       WHERE s.id = ? AND s.negocio_id = ?`,
      [id, negocioId]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado o no pertenece a su gimnasio' });
    }

    const socio = socios[0];
    const accesoRevocado = Boolean(socio.accesoRevocado);
    return res.status(200).json({
      ...socio,
      accesoRevocado,
      estado: calcularEstadoSocio(socio.fechaVencimiento, accesoRevocado),
      diasRestantes: calcularDiasRestantes(socio.fechaVencimiento)
    });
  } catch (error) {
    console.error('Error al obtener socio:', error);
    return res.status(500).json({ error: 'Error al consultar el socio' });
  }
});

/**
 * PATCH /api/socios/:id/revocar
 * RN-18: Revocación o reactivación instantánea de credenciales
 * Accesible por Dueño o Recepción
 */
router.patch('/:id/revocar', autorizarRoles('dueno', 'recepcion'), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;

  try {
    const [socios] = await pool.query(
      'SELECT id, nombre, acceso_revocado FROM socios WHERE id = ? AND negocio_id = ?',
      [id, negocioId]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado en este gimnasio' });
    }

    const socio = socios[0];
    const nuevoEstado = !Boolean(socio.acceso_revocado);

    await pool.query(
      'UPDATE socios SET acceso_revocado = ? WHERE id = ? AND negocio_id = ?',
      [nuevoEstado, id, negocioId]
    );

    return res.status(200).json({
      mensaje: `Credencial de acceso ${nuevoEstado ? 'revocada' : 'reactivada'} exitosamente`,
      socioId: socio.id,
      nombre: socio.nombre,
      accesoRevocado: nuevoEstado
    });
  } catch (error) {
    console.error('Error al revocar credencial del socio:', error);
    return res.status(500).json({ error: 'Error al cambiar el estado de la credencial' });
  }
});

/**
 * POST /api/socios
 * HU-04: Inscripción y registro de socios (RN-01, RN-02, RN-11, RN-14)
 */
router.post('/', validarSchema(socioSchema), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { nombre, dui, telefono, planId, fechaInicio } = req.body;
  let connection;

  try {
    // 1. RN-01: Validar si el DUI ya existe en este gimnasio
    const [existentes] = await pool.query(
      'SELECT id FROM socios WHERE negocio_id = ? AND dui = ?',
      [negocioId, dui]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        error: 'Ya existe un socio registrado con este DUI'
      });
    }

    // 2. Validar que el plan exista y pertenezca al negocio
    const [planes] = await pool.query(
      'SELECT id, nombre_plan, duracion_dias, precio FROM planes WHERE id = ? AND negocio_id = ? AND activo = true',
      [planId, negocioId]
    );

    if (planes.length === 0) {
      return res.status(404).json({
        error: 'El plan de membresía seleccionado no existe o está inactivo'
      });
    }

    const plan = planes[0];

    // 3. RN-11: Calcular fecha de vencimiento inicial
    const inicio = fechaInicio || new Date().toISOString().split('T')[0];
    const fechaVencimiento = calcularVencimientoInicial(inicio, plan.duracion_dias);

    // 4. Generar código de referido único
    const codigoReferido = generarCodigoReferido(nombre);

    // 5. Iniciar transacción para registrar socio y pago inicial (RN-14)
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [resultadoSocio] = await connection.query(
      `INSERT INTO socios (negocio_id, plan_id, nombre, dui, telefono, fecha_inicio, fecha_vencimiento, codigo_referido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [negocioId, planId, nombre, dui, telefono || null, inicio, fechaVencimiento, codigoReferido]
    );
    const socioId = resultadoSocio.insertId;

    // Registrar pago inicial en tabla 'pagos' (RN-14)
    await connection.query(
      `INSERT INTO pagos (negocio_id, socio_id, plan_id, monto)
       VALUES (?, ?, ?, ?)`,
      [negocioId, socioId, planId, plan.precio]
    );

    await connection.commit();

    return res.status(201).json({
      mensaje: 'Socio inscrito exitosamente',
      socio: {
        id: socioId,
        negocioId,
        planId,
        nombre,
        dui,
        telefono,
        fechaInicio: inicio,
        fechaVencimiento,
        codigoReferido,
        nombrePlan: plan.nombre_plan,
        estado: calcularEstadoSocio(fechaVencimiento),
        diasRestantes: calcularDiasRestantes(fechaVencimiento)
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un socio registrado con este DUI' });
    }
    console.error('Error al registrar socio:', error);
    return res.status(500).json({ error: 'Error al registrar el socio' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/socios/:id/renovar
 * HU-06: Renovación acumulativa de membresías y registro de pagos (RN-03, RN-12, RN-14)
 */
router.post('/:id/renovar', validarSchema(renovarPlanSchema), async (req, res) => {
  const negocioId = req.usuario.negocio_id;
  const { id } = req.params;
  const { planId } = req.body;
  let connection;

  try {
    // 1. Obtener socio y verificar pertenencia al negocio (404)
    const [socios] = await pool.query(
      'SELECT id, nombre, fecha_vencimiento FROM socios WHERE id = ? AND negocio_id = ?',
      [id, negocioId]
    );

    if (socios.length === 0) {
      return res.status(404).json({ error: 'Socio no encontrado en este gimnasio' });
    }

    const socio = socios[0];

    // 2. Obtener plan seleccionado y verificar que pertenezca al negocio
    const [planes] = await pool.query(
      'SELECT id, nombre_plan, duracion_dias, precio FROM planes WHERE id = ? AND negocio_id = ? AND activo = true',
      [planId, negocioId]
    );

    if (planes.length === 0) {
      return res.status(404).json({ error: 'El plan seleccionado no existe o está inactivo' });
    }

    const plan = planes[0];

    // 3. RN-03 / RN-12: Calcular nueva fecha de vencimiento acumulativa
    const nuevaFechaVencimiento = calcularVencimientoRenovacion(
      socio.fecha_vencimiento,
      plan.duracion_dias
    );

    // 4. Iniciar transacción: registrar pago (RN-14) y actualizar vencimiento del socio
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO pagos (negocio_id, socio_id, plan_id, monto)
       VALUES (?, ?, ?, ?)`,
      [negocioId, socio.id, planId, plan.precio]
    );

    await connection.query(
      `UPDATE socios
       SET plan_id = ?, fecha_vencimiento = ?
       WHERE id = ? AND negocio_id = ?`,
      [planId, nuevaFechaVencimiento, socio.id, negocioId]
    );

    await connection.commit();

    return res.status(200).json({
      mensaje: 'Membresía renovada con éxito',
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        planId,
        nombrePlan: plan.nombre_plan,
        fechaVencimientoAnterior: socio.fecha_vencimiento,
        nuevaFechaVencimiento,
        diasRestantes: calcularDiasRestantes(nuevaFechaVencimiento),
        estado: calcularEstadoSocio(nuevaFechaVencimiento)
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al renovar membresía:', error);
    return res.status(500).json({ error: 'Error al procesar la renovación' });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
