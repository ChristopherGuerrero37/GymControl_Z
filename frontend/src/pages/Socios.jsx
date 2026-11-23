import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import ModalRenovacion from '../components/ModalRenovacion';
import { 
  Users, 
  UserPlus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  CreditCard, 
  Phone, 
  Hash, 
  Calendar,
  Share2,
  ShieldAlert,
  ShieldCheck,
  QrCode,
  ExternalLink
} from 'lucide-react';

const socioFormSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  dui: z.string().regex(/^\d{8}-\d{1}$/, 'El DUI debe tener el formato 00000000-0'),
  telefono: z.string().optional().or(z.literal('')),
  planId: z.coerce.number().positive('Selecciona un plan de membresía'),
  fechaInicio: z.string().optional()
});

export default function Socios() {
  const { fetchConToken } = useAuth();
  const [socios, setSocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalInscripcionAbierto, setModalInscripcionAbierto] = useState(false);
  const [socioParaRenovar, setSocioParaRenovar] = useState(null);
  const [errorApi, setErrorApi] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(socioFormSchema),
    defaultValues: {
      nombre: '',
      dui: '',
      telefono: '',
      planId: '',
      fechaInicio: new Date().toISOString().split('T')[0]
    }
  });

  const cargarDatos = async () => {
    setCargando(true);
    setErrorApi('');
    try {
      // 1. Cargar lista de socios con filtros
      let url = '/api/socios';
      const params = new URLSearchParams();
      if (busqueda) params.append('q', busqueda);
      if (filtroEstado) params.append('estado', filtroEstado);
      if (params.toString()) url += `?${params.toString()}`;

      const resSocios = await fetchConToken(url);
      if (!resSocios.ok) throw new Error('Error al cargar socios');
      const dataSocios = await resSocios.json();
      setSocios(dataSocios);

      // 2. Cargar planes activos para el selector de inscripción
      const resPlanes = await fetchConToken('/api/planes');
      if (resPlanes.ok) {
        const dataPlanes = await resPlanes.json();
        setPlanes(dataPlanes.filter(p => p.activo));
      }
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [busqueda, filtroEstado]);

  const abrirModalInscripcion = () => {
    reset({
      nombre: '',
      dui: '',
      telefono: '',
      planId: planes.length > 0 ? planes[0].id : '',
      fechaInicio: new Date().toISOString().split('T')[0]
    });
    setModalInscripcionAbierto(true);
  };

  const onSubmitInscripcion = async (datos) => {
    setGuardando(true);
    setErrorApi('');
    try {
      const res = await fetchConToken('/api/socios', {
        method: 'POST',
        body: JSON.stringify(datos)
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Error al inscribir al socio');
      }

      setMensajeExito(`¡Socio ${datos.nombre} inscrito exitosamente! Vence el ${resData.socio?.fechaVencimiento}`);
      setTimeout(() => setMensajeExito(''), 6000);
      setModalInscripcionAbierto(false);
      cargarDatos();
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleRevocar = async (socioId, nombre, estadoActual) => {
    const accion = estadoActual ? 'reactivar' : 'revocar';
    if (!window.confirm(`¿Estás seguro de ${accion} el acceso de ${nombre}? (RN-18)`)) {
      return;
    }

    try {
      const res = await fetchConToken(`/api/socios/${socioId}/revocar`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar credencial');

      setMensajeExito(data.mensaje);
      setTimeout(() => setMensajeExito(''), 5000);
      cargarDatos();
    } catch (err) {
      setErrorApi(err.message);
    }
  };

  const getBadgeEstado = (estado, diasRestantes, accesoRevocado) => {
    if (accesoRevocado || estado === 'suspendida') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger/20 text-danger border border-danger/40">
          <ShieldAlert className="w-3 h-3" />
          <span>Revocada (RN-18)</span>
        </span>
      );
    }

    switch (estado) {
      case 'activa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-kinetic/10 text-kinetic border border-kinetic/30">
            <span className="w-1.5 h-1.5 rounded-full bg-kinetic animate-pulse"></span>
            <span>Activa ({diasRestantes} días)</span>
          </span>
        );
      case 'por_vencer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/30">
            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
            <span>Por Vencer ({diasRestantes} días)</span>
          </span>
        );
      case 'vencida':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/30">
            <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
            <span>Vencida</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Botón Nuevo Socio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Gestión de Socios</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inscripciones, control de membresías y renovaciones acumulativas.
          </p>
        </div>

        <button
          onClick={abrirModalInscripcion}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-semibold text-sm hover:bg-primary-dark transition shadow-[0_0_15px_rgba(10,254,223,0.2)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Inscribir Socio</span>
        </button>
      </div>

      {/* Banner de Éxito */}
      {mensajeExito && (
        <div className="p-3.5 bg-kinetic/10 border border-kinetic/30 rounded-xl flex items-center gap-3 text-kinetic text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar socio por nombre o DUI..."
            className="w-full bg-canvas-card border border-canvas-border focus:border-primary rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Botones de Filtro por Estado (RN-02) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFiltroEstado('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filtroEstado === ''
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-canvas-card text-slate-400 hover:text-white border border-canvas-border'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('activa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filtroEstado === 'activa'
                ? 'bg-kinetic/20 text-kinetic border border-kinetic/40 font-semibold'
                : 'bg-canvas-card text-slate-400 hover:text-white border border-canvas-border'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFiltroEstado('por_vencer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filtroEstado === 'por_vencer'
                ? 'bg-warning/20 text-warning border border-warning/40 font-semibold'
                : 'bg-canvas-card text-slate-400 hover:text-white border border-canvas-border'
            }`}
          >
            Por Vencer (≤ 5 días)
          </button>
          <button
            onClick={() => setFiltroEstado('vencida')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filtroEstado === 'vencida'
                ? 'bg-danger/20 text-danger border border-danger/40 font-semibold'
                : 'bg-canvas-card text-slate-400 hover:text-white border border-canvas-border'
            }`}
          >
            Vencidas
          </button>
        </div>
      </div>

      {/* Error de API si existe */}
      {errorApi && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Estados de Carga y Tabla */}
      {cargando ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Cargando socios...</p>
        </div>
      ) : socios.length === 0 ? (
        <div className="py-16 text-center bg-canvas-card border border-canvas-border rounded-2xl p-8">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No se encontraron socios</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {busqueda || filtroEstado
              ? 'No hay socios con los criterios de búsqueda o filtro seleccionados.'
              : 'Aún no tienes socios registrados. Haz clic en "Inscribir Socio" para comenzar.'}
          </p>
        </div>
      ) : (
        <div className="bg-canvas-card border border-canvas-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-canvas text-xs uppercase tracking-wider text-slate-400 border-b border-canvas-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">Socio</th>
                  <th className="px-5 py-3 font-semibold">DUI / Contacto</th>
                  <th className="px-5 py-3 font-semibold">Plan Actual</th>
                  <th className="px-5 py-3 font-semibold">Estado y Vencimiento</th>
                  <th className="px-5 py-3 font-semibold">Código Referido</th>
                  <th className="px-5 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border">
                {socios.map((socio) => (
                  <tr key={socio.id} className="hover:bg-canvas-hover/50 transition-colors">
                    {/* Nombre */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{socio.nombre}</div>
                    </td>

                    {/* DUI y Teléfono */}
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-xs text-slate-300">{socio.dui}</div>
                      {socio.telefono && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{socio.telefono}</span>
                        </div>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-slate-200 block">
                        {socio.nombrePlan}
                      </span>
                    </td>

                    {/* Estado dinámico RN-02 y fecha */}
                    <td className="px-5 py-3.5">
                      {getBadgeEstado(socio.estado, socio.diasRestantes, socio.accesoRevocado)}
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Vence: {socio.fechaVencimiento?.split('T')[0] || socio.fechaVencimiento}</span>
                      </div>
                    </td>

                    {/* Código Referido */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-canvas px-2 py-1 rounded border border-canvas-border text-primary font-semibold">
                        {socio.codigoReferido}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Enlace al Carnet Digital QR (HU-07) */}
                        <a
                          href={`/socio/${socio.dui}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-canvas hover:bg-canvas-hover border border-canvas-border text-slate-300 hover:text-primary transition"
                          title="Abrir Carnet Digital QR del socio"
                        >
                          <QrCode className="w-3.5 h-3.5 text-primary" />
                          <span>QR</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                        </a>

                        {/* Botón Renovar (HU-06) */}
                        <button
                          onClick={() => setSocioParaRenovar(socio)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-kinetic/10 border border-kinetic/30 text-kinetic hover:bg-kinetic/20 transition shadow-[0_0_10px_rgba(74,225,118,0.1)]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Renovar</span>
                        </button>

                        {/* Botón Revocar / Reactivar (RN-18) */}
                        <button
                          onClick={() => handleToggleRevocar(socio.id, socio.nombre, socio.accesoRevocado)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            socio.accesoRevocado
                              ? 'bg-kinetic/10 text-kinetic border-kinetic/30 hover:bg-kinetic/20'
                              : 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20'
                          }`}
                          title={socio.accesoRevocado ? 'Reactivar credencial' : 'Revocar acceso instantáneamente (RN-18)'}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{socio.accesoRevocado ? 'Reactivar' : 'Revocar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Inscripción de Socio (HU-04) */}
      {modalInscripcionAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <span>Inscribir Nuevo Socio</span>
              </h2>
              <button
                onClick={() => setModalInscripcionAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitInscripcion)} className="space-y-4 mt-4">
              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  {...register('nombre')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {errors.nombre && (
                  <p className="text-xs text-danger mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* DUI y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    DUI (Formato 00000000-0)
                  </label>
                  <input
                    type="text"
                    placeholder="01234567-8"
                    {...register('dui')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none"
                  />
                  {errors.dui && (
                    <p className="text-xs text-danger mt-1">{errors.dui.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 7000-8888"
                    {...register('telefono')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Plan de Membresía */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Plan de Membresía a Asignar
                </label>
                {planes.length === 0 ? (
                  <p className="text-xs text-warning">
                    No hay planes creados. Primero debes configurar al menos un plan en la sección Planes.
                  </p>
                ) : (
                  <select
                    {...register('planId')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none cursor-pointer"
                  >
                    {planes.map((p) => (
                      <option key={p.id} value={p.id} className="bg-canvas-card text-white">
                        {p.nombrePlan} — ${Number(p.precio).toFixed(2)} ({p.duracionDias} días)
                      </option>
                    ))}
                  </select>
                )}
                {errors.planId && (
                  <p className="text-xs text-danger mt-1">{errors.planId.message}</p>
                )}
              </div>

              {/* Fecha de Inicio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  {...register('fechaInicio')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none cursor-pointer"
                />
              </div>

              {/* Explicación de cálculos automáticos */}
              <div className="p-3 bg-canvas-hover border border-canvas-border/80 rounded-xl text-[11px] text-slate-400">
                <span className="text-primary font-semibold block mb-0.5">Cálculos automáticos:</span>
                El sistema computará la fecha de vencimiento inicial sumando los días del plan, generará un código de referido único y registrará el cobro de la inscripción en los ingresos del mes.
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-canvas-border">
                <button
                  type="button"
                  onClick={() => setModalInscripcionAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-canvas-hover"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || planes.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-slate-950 hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {guardando ? 'Inscribiendo...' : 'Completar Inscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Renovación Acumulativa (HU-06) */}
      <ModalRenovacion
        socio={socioParaRenovar}
        abierto={!!socioParaRenovar}
        alCerrar={() => setSocioParaRenovar(null)}
        alRenovarExitoso={(socioActualizado) => {
          setMensajeExito(`¡Membresía de ${socioActualizado.nombre} renovada con éxito! Nueva fecha de vencimiento: ${socioActualizado.nuevaFechaVencimiento}`);
          setTimeout(() => setMensajeExito(''), 6000);
          cargarDatos();
        }}
      />
    </div>
  );
}
