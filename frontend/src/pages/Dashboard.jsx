import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Users,
  Clock,
  ShieldAlert,
  CreditCard,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Activity,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Award,
  Zap
} from 'lucide-react';

export default function Dashboard() {
  const { usuario, fetchConToken } = useAuth();
  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');

  const cargarMetricas = async () => {
    setCargando(true);
    setErrorApi('');
    try {
      const res = await fetchConToken('/api/dashboard/metricas');
      if (!res.ok) {
        throw new Error('Error al cargar métricas del negocio');
      }
      const data = await res.json();
      setMetricas(data);
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
  }, []);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-SV', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida Kinetic Onyx */}
      <div className="bg-gradient-to-r from-canvas-card via-canvas-hover to-canvas-card border border-canvas-border rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-full bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panel de Control &bull; Entrega 4</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight">
              Bienvenido, <span className="text-primary">{usuario?.nombre}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visión general del estado financiero, socios y ocupación de <strong className="text-slate-200">{usuario?.nombreGimnasio}</strong>.
            </p>
          </div>

          <button
            onClick={cargarMetricas}
            disabled={cargando}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-canvas border border-canvas-border hover:border-primary text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-primary' : ''}`} />
            <span>Actualizar Métricas</span>
          </button>
        </div>
      </div>

      {errorApi && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-2xl text-danger text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Grid de 5 Tarjetas Numéricas y KPIs Clave (HU-11) */}
      {cargando && !metricas ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Calculando métricas e ingresos...</p>
        </div>
      ) : metricas ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Ingresos del Mes (RN-14) */}
            <div className="bg-canvas-card border-2 border-kinetic/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(74,225,118,0.12)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ingresos del Mes 
                </span>
                <div className="w-8 h-8 rounded-lg bg-kinetic/15 text-kinetic flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <span className="text-3xl font-display font-black text-kinetic tracking-tight">
                  ${Number(metricas.ingresos.totalMes).toFixed(2)}
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                {metricas.ingresos.transaccionesMes} {metricas.ingresos.transaccionesMes === 1 ? 'pago registrado' : 'pagos registrados'}
              </span>
            </div>

            {/* KPI 2: Socios Activos (RN-02) */}
            <div className="bg-canvas-card border-2 border-primary/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(10,254,223,0.12)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Socios Activos
                </span>
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <span className="text-3xl font-display font-black text-primary tracking-tight">
                  {metricas.socios.activos}
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                de {metricas.socios.total} socios registrados
              </span>
            </div>

            {/* KPI 3: Por Vencer (≤ 5 días) (RN-02) */}
            <div className="bg-canvas-card border-2 border-warning/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(251,191,36,0.12)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Por Vencer (≤ 5 días)
                </span>
                <div className="w-8 h-8 rounded-lg bg-warning/15 text-warning flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <span className="text-3xl font-display font-black text-warning tracking-tight">
                  {metricas.socios.porVencer}
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                Oportunidad de renovación
              </span>
            </div>

            {/* KPI 4: Vencidos & Revocados */}
            <div className="bg-canvas-card border-2 border-danger/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(255,74,107,0.12)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Vencidos / Revocados
                </span>
                <div className="w-8 h-8 rounded-lg bg-danger/15 text-danger flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <span className="text-3xl font-display font-black text-danger tracking-tight">
                  {metricas.socios.vencidos + metricas.socios.suspendidos}
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                {metricas.socios.vencidos} vencidos &bull; {metricas.socios.suspendidos} suspendidos
              </span>
            </div>

            {/* KPI 5: Ocupación de Clases (RN-16) */}
            <div className="bg-canvas-card border border-canvas-border hover:border-primary/50 rounded-2xl p-5 flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ocupación Clases 
                </span>
                <div className="w-8 h-8 rounded-lg bg-canvas text-primary flex items-center justify-center border border-canvas-border">
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3">
                <span className="text-3xl font-display font-black text-white tracking-tight">
                  {metricas.clases.porcentajeOcupacion}%
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                {metricas.clases.cuposOcupados} de {metricas.clases.totalCupos} cupos ocupados
              </span>
            </div>
          </div>

          {/* Sección de 2 Columnas: Ingresos Recientes y Próximas Clases */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna 1: Últimas Transacciones e Ingresos Registrados */}
            <div className="bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-canvas-border pb-3">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-kinetic" />
                  <span>Últimos Pagos e Ingresos</span>
                </h3>
                <Link
                  to="/admin/socios"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Ver todos</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {metricas.pagosRecientes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Aún no se han registrado pagos en la base de datos.
                </div>
              ) : (
                <div className="divide-y divide-canvas-border/80">
                  {metricas.pagosRecientes.map((pago) => (
                    <div key={pago.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{pago.nombreSocio}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {pago.nombrePlan} &bull; <span className="font-mono">{pago.dui}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-display font-black text-kinetic block">
                          +${Number(pago.monto).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500">{formatearFecha(pago.fechaPago)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna 2: Próximas Clases Colectivas Agendadas */}
            <div className="bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-canvas-border pb-3">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>Próximas Clases Colectivas</span>
                </h3>
                <Link
                  to="/admin/clases"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Ver agenda</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {metricas.proximasClases.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay clases próximas agendadas para los próximos días.
                </div>
              ) : (
                <div className="divide-y divide-canvas-border/80">
                  {metricas.proximasClases.map((clase) => (
                    <div key={clase.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{clase.nombreClase}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Coach: <strong className="text-slate-300">{clase.coach}</strong> &bull; {formatearFecha(clase.fechaHora)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/30">
                          {clase.cuposDisponibles} cupos libres
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Accesos Rápidos a Módulos Clave */}
      <div>
        <h2 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-kinetic" />
          <span>Acceso Rápido a Operaciones</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/verificador"
            className="group bg-canvas-card border border-canvas-border hover:border-kinetic/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,225,118,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-kinetic/10 border border-kinetic/30 text-kinetic flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-white group-hover:text-kinetic transition-colors">
                Verificador Rápido
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Escanear QR dinámicos o digitar DUI en recepción.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/socios"
            className="group bg-canvas-card border border-canvas-border hover:border-primary/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(10,254,223,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-white group-hover:text-primary transition-colors">
                Gestión de Socios
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inscripciones, renovaciones acumulativas y revocaciones.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/clases"
            className="group bg-canvas-card border border-canvas-border hover:border-primary/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(10,254,223,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-white group-hover:text-primary transition-colors">
                Clases Colectivas
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inscripción presencial en recepción y lista de asistentes.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/promociones"
            className="group bg-canvas-card border border-canvas-border hover:border-kinetic/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,225,118,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-kinetic/10 border border-kinetic/30 text-kinetic flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-sm text-white group-hover:text-kinetic transition-colors">
                Promociones & Referidos
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Publicar ofertas y programa "Trae a un amigo".
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
