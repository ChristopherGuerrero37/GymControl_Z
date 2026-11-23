import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  UserCheck,
  Zap,
  Flame,
  Check,
  RefreshCw,
  Percent
} from 'lucide-react';

const claseFormSchema = z.object({
  nombreClase: z
    .string({ required_error: 'El nombre de la clase es obligatorio' })
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  coach: z
    .string({ required_error: 'El nombre del coach es obligatorio' })
    .min(3, 'El coach debe tener al menos 3 caracteres'),
  fechaHora: z
    .string({ required_error: 'La fecha y hora son obligatorias' })
    .min(1, 'Selecciona fecha y hora'),
  cupoMaximo: z.coerce
    .number({ required_error: 'El cupo es obligatorio' })
    .int()
    .positive('El cupo debe ser mayor a 0')
    .max(200, 'Máximo 200 cupos')
});

export default function Clases() {
  const { usuario, fetchConToken } = useAuth();
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalAsistentesAbierto, setModalAsistentesAbierto] = useState(false);
  const [modalInscribirAbierto, setModalInscribirAbierto] = useState(false);

  // Estados de modales específicos
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [cargandoAsistentes, setCargandoAsistentes] = useState(false);

  // Búsqueda de socios para HU-08B
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [sociosEncontrados, setSociosEncontrados] = useState([]);
  const [buscandoSocios, setBuscandoSocios] = useState(false);
  const [inscribiendoSocioId, setInscribiendoSocioId] = useState(null);

  const esEntrenador = usuario?.rol === 'entrenador';
  const puedeAdministrar = usuario?.rol === 'dueno' || usuario?.rol === 'recepcion';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(claseFormSchema),
    defaultValues: {
      nombreClase: '',
      coach: esEntrenador ? usuario?.nombre : '',
      fechaHora: '',
      cupoMaximo: 15
    }
  });

  const cargarClases = async () => {
    setCargando(true);
    setErrorApi('');
    try {
      const res = await fetchConToken('/api/clases');
      if (!res.ok) throw new Error('Error al cargar clases colectivas');
      const data = await res.json();
      setClases(data);
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClases();
  }, []);

  // 1. Crear Clase (HU-08)
  const onSubmitCrearClase = async (datos) => {
    setErrorApi('');
    try {
      const res = await fetchConToken('/api/clases', {
        method: 'POST',
        body: JSON.stringify(datos)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agendar clase');

      setMensajeExito(`¡Clase "${datos.nombreClase}" agendada exitosamente con ${datos.cupoMaximo} cupos!`);
      setTimeout(() => setMensajeExito(''), 6000);
      setModalCrearAbierto(false);
      reset();
      cargarClases();
    } catch (err) {
      setErrorApi(err.message);
    }
  };

  // 2. Cancelar Clase
  const handleCancelarClase = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de cancelar la clase "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetchConToken(`/api/clases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cancelar clase');

      setMensajeExito('Clase cancelada exitosamente');
      setTimeout(() => setMensajeExito(''), 5000);
      cargarClases();
    } catch (err) {
      setErrorApi(err.message);
    }
  };

  // 3. Abrir modal de Asistentes
  const abrirModalAsistentes = async (clase) => {
    setClaseSeleccionada(clase);
    setModalAsistentesAbierto(true);
    setCargandoAsistentes(true);
    try {
      const res = await fetchConToken(`/api/clases/${clase.id}/asistentes`);
      const data = await res.json();
      if (res.ok) {
        setAsistentes(data.asistentes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoAsistentes(false);
    }
  };

  // 4. Toggle Asistencia
  const handleToggleAsistencia = async (reservaId, estadoActual) => {
    try {
      const res = await fetchConToken(
        `/api/clases/${claseSeleccionada.id}/reservas/${reservaId}/asistencia`,
        {
          method: 'PATCH',
          body: JSON.stringify({ asistio: !estadoActual })
        }
      );
      if (res.ok) {
        setAsistentes((prev) =>
          prev.map((a) => (a.reservaId === reservaId ? { ...a, asistio: !estadoActual } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Búsqueda de socios para Inscripción Manual (HU-08B)
  const abrirModalInscribir = (clase) => {
    setClaseSeleccionada(clase);
    setBusquedaSocio('');
    setSociosEncontrados([]);
    setModalInscribirAbierto(true);
  };

  const buscarSociosParaInscribir = async (termino) => {
    setBusquedaSocio(termino);
    if (!termino.trim()) {
      setSociosEncontrados([]);
      return;
    }

    setBuscandoSocios(true);
    try {
      const res = await fetchConToken(`/api/socios?q=${encodeURIComponent(termino.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSociosEncontrados(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscandoSocios(false);
    }
  };

  // 6. Inscribir socio manualmente desde recepción (HU-08B)
  const ejecutarInscripcionManual = async (socio) => {
    setInscribiendoSocioId(socio.id);
    setErrorApi('');
    try {
      const res = await fetchConToken(`/api/clases/${claseSeleccionada.id}/inscribir-socio`, {
        method: 'POST',
        body: JSON.stringify({ socioId: socio.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al inscribir socio');

      setMensajeExito(data.mensaje || '¡Socio inscrito exitosamente!');
      setTimeout(() => setMensajeExito(''), 6000);
      setModalInscribirAbierto(false);
      cargarClases();
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setInscribiendoSocioId(null);
    }
  };

  // Formato de fecha
  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-SV', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Gestor de Clases Colectivas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Agenda de horarios, control de cupos e inscripción manual desde recepción.
          </p>
        </div>

        {puedeAdministrar && (
          <button
            onClick={() => {
              reset({
                nombreClase: '',
                coach: '',
                fechaHora: '',
                cupoMaximo: 15
              });
              setModalCrearAbierto(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-semibold text-sm hover:bg-primary-dark transition shadow-[0_0_15px_rgba(10,254,223,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Clase</span>
          </button>
        )}
      </div>

      {/* Banner de Éxito o Error */}
      {mensajeExito && (
        <div className="p-3.5 bg-kinetic/10 border border-kinetic/30 rounded-xl flex items-center gap-3 text-kinetic text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}
      {errorApi && (
        <div className="p-3.5 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Grid de Clases */}
      {cargando ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Cargando clases colectivas...</p>
        </div>
      ) : clases.length === 0 ? (
        <div className="py-16 text-center bg-canvas-card border border-canvas-border rounded-2xl p-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No hay clases agendadas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {puedeAdministrar
              ? 'Comienza agendando una clase colectiva (ej. Spinning, Yoga, Funcional) con el botón superior.'
              : 'No hay clases asignadas en este momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clases.map((clase) => {
            const sinCupos = clase.cuposDisponibles <= 0;
            return (
              <div
                key={clase.id}
                className={`bg-canvas-card border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                  sinCupos
                    ? 'border-canvas-border opacity-90'
                    : 'border-canvas-border hover:border-primary/40 shadow-lg'
                }`}
              >
                <div className="space-y-3">
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-base text-white">{clase.nombreClase}</h3>
                      <p className="text-xs text-slate-400">
                        Coach: <strong className="text-slate-200">{clase.coach}</strong>
                      </p>
                    </div>

                    {sinCupos ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/20 text-danger border border-danger/30 uppercase">
                        AGOTADA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/30">
                        {clase.cuposDisponibles} libres
                      </span>
                    )}
                  </div>

                  {/* Horario */}
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-canvas/60 p-2.5 rounded-xl border border-canvas-border">
                    <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{formatearFechaHora(clase.fechaHora)}</span>
                  </div>

                  {/* Barra de Porcentaje de Ocupación (RN-16) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Inscritos: {clase.totalInscritos} / {clase.cupoMaximo}</span>
                      <span className="font-mono">{clase.porcentajeOcupacion}% ocupación</span>
                    </div>
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-canvas-border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sinCupos
                            ? 'bg-danger'
                            : clase.porcentajeOcupacion > 75
                            ? 'bg-warning'
                            : 'bg-gradient-to-r from-primary to-kinetic'
                        }`}
                        style={{ width: `${clase.porcentajeOcupacion}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="mt-5 pt-3 border-t border-canvas-border flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* Botón Ver Asistentes */}
                    <button
                      onClick={() => abrirModalAsistentes(clase)}
                      className="flex-1 py-2 px-3 rounded-xl bg-canvas hover:bg-canvas-hover border border-canvas-border text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-kinetic" />
                      <span>Asistentes ({clase.totalInscritos})</span>
                    </button>

                    {/* Botón Inscribir Socio (HU-08B) */}
                    {puedeAdministrar && (
                      <button
                        onClick={() => abrirModalInscribir(clase)}
                        disabled={sinCupos}
                        className="py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-semibold text-primary transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
                        title="Inscribir socio presencialmente desde recepción"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Inscribir</span>
                      </button>
                    )}

                    {/* Cancelar Clase */}
                    {puedeAdministrar && (
                      <button
                        onClick={() => handleCancelarClase(clase.id, clase.nombreClase)}
                        className="p-2 rounded-xl text-slate-500 hover:text-danger hover:bg-danger/10 transition border border-transparent hover:border-danger/30"
                        title="Cancelar clase colectiva"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: AGENDAR CLASE COLECTIVA (HU-08) */}
      {/* ========================================================= */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Agendar Nueva Clase Colectiva</span>
              </h2>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitCrearClase)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de la Clase
                </label>
                <input
                  type="text"
                  placeholder="Ej. Spinning Neón Pro, Yoga Matutino"
                  {...register('nombreClase')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {errors.nombreClase && (
                  <p className="text-xs text-danger mt-1">{errors.nombreClase.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Coach / Entrenador
                </label>
                <input
                  type="text"
                  placeholder="Ej. Marcos Rivas"
                  {...register('coach')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {errors.coach && (
                  <p className="text-xs text-danger mt-1">{errors.coach.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Fecha y Hora
                  </label>
                  <input
                    type="datetime-local"
                    {...register('fechaHora')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  />
                  {errors.fechaHora && (
                    <p className="text-xs text-danger mt-1">{errors.fechaHora.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Cupo Máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    placeholder="15"
                    {...register('cupoMaximo')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  {errors.cupoMaximo && (
                    <p className="text-xs text-danger mt-1">{errors.cupoMaximo.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-canvas-border">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-slate-950 hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Agendar Clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LISTA DE ASISTENTES Y CHECK-IN */}
      {/* ========================================================= */}
      {modalAsistentesAbierto && claseSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <div>
                <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-kinetic" />
                  <span>Asistentes — {claseSeleccionada.nombreClase}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatearFechaHora(claseSeleccionada.fechaHora)} &bull; Coach: {claseSeleccionada.coach}
                </p>
              </div>
              <button
                onClick={() => setModalAsistentesAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-2 pr-1">
              {cargandoAsistentes ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-400">Cargando lista de asistentes...</p>
                </div>
              ) : asistentes.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-canvas/40 rounded-xl p-4">
                  Aún no hay socios inscritos en esta clase colectiva.
                </div>
              ) : (
                asistentes.map((asistente) => (
                  <div
                    key={asistente.reservaId}
                    className="p-3 bg-canvas/70 border border-canvas-border rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{asistente.nombreSocio}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">DUI: {asistente.dui}</span>
                        <span>&bull;</span>
                        <span
                          className={`font-semibold ${
                            asistente.estadoMembresia === 'activa'
                              ? 'text-kinetic'
                              : asistente.estadoMembresia === 'por_vencer'
                              ? 'text-warning'
                              : 'text-danger'
                          }`}
                        >
                          {asistente.estadoMembresia}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAsistencia(asistente.reservaId, asistente.asistio)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        asistente.asistio
                          ? 'bg-kinetic/20 text-kinetic border border-kinetic/40'
                          : 'bg-canvas text-slate-400 hover:text-white border border-canvas-border'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{asistente.asistio ? 'Asistió' : 'Marcar Presente'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-canvas-border text-right">
              <button
                onClick={() => setModalAsistentesAbierto(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-canvas hover:bg-canvas-hover border border-canvas-border text-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: INSCRIBIR SOCIO PRESENCIALMENTE (HU-08B) */}
      {/* ========================================================= */}
      {modalInscribirAbierto && claseSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <div>
                <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Inscripción Manual en Recepción</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inscribe a un socio en: <strong className="text-white">{claseSeleccionada.nombreClase}</strong> ({claseSeleccionada.cuposDisponibles} cupos libres)
                </p>
              </div>
              <button
                onClick={() => setModalInscribirAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador de Socios */}
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaSocio}
                onChange={(e) => buscarSociosParaInscribir(e.target.value)}
                placeholder="Digita el nombre o DUI del socio a inscribir..."
                className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Resultados de Búsqueda */}
            <div className="flex-1 overflow-y-auto my-4 space-y-2 pr-1">
              {buscandoSocios ? (
                <div className="py-8 text-center text-xs text-slate-400">Buscando socios...</div>
              ) : busquedaSocio && sociosEncontrados.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No se encontraron socios que coincidan con la búsqueda.
                </div>
              ) : !busquedaSocio ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Comienza a escribir el nombre o DUI del socio para inscribirlo en esta clase colectiva.
                </div>
              ) : (
                sociosEncontrados.map((socio) => {
                  const esVencido = socio.estado === 'vencida';
                  const esRevocado = socio.accesoRevocado;

                  return (
                    <div
                      key={socio.id}
                      className="p-3 bg-canvas/70 border border-canvas-border rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{socio.nombre}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono">DUI: {socio.dui}</span>
                          <span>&bull;</span>
                          <span>Plan: {socio.nombrePlan}</span>
                          <span>&bull;</span>
                          <span
                            className={`font-semibold ${
                              esRevocado
                                ? 'text-danger'
                                : socio.estado === 'activa'
                                ? 'text-kinetic'
                                : socio.estado === 'por_vencer'
                                ? 'text-warning'
                                : 'text-danger'
                            }`}
                          >
                            {esRevocado ? 'Revocado (RN-18)' : socio.estado}
                          </span>
                        </div>
                      </div>

                      {esRevocado ? (
                        <span className="text-[10px] font-bold text-danger px-2 py-1 bg-danger/10 border border-danger/30 rounded">
                          Revocado
                        </span>
                      ) : esVencido ? (
                        <span className="text-[10px] font-bold text-danger px-2 py-1 bg-danger/10 border border-danger/30 rounded">
                          Vencido 
                        </span>
                      ) : (
                        <button
                          onClick={() => ejecutarInscripcionManual(socio)}
                          disabled={inscribiendoSocioId === socio.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-slate-950 hover:bg-primary-dark transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{inscribiendoSocioId === socio.id ? 'Inscribiendo...' : 'Inscribir'}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-canvas-border text-right">
              <button
                onClick={() => setModalInscribirAbierto(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-canvas hover:bg-canvas-hover border border-canvas-border text-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
