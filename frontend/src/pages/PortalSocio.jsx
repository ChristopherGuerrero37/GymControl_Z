import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dumbbell,
  Calendar,
  Clock,
  QrCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  Award,
  Share2,
  Copy,
  Check,
  RefreshCw,
  X,
  Zap,
  Flame,
  ArrowRight,
  Phone
} from 'lucide-react';

export default function PortalSocio() {
  const { dui } = useParams();
  const [socio, setSocio] = useState(null);
  const [clases, setClases] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tabActiva, setTabActiva] = useState('carnet'); // 'carnet' | 'clases' | 'promociones'

  // Estado para rotación de QR dinámico cada 30 segundos (RN-17)
  const [timestampQr, setTimestampQr] = useState(Date.now());
  const [segundosRestantes, setSegundosRestantes] = useState(30);

  // Estados interactivos
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  // 1. Cargar datos del socio, clases y promociones
  const cargarDatos = async () => {
    if (!dui) return;
    try {
      setError('');
      // Consultar carnet del socio
      const resSocio = await fetch(`/api/public/socios/${encodeURIComponent(dui.trim())}`);
      const dataSocio = await resSocio.json();

      if (!resSocio.ok) {
        throw new Error(dataSocio.error || 'No se encontró información para este DUI');
      }

      setSocio(dataSocio);

      // Cargar clases colectivas
      const resClases = await fetch(`/api/public/socios/${encodeURIComponent(dui.trim())}/clases`);
      if (resClases.ok) {
        const dataClases = await resClases.json();
        setClases(dataClases);
      }

      // Cargar promociones activas
      const resPromos = await fetch(`/api/public/socios/${encodeURIComponent(dui.trim())}/promociones`);
      if (resPromos.ok) {
        const dataPromos = await resPromos.json();
        setPromociones(dataPromos);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [dui]);

  // 2. Temporizador para rotación de QR dinámico cada 30 segundos (RN-17)
  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          // Regenerar marca de tiempo
          setTimestampQr(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  // 3. Manejar Reserva de Clase en Tiempo Real (HU-09)
  const handleReservarClase = async (claseId) => {
    setProcesandoAccion(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      const res = await fetch(`/api/public/socios/${encodeURIComponent(dui)}/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claseId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al reservar cupo');
      }

      setMensajeExito(data.mensaje || '¡Cupo reservado con éxito!');
      setTimeout(() => setMensajeExito(''), 6000);
      cargarDatos();
    } catch (err) {
      setMensajeError(err.message);
      setTimeout(() => setMensajeError(''), 6000);
    } finally {
      setProcesandoAccion(false);
    }
  };

  // 4. Manejar Cancelación de Reserva
  const handleCancelarReserva = async (reservaId) => {
    setProcesandoAccion(true);
    setMensajeExito('');
    setMensajeError('');

    try {
      const res = await fetch(`/api/public/socios/${encodeURIComponent(dui)}/reservas/${reservaId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cancelar la reserva');
      }

      setMensajeExito('Reserva cancelada exitosamente y cupo liberado');
      setTimeout(() => setMensajeExito(''), 5000);
      cargarDatos();
    } catch (err) {
      setMensajeError(err.message);
      setTimeout(() => setMensajeError(''), 5000);
    } finally {
      setProcesandoAccion(false);
    }
  };

  // 5. Copiar código de referido al portapapeles
  const handleCopiarReferido = () => {
    if (!socio?.codigoReferido) return;
    navigator.clipboard.writeText(socio.codigoReferido);
    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 3000);
  };

  // 6. Formato de fecha legible
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

  // Generar carga de datos del QR con timestamp (RN-17)
  const qrPayload = socio
    ? JSON.stringify({
        dui: socio.dui,
        t: timestampQr
      })
    : '';

  if (cargando) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="font-display font-medium text-slate-300 tracking-wide text-sm">
          Cargando Carnet Digital...
        </p>
      </div>
    );
  }

  if (error || !socio) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,74,107,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">Carnet No Encontrado</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          {error || 'No se encontró ningún socio registrado con el número de DUI ingresado.'}
        </p>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-canvas-card border border-canvas-border hover:border-primary text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  // Estilos de badge según estado y revocación
  const esRevocado = socio.accesoRevocado || socio.estado === 'suspendida';
  const esActiva = socio.estado === 'activa';
  const esPorVencer = socio.estado === 'por_vencer';
  const esVencida = socio.estado === 'vencida';

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col items-center py-6 px-4 sm:px-6">
      {/* Contenedor móvil centrado */}
      <div className="w-full max-w-lg space-y-5">
        {/* Cabecera del Portal */}
        <header className="flex items-center justify-between pb-3 border-b border-canvas-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/20 to-kinetic/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(10,254,223,0.2)]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-wide text-white block">
                {socio.gimnasio?.nombre || 'GymControl Z'}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Portal Oficial del Socio</span>
              </span>
            </div>
          </div>

          {socio.gimnasio?.telefono && (
            <a
              href={`tel:${socio.gimnasio.telefono}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-canvas-card border border-canvas-border text-[11px] text-slate-300 hover:text-primary transition"
            >
              <Phone className="w-3 h-3 text-primary" />
              <span>{socio.gimnasio.telefono}</span>
            </a>
          )}
        </header>

        {/* Notificaciones de éxito / error flotantes */}
        {mensajeExito && (
          <div className="p-3 bg-kinetic/15 border border-kinetic/40 rounded-xl flex items-center gap-2.5 text-kinetic text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}
        {mensajeError && (
          <div className="p-3 bg-danger/15 border border-danger/40 rounded-xl flex items-center gap-2.5 text-danger text-xs animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Pestañas de Navegación del Portal */}
        <nav className="flex items-center p-1 bg-canvas-card border border-canvas-border rounded-xl">
          <button
            onClick={() => setTabActiva('carnet')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tabActiva === 'carnet'
                ? 'bg-primary text-slate-950 shadow-[0_0_15px_rgba(10,254,223,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Carnet QR</span>
          </button>

          <button
            onClick={() => setTabActiva('clases')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tabActiva === 'clases'
                ? 'bg-primary text-slate-950 shadow-[0_0_15px_rgba(10,254,223,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clases ({clases.length})</span>
          </button>

          <button
            onClick={() => setTabActiva('promociones')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tabActiva === 'promociones'
                ? 'bg-primary text-slate-950 shadow-[0_0_15px_rgba(10,254,223,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Beneficios</span>
          </button>
        </nav>

        {/* ==================================================== */}
        {/* PESTAÑA 1: CARNET DIGITAL QR DINÁMICO (HU-07, RN-17, RN-18) */}
        {/* ==================================================== */}
        {tabActiva === 'carnet' && (
          <div className="space-y-4">
            {/* Banner de Credencial Revocada (RN-18) */}
            {esRevocado && (
              <div className="p-4 bg-gradient-to-r from-danger/20 via-danger/10 to-danger/20 border-2 border-danger rounded-2xl text-center space-y-1 shadow-[0_0_25px_rgba(255,74,107,0.3)] animate-shake">
                <div className="inline-flex items-center gap-1.5 text-danger font-display font-black text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>CREDENCIAL SUSPENDIDA / REVOCADA</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tu acceso se encuentra suspendido. Por favor comunícate de inmediato con la administración del gimnasio.
                </p>
              </div>
            )}

            {/* Tarjeta Visual: Carnet Digital Deportivo Kinetic Onyx */}
            <div
              className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-2xl transition-all duration-300 ${
                esRevocado
                  ? 'bg-gradient-to-b from-danger/15 via-canvas-card to-canvas-card border-danger shadow-[0_0_35px_rgba(255,74,107,0.25)]'
                  : esActiva
                  ? 'bg-gradient-to-b from-kinetic/15 via-canvas-card to-canvas-card border-kinetic/80 shadow-[0_0_35px_rgba(74,225,118,0.2)]'
                  : esPorVencer
                  ? 'bg-gradient-to-b from-warning/15 via-canvas-card to-canvas-card border-warning/80 shadow-[0_0_35px_rgba(251,191,36,0.2)]'
                  : 'bg-gradient-to-b from-danger/15 via-canvas-card to-canvas-card border-danger/80 shadow-[0_0_35px_rgba(255,74,107,0.2)]'
              }`}
            >
              {/* Marca de agua de fondo */}
              <div className="absolute -right-8 -top-8 w-44 h-44 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

              {/* Encabezado del Carnet */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-canvas-border/80">
                <div>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-widest block mb-0.5">
                    Membresía Oficial
                  </span>
                  <h2 className="text-xl font-display font-bold text-white tracking-tight">
                    {socio.nombre}
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">DUI: {socio.dui}</p>
                </div>

                {/* Badge de Estado Dinámico */}
                <div className="text-right">
                  {esRevocado ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-danger/20 text-danger border border-danger/40 uppercase">
                      Suspendida
                    </span>
                  ) : esActiva ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-kinetic/20 text-kinetic border border-kinetic/40 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-kinetic animate-ping"></span>
                      Activa
                    </span>
                  ) : esPorVencer ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-warning/20 text-warning border border-warning/40 uppercase">
                      Por Vencer
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-danger/20 text-danger border border-danger/40 uppercase">
                      Vencida
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 block mt-1 font-medium truncate max-w-[120px]">
                    {socio.nombrePlan}
                  </span>
                </div>
              </div>

              {/* Código QR Dinámico (RN-17) */}
              <div className="my-6 flex flex-col items-center">
                <div
                  className={`p-4 bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
                    esRevocado ? 'opacity-30 grayscale pointer-events-none' : ''
                  }`}
                >
                  <QRCodeSVG
                    value={qrPayload}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* Contador de rotación del QR cada 30 segundos */}
                {!esRevocado && (
                  <div className="mt-4 w-full max-w-[220px] text-center space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                        <span>Rotación dinámica:</span>
                      </span>
                      <strong className="text-primary font-mono">{segundosRestantes}s</strong>
                    </div>

                    {/* Barra de progreso regresiva de 30 segundos */}
                    <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden border border-canvas-border">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-kinetic transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(segundosRestantes / 30) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Anti-fraude (RN-17): código único válido por 60s
                    </span>
                  </div>
                )}
              </div>

              {/* Contador de Días Restantes (RN-13) */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-canvas-border/80 text-center">
                <div className="bg-canvas/70 p-3 rounded-xl border border-canvas-border">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Días Restantes 
                  </span>
                  <span
                    className={`text-3xl font-display font-black tracking-tight ${
                      esRevocado || esVencida
                        ? 'text-danger'
                        : esPorVencer
                        ? 'text-warning'
                        : 'text-kinetic'
                    }`}
                  >
                    {esRevocado ? '0' : socio.diasRestantes}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {socio.diasRestantes === 1 ? 'día disponible' : 'días disponibles'}
                  </span>
                </div>

                <div className="bg-canvas/70 p-3 rounded-xl border border-canvas-border flex flex-col justify-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Vigencia del Plan
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {socio.fechaVencimiento?.split('T')[0] || socio.fechaVencimiento}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5">Fecha de vencimiento</span>
                </div>
              </div>
            </div>

            {/* Aviso de renovación si está vencida o por vencer */}
            {(esVencida || esPorVencer) && !esRevocado && (
              <div className="p-3.5 bg-warning/10 border border-warning/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-warning">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {esVencida
                      ? 'Tu membresía ha vencido. Renueva en recepción para seguir entrenando.'
                      : 'Tu membresía vence pronto. Puedes renovar con anticipación sin perder días (RN-03).'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* PESTAÑA 2: RESERVA DE CLASES EN TIEMPO REAL (HU-09) */}
        {/* ==================================================== */}
        {tabActiva === 'clases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Clases Colectivas Disponibles</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reserva tu cupo en tiempo real. Cupos limitados.
                </p>
              </div>

              <button
                onClick={cargarDatos}
                className="p-2 rounded-lg bg-canvas-card border border-canvas-border text-slate-400 hover:text-white"
                title="Actualizar cupos"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {clases.length === 0 ? (
              <div className="py-12 text-center bg-canvas-card border border-canvas-border rounded-2xl p-6">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">No hay clases agendadas</p>
                <p className="text-xs text-slate-400 mt-1">
                  Actualmente no hay horarios publicados por la administración. Vuelve a consultar más tarde.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clases.map((clase) => {
                  const sinCupos = clase.cuposDisponibles <= 0;
                  const porcentajeOcupado =
                    clase.cupoMaximo > 0
                      ? Math.round(((clase.cupoMaximo - clase.cuposDisponibles) / clase.cupoMaximo) * 100)
                      : 0;

                  return (
                    <div
                      key={clase.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        clase.yaReservada
                          ? 'bg-kinetic/10 border-kinetic/40 shadow-[0_0_15px_rgba(74,225,118,0.15)]'
                          : sinCupos
                          ? 'bg-canvas-card/60 border-canvas-border opacity-70'
                          : 'bg-canvas-card border-canvas-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base text-white">
                              {clase.nombreClase}
                            </span>
                            {clase.yaReservada && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-kinetic/20 text-kinetic border border-kinetic/30">
                                <Check className="w-3 h-3" />
                                <span>Reservado</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Coach: <strong className="text-slate-200">{clase.coach}</strong>
                          </p>
                        </div>

                        {/* Badge de Cupos */}
                        <div className="text-right">
                          {sinCupos ? (
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-danger/20 text-danger border border-danger/30 uppercase">
                              AGOTADA
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/30">
                              {clase.cuposDisponibles} de {clase.cupoMaximo} libres
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Horario y barra de ocupación */}
                      <div className="mt-3 pt-3 border-t border-canvas-border/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{formatearFechaHora(clase.fechaHora)}</span>
                        </span>

                        <span className="text-[11px] font-mono">{porcentajeOcupado}% ocupado</span>
                      </div>

                      {/* Botón de Acción para el Socio */}
                      <div className="mt-3.5 pt-2">
                        {clase.yaReservada ? (
                          <button
                            onClick={() => handleCancelarReserva(clase.reservaId)}
                            disabled={procesandoAccion}
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 border border-danger/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar mi reserva</span>
                          </button>
                        ) : esRevocado ? (
                          <button
                            disabled
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-canvas-hover text-slate-500 border border-canvas-border cursor-not-allowed"
                          >
                            Credencial suspendida
                          </button>
                        ) : esVencida ? (
                          <button
                            disabled
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-danger/10 text-danger border border-danger/30 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Membresía vencida. Renueva para reservar</span>
                          </button>
                        ) : sinCupos ? (
                          <button
                            disabled
                            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-canvas-hover text-slate-500 border border-canvas-border cursor-not-allowed"
                          >
                            Cupos agotados
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReservarClase(clase.id)}
                            disabled={procesandoAccion}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-slate-950 hover:bg-primary-dark transition shadow-[0_0_15px_rgba(10,254,223,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Reservar mi cupo ahora</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* PESTAÑA 3: BENEFICIOS, REFERIDOS Y PROMOCIONES (HU-10) */}
        {/* ==================================================== */}
        {tabActiva === 'promociones' && (
          <div className="space-y-4">
            {/* Bloque Programa de Referidos: "Trae a un Amigo" */}
            <div className="bg-gradient-to-r from-primary/10 via-canvas-card to-kinetic/10 border border-primary/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-primary" />
                <span>Programa Trae a un Amigo</span>
              </div>

              <h3 className="text-lg font-display font-bold text-white tracking-tight">
                Comparte tu Código de Referido
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Invita a tus amigos y conocidos a entrenar en {socio.gimnasio?.nombre}. Presentando tu código en recepción obtendrán beneficios en su inscripción.
              </p>

              {/* Caja del Código */}
              <div className="my-4 p-3 bg-canvas border border-canvas-border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Tu Código Único:</span>
                  <span className="font-mono text-base font-black text-primary tracking-wider">
                    {socio.codigoReferido}
                  </span>
                </div>

                <button
                  onClick={handleCopiarReferido}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-canvas-card hover:bg-canvas-hover border border-canvas-border text-slate-200 flex items-center gap-1.5 transition"
                >
                  {codigoCopiado ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-kinetic" />
                      <span className="text-kinetic">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-primary" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botón WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Hola! Te invito a entrenar conmigo en ${socio.gimnasio?.nombre || 'el gimnasio'}. Presenta mi código de referido *${socio.codigoReferido}* en recepción para obtener una tarifa especial en tu inscripción.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-kinetic text-slate-950 font-bold text-xs hover:bg-kinetic-dark transition shadow-[0_0_15px_rgba(74,225,118,0.25)] flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir en WhatsApp</span>
              </a>
            </div>

            {/* Listado de Promociones Vigentes (RN-09) */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-kinetic" />
                <span>Promociones del Gimnasio</span>
              </h4>

              {promociones.length === 0 ? (
                <div className="p-6 bg-canvas-card border border-canvas-border rounded-xl text-center text-xs text-slate-400">
                  No hay promociones adicionales activas en este momento.
                </div>
              ) : (
                promociones.map((promo) => (
                  <div
                    key={promo.id}
                    className="p-4 bg-canvas-card border border-canvas-border rounded-xl space-y-2 hover:border-kinetic/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h5 className="font-display font-bold text-sm text-white">{promo.titulo}</h5>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-kinetic/15 text-kinetic border border-kinetic/30 whitespace-nowrap">
                        {promo.descuento}
                      </span>
                    </div>

                    {promo.descripcion && (
                      <p className="text-xs text-slate-300">{promo.descripcion}</p>
                    )}

                    {promo.fechaFin && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-canvas-border/60">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Válida hasta: {promo.fechaFin}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pie de Página */}
        <footer className="text-center pt-6 pb-2 text-[11px] text-slate-500">
          GymControl Z &bull; Portal Móvil del Socio
        </footer>
      </div>
    </div>
  );
}
