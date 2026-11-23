import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, X, AlertCircle, CheckCircle2, Calendar, CreditCard, Clock } from 'lucide-react';

export default function ModalRenovacion({ socio, abierto, alCerrar, alRenovarExitoso }) {
  const { fetchConToken } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState('');

  useEffect(() => {
    if (!abierto) return;

    async function cargarPlanes() {
      setCargandoPlanes(true);
      setErrorApi('');
      try {
        const res = await fetchConToken('/api/planes');
        if (!res.ok) throw new Error('Error al cargar los planes disponibles');
        const data = await res.json();
        const planesActivos = data.filter(p => p.activo);
        setPlanes(planesActivos);

        // Preseleccionar el plan actual del socio o el primero de la lista
        if (planesActivos.length > 0) {
          const actual = planesActivos.find(p => p.id === socio?.planId);
          setPlanSeleccionado(actual ? actual.id : planesActivos[0].id);
        }
      } catch (err) {
        setErrorApi(err.message);
      } finally {
        setCargandoPlanes(false);
      }
    }

    cargarPlanes();
  }, [abierto, socio]);

  if (!abierto || !socio) return null;

  const planElegido = planes.find(p => p.id === Number(planSeleccionado));

  const handleRenovar = async (e) => {
    e.preventDefault();
    if (!planSeleccionado) return;

    setGuardando(true);
    setErrorApi('');

    try {
      const res = await fetchConToken(`/api/socios/${socio.id}/renovar`, {
        method: 'POST',
        body: JSON.stringify({ planId: Number(planSeleccionado) })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar la renovación');
      }

      alRenovarExitoso(data.socio);
      alCerrar();
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
          <div className="flex items-center gap-2 text-kinetic">
            <RefreshCw className="w-5 h-5" />
            <h2 className="font-display font-bold text-base text-white">
              Renovar Membresía
            </h2>
          </div>
          <button
            onClick={alCerrar}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información del socio */}
        <div className="my-4 p-3.5 bg-canvas rounded-xl border border-canvas-border space-y-1">
          <p className="text-sm font-semibold text-white">{socio.nombre}</p>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>DUI: {socio.dui}</span>
            <span>Vence actual: <strong className="text-slate-300">{socio.fechaVencimiento?.split('T')[0] || socio.fechaVencimiento}</strong></span>
          </div>
        </div>

        {/* Error si ocurre */}
        {errorApi && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-2 text-danger text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorApi}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleRenovar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Seleccionar Plan de Renovación
            </label>

            {cargandoPlanes ? (
              <div className="py-4 text-center text-xs text-slate-400">Cargando planes...</div>
            ) : planes.length === 0 ? (
              <p className="text-xs text-warning">No hay planes activos configurados.</p>
            ) : (
              <div className="space-y-2">
                {planes.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      Number(planSeleccionado) === plan.id
                        ? 'border-kinetic bg-kinetic/10 shadow-[0_0_12px_rgba(74,225,118,0.15)]'
                        : 'border-canvas-border bg-canvas hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={Number(planSeleccionado) === plan.id}
                        onChange={() => setPlanSeleccionado(plan.id)}
                        className="text-kinetic focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-semibold text-white block">{plan.nombrePlan}</span>
                        <span className="text-[11px] text-slate-400">{plan.duracionDias} días adicionales</span>
                      </div>
                    </div>
                    <span className="text-sm font-display font-bold text-kinetic">
                      ${Number(plan.precio).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Recordatorio de regla acumulativa (RN-03) */}
          <div className="p-3 bg-canvas-hover border border-canvas-border/80 rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Renovación acumulativa </span>
            </div>
            <p>
              Si la membresía aún no vence, los nuevos {planElegido?.duracionDias || 30} días se sumarán a su fecha de vencimiento futura sin perder días pagados.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-canvas-border">
            <button
              type="button"
              onClick={alCerrar}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-canvas-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !planSeleccionado}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-kinetic text-slate-950 hover:bg-kinetic-dark transition shadow-[0_0_15px_rgba(74,225,118,0.2)] disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${guardando ? 'animate-spin' : ''}`} />
              <span>{guardando ? 'Procesando pago...' : `Registrar Renovación ($${planElegido ? Number(planElegido.precio).toFixed(2) : '0.00'})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
