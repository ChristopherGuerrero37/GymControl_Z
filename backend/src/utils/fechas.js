/**
 * Utilidades puras para el cálculo de vigencias, estados y días restantes.
 * Cumplimiento estricto de las reglas de negocio RN-02, RN-03, RN-11, RN-12, RN-13.
 */

/**
 * RN-13: Calcula los días restantes de una membresía.
 * Si es menor a 0, retorna 0 días.
 * @param {string|Date} fechaVencimiento 
 * @returns {number}
 */
export function calcularDiasRestantes(fechaVencimiento) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diferenciaMs = vencimiento.getTime() - hoy.getTime();
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

  return dias > 0 ? dias : 0;
}

/**
 * RN-02 y RN-18: Calcula dinámicamente el estado del socio en base a su fecha_vencimiento y acceso_revocado.
 * - 'suspendida': Si acceso_revocado === true (RN-18).
 * - 'vencida': Si la fecha actual es mayor a fecha_vencimiento (días <= 0).
 * - 'por_vencer': Si faltan 5 días o menos para vencer.
 * - 'activa': Si faltan más de 5 días.
 * @param {string|Date} fechaVencimiento 
 * @param {boolean} [accesoRevocado=false]
 * @returns {'activa' | 'por_vencer' | 'vencida' | 'suspendida'}
 */
export function calcularEstadoSocio(fechaVencimiento, accesoRevocado = false) {
  if (accesoRevocado) {
    return 'suspendida';
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  if (vencimiento < hoy) {
    return 'vencida';
  }

  const dias = calcularDiasRestantes(vencimiento);
  if (dias <= 5) {
    return 'por_vencer';
  }

  return 'activa';
}

/**
 * RN-11: Fecha de vencimiento (Inscripción inicial).
 * fecha_vencimiento = fecha_inicio + duracion_dias
 * @param {string|Date} fechaInicio 
 * @param {number} duracionDias 
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function calcularVencimientoInicial(fechaInicio, duracionDias) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + Number(duracionDias));
  return fecha.toISOString().split('T')[0];
}

/**
 * RN-03 / RN-12: Fecha de vencimiento en renovación acumulativa.
 * Si renueva antes de vencer, se le suman los días a su fecha de vencimiento futura.
 * Si ya estaba vencida, se suman a partir de la fecha de hoy.
 * @param {string|Date} fechaVencimientoActual 
 * @param {number} duracionDias 
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function calcularVencimientoRenovacion(fechaVencimientoActual, duracionDias) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimientoActual);
  vencimiento.setHours(0, 0, 0, 0);

  // Si aún no vence, sumamos a la fecha de vencimiento futura (RN-03, RN-12)
  const base = vencimiento >= hoy ? vencimiento : hoy;
  base.setDate(base.getDate() + Number(duracionDias));

  return base.toISOString().split('T')[0];
}

/**
 * Genera un código de referido único para el socio (ej. 'REF-JUAN-3849')
 * @param {string} nombre 
 * @returns {string}
 */
export function generarCodigoReferido(nombre) {
  const primerNombre = nombre.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'SOCIO';
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `REF-${primerNombre}-${aleatorio}`;
}
