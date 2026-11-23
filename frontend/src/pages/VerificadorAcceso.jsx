import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ModalRenovacion from '../components/ModalRenovacion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  User, 
  Calendar, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function VerificadorAcceso() {
  const { fetchConToken } = useAuth();
  const [duiInput, setDuiInput] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [socioParaRenovar, setSocioParaRenovar] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Mantener el foco listo para lecturas de código de barras o digitación rápida
    inputRef.current?.focus();
  }, []);

  const formatearDui = (valor) => {
    // Limpia y añade el guion automáticamente si digita 9 dígitos numéricos
    const limpio = valor.replace(/\D/g, '');
    if (limpio.length > 8) {
      return `${limpio.slice(0, 8)}-${limpio.slice(8, 9)}`;
    }
    return valor;
  };

  const handleInputChange = (e) => {
    const valor = e.target.value;
    if (valor.startsWith('{') || valor.includes('dui')) {
      setDuiInput(valor);
    } else {
      setDuiInput(formatearDui(valor));
    }
  };

  const verificarSocio = async (e) => {
    if (e) e.preventDefault();
    const rawInput = duiInput.trim();
    if (!rawInput) return;

    let duiParaConsultar = rawInput;
    let timestampQr = null;

    try {
      if (rawInput.startsWith('{') && rawInput.endsWith('}')) {
        const parsed = JSON.parse(rawInput);
        if (parsed.dui) {
          duiParaConsultar = parsed.dui;
          timestampQr = parsed.t;
        }
      }
    } catch (err) {
      // Si no es JSON válido, consultar como DUI simple
    }

    setCargando(true);
    setErrorBusqueda('');
    setResultado(null);

    try {
      let url = `/api/socios/verificar/${encodeURIComponent(duiParaConsultar)}`;
      if (timestampQr) {
        url += `?t=${encodeURIComponent(timestampQr)}`;
      }

      const res = await fetchConToken(url);
      const data = await res.json();

      if (res.status === 404) {
        setErrorBusqueda(data.error || 'Socio no encontrado con este número de DUI');
        return;
      }

      if (res.status === 400 && data.qrExpirado) {
        setErrorBusqueda(data.error || 'CÓDIGO QR EXPIRADO (RN-17) — Por favor pide al socio actualizar su pantalla');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Error al verificar socio');
      }

      setResultado(data);
    } catch (err) {
      setErrorBusqueda(err.message);
    } finally {
      setCargando(false);
      // Volver a enfocar para la siguiente lectura
      inputRef.current?.focus();
    }
  };

  const limpiar = () => {
    setDuiInput('');
    setResultado(null);
    setErrorBusqueda('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kinetic/10 border border-kinetic/30 text-kinetic text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          <span>Punto de Acceso Instantáneo</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
          Verificador Rápido de Acceso
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Digita el DUI o escanea el carnet del socio para validar en segundos si su membresía está al día.
        </p>
      </div>

      {/* Caja de Búsqueda / Escaneo */}
      <div className="bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <form onSubmit={verificarSocio} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={duiInput}
              onChange={handleInputChange}
              placeholder="Digita el DUI (00000000-0) o escanea carnet QR..."
              maxLength={150}
              className="w-full bg-canvas border-2 border-canvas-border focus:border-kinetic rounded-xl pl-12 pr-4 py-3.5 text-base text-white font-mono placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={cargando || !duiInput.trim()}
            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-kinetic text-slate-950 hover:bg-kinetic-dark transition shadow-[0_0_20px_rgba(74,225,118,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Verificar</span>
              </>
            )}
          </button>

          {resultado && (
            <button
              type="button"
              onClick={limpiar}
              className="px-4 py-3.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-canvas hover:bg-canvas-hover border border-canvas-border transition"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Mensaje de Socio No Encontrado */}
      {errorBusqueda && (
        <div className="p-5 bg-danger/10 border-2 border-danger/40 rounded-2xl text-center space-y-2 animate-shake">
          <div className="w-12 h-12 rounded-full bg-danger/20 text-danger flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-danger">SOCIO NO REGISTRADO</h3>
          <p className="text-xs text-slate-300">
            {errorBusqueda}. Verifica que el número de DUI esté bien escrito o regístralo en la sección de Socios.
          </p>
        </div>
      )}

      {/* Banner Gigante de Respuesta Inmediata (HU-05) */}
      {resultado && (
        <div
          className={`rounded-2xl border-2 p-8 shadow-2xl transition-all duration-300 ${
            resultado.accesoPermitido
              ? 'bg-gradient-to-b from-kinetic/15 via-canvas-card to-canvas-card border-kinetic shadow-[0_0_40px_rgba(74,225,118,0.2)]'
              : 'bg-gradient-to-b from-danger/20 via-canvas-card to-canvas-card border-danger shadow-[0_0_40px_rgba(255,74,107,0.25)]'
          }`}
        >
          {/* Encabezado del Banner Gigante */}
          <div className="text-center space-y-3 pb-6 border-b border-canvas-border">
            <div
              className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-2xl ${
                resultado.accesoPermitido
                  ? 'bg-kinetic text-slate-950 shadow-[0_0_30px_rgba(74,225,118,0.4)]'
                  : 'bg-danger text-white shadow-[0_0_30px_rgba(255,74,107,0.4)]'
              }`}
            >
              {resultado.accesoPermitido ? (
                <ShieldCheck className="w-12 h-12" />
              ) : (
                <ShieldAlert className="w-12 h-12" />
              )}
            </div>

            <h2
              className={`text-3xl sm:text-4xl font-display font-black tracking-tight ${
                resultado.accesoPermitido ? 'text-kinetic' : 'text-danger'
              }`}
            >
              {resultado.mensajeBanner}
            </h2>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estado: <span className="text-white">{resultado.estado.replace('_', ' ')}</span>
            </p>
          </div>

          {/* Datos del Socio y Contador de Días */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
            {/* Información del Cliente */}
            <div className="space-y-3 bg-canvas/60 p-4 rounded-xl border border-canvas-border">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                <User className="w-4 h-4 text-primary" />
                <span>Datos del Socio</span>
              </div>
              <p className="text-xl font-bold text-white">{resultado.socio.nombre}</p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>DUI: <strong className="text-white font-mono">{resultado.socio.dui}</strong></p>
                <p>Plan: <strong className="text-primary">{resultado.socio.nombrePlan}</strong></p>
                <p>Fecha Vencimiento: <strong className="text-slate-200">{resultado.socio.fechaVencimiento?.split('T')[0] || resultado.socio.fechaVencimiento}</strong></p>
              </div>
            </div>

            {/* Contador de Días Restantes (RN-13) */}
            <div className="bg-canvas/60 p-4 rounded-xl border border-canvas-border flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase mb-1">
                <Clock className="w-4 h-4 text-kinetic" />
                <span>Días Restantes</span>
              </div>
              <span
                className={`text-5xl font-display font-black tracking-tight ${
                  resultado.accesoPermitido ? 'text-kinetic' : 'text-danger'
                }`}
              >
                {resultado.diasRestantes}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {resultado.diasRestantes === 1 ? 'día restante' : 'días restantes de vigencia'}
              </span>
            </div>
          </div>

          {/* Botón de Acción Rápida si requiere renovación */}
          {(!resultado.accesoPermitido || resultado.estado === 'por_vencer') && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setSocioParaRenovar(resultado.socio)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-kinetic text-slate-950 hover:bg-kinetic-dark transition shadow-[0_0_20px_rgba(74,225,118,0.25)] inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Renovar Membresía Ahora</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Renovación Directa */}
      <ModalRenovacion
        socio={socioParaRenovar}
        abierto={!!socioParaRenovar}
        alCerrar={() => setSocioParaRenovar(null)}
        alRenovarExitoso={(socioActualizado) => {
          // Actualizar inmediatamente el estado en el verificador
          verificarSocio();
        }}
      />
    </div>
  );
}
