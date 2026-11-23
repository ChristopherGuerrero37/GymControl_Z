import { Router } from 'express';
import { pool } from '../db.js';
import { verificarToken, autorizarRoles } from '../middlewares/authMiddleware.js';
import { calcularDiasRestantes, calcularEstadoSocio } from '../utils/fechas.js';

const router = Router();

// Todas las métricas financieras y globales son exclusivas del dueño (RN-19)
router.use(verificarToken, autorizarRoles('dueno'));

/**
 * GET /api/dashboard/metricas
 * HU-11: Dashboard de métricas e ingresos del negocio
 *  - Total de socios activos, por vencer y vencidos (RN-02)
 *  - Suma de ingresos del mes a partir de tabla pagos (RN-14)
 *  - Porcentaje global de ocupación de clases colectivas (RN-16)
 *  - Transacciones recientes y próximas clases
 */
router.get('/metricas', async (req, res) => {
  const negocioId = req.usuario.negocio_id;

  try {
    // 1. RN-14: Suma total de ingresos del mes actual
    const [pagosMes] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS totalIngresosMes,
              COUNT(id) AS totalTransaccionesMes
       FROM pagos
       WHERE negocio_id = ?
         AND MONTH(fecha_pago) = MONTH(CURRENT_DATE())
         AND YEAR(fecha_pago) = YEAR(CURRENT_DATE())`,
      [negocioId]
    );

    const totalIngresosMes = Number(pagosMes[0].totalIngresosMes);
    const totalTransaccionesMes = Number(pagosMes[0].totalTransaccionesMes);

    // 2. Ingresos del mes anterior para comparativa
    const [pagosMesAnterior] = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS totalIngresosMesAnterior
       FROM pagos
       WHERE negocio_id = ?
         AND fecha_pago >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
         AND fecha_pago < DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')`,
      [negocioId]
    );

    const totalIngresosMesAnterior = Number(pagosMesAnterior[0].totalIngresosMesAnterior);
    const crecimientoIngresos = totalIngresosMesAnterior > 0
      ? Math.round(((totalIngresosMes - totalIngresosMesAnterior) / totalIngresosMesAnterior) * 100)
      : null;

    // 3. RN-02: Conteo dinámico de socios según su fecha de vencimiento y revocación
    const [socios] = await pool.query(
      `SELECT id, fecha_vencimiento AS fechaVencimiento, acceso_revocado AS accesoRevocado
       FROM socios
       WHERE negocio_id = ?`,
      [negocioId]
    );

    let sociosActivos = 0;
    let sociosPorVencer = 0;
    let sociosVencidos = 0;
    let sociosSuspendidos = 0;

    socios.forEach((s) => {
      const accesoRevocado = Boolean(s.accesoRevocado);
      const estado = calcularEstadoSocio(s.fechaVencimiento, accesoRevocado);

      if (estado === 'suspendida') {
        sociosSuspendidos++;
      } else if (estado === 'activa') {
        sociosActivos++;
      } else if (estado === 'por_vencer') {
        sociosPorVencer++;
      } else if (estado === 'vencida') {
        sociosVencidos++;
      }
    });

    const totalSocios = socios.length;

    // 4. RN-16: Porcentaje global de ocupación de clases colectivas
    const [metricasClases] = await pool.query(
      `SELECT COALESCE(SUM(cupo_maximo), 0) AS totalCupos,
              COALESCE(SUM(cupos_disponibles), 0) AS totalDisponibles,
              COUNT(id) AS totalClases
       FROM clases
       WHERE negocio_id = ?`,
      [negocioId]
    );

    const totalCupos = Number(metricasClases[0].totalCupos);
    const totalDisponibles = Number(metricasClases[0].totalDisponibles);
    const totalCuposOcupados = totalCupos - totalDisponibles;
    const porcentajeGlobalOcupacion = totalCupos > 0
      ? Math.round((totalCuposOcupados / totalCupos) * 100)
      : 0;

    // 5. Últimos 5 pagos / transacciones registradas
    const [pagosRecientes] = await pool.query(
      `SELECT p.id, p.monto, p.fecha_pago AS fechaPago,
              s.nombre AS nombreSocio, s.dui,
              pl.nombre_plan AS nombrePlan
       FROM pagos p
       INNER JOIN socios s ON p.socio_id = s.id
       INNER JOIN planes pl ON p.plan_id = pl.id
       WHERE p.negocio_id = ?
       ORDER BY p.id DESC
       LIMIT 5`,
      [negocioId]
    );

    // 6. Próximas clases colectivas agendadas
    const [proximasClases] = await pool.query(
      `SELECT c.id, c.nombre_clase AS nombreClase, c.coach, c.fecha_hora AS fechaHora,
              c.cupo_maximo AS cupoMaximo, c.cupos_disponibles AS cuposDisponibles,
              (SELECT COUNT(*) FROM reservas r WHERE r.clase_id = c.id) AS totalInscritos
       FROM clases c
       WHERE c.negocio_id = ? AND c.fecha_hora >= NOW()
       ORDER BY c.fecha_hora ASC
       LIMIT 4`,
      [negocioId]
    );

    return res.status(200).json({
      ingresos: {
        totalMes: totalIngresosMes,
        transaccionesMes: totalTransaccionesMes,
        totalMesAnterior: totalIngresosMesAnterior,
        crecimientoPorcentaje: crecimientoIngresos
      },
      socios: {
        total: totalSocios,
        activos: sociosActivos,
        porVencer: sociosPorVencer,
        vencidos: sociosVencidos,
        suspendidos: sociosSuspendidos
      },
      clases: {
        totalClases: Number(metricasClases[0].totalClases),
        totalCupos,
        cuposOcupados: totalCuposOcupados,
        cuposDisponibles: totalDisponibles,
        porcentajeOcupacion: Math.min(porcentajeGlobalOcupacion, 100)
      },
      pagosRecientes,
      proximasClases
    });
  } catch (error) {
    console.error('Error al generar métricas del dashboard:', error);
    return res.status(500).json({ error: 'Error al calcular las métricas del dashboard' });
  }
});

export default router;
