import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  DollarSign, 
  Sparkles 
} from 'lucide-react';

const planFormSchema = z.object({
  nombrePlan: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  duracionDias: z.coerce.number().int().positive('La duración debe ser mayor a 0 días'),
  precio: z.coerce.number().positive('El precio debe ser un monto mayor a 0'),
  activo: z.boolean().default(true)
});

export default function Planes() {
  const { fetchConToken, usuario } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [errorApi, setErrorApi] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planEditando, setPlanEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const esDueno = usuario?.rol === 'dueno';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      nombrePlan: '',
      duracionDias: 30,
      precio: 25.00,
      activo: true
    }
  });

  const cargarPlanes = async () => {
    setCargando(true);
    setErrorApi('');
    try {
      const url = busqueda ? `/api/planes?q=${encodeURIComponent(busqueda)}` : '/api/planes';
      const res = await fetchConToken(url);
      if (!res.ok) throw new Error('Error al cargar la lista de planes');
      const data = await res.json();
      setPlanes(data);
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, [busqueda]);

  const abrirModalCrear = () => {
    setPlanEditando(null);
    reset({
      nombrePlan: '',
      duracionDias: 30,
      precio: 25.00,
      activo: true
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (plan) => {
    setPlanEditando(plan);
    setValue('nombrePlan', plan.nombrePlan);
    setValue('duracionDias', plan.duracionDias);
    setValue('precio', Number(plan.precio));
    setValue('activo', Boolean(plan.activo));
    setModalAbierto(true);
  };

  const onSubmit = async (datos) => {
    setGuardando(true);
    setErrorApi('');
    try {
      const url = planEditando ? `/api/planes/${planEditando.id}` : '/api/planes';
      const metodo = planEditando ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        body: JSON.stringify(datos)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Ocurrió un error al procesar el plan');
      }

      setModalAbierto(false);
      cargarPlanes();
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el plan "${nombre}"?`)) {
      return;
    }

    try {
      const res = await fetchConToken(`/api/planes/${id}`, { method: 'DELETE' });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'No se pudo eliminar el plan');
      }

      cargarPlanes();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <span>Planes de Membresía</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configura las tarifas, duraciones y precios de tu gimnasio.
          </p>
        </div>

        {esDueno && (
          <button
            onClick={abrirModalCrear}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-semibold text-sm hover:bg-primary-dark transition shadow-[0_0_15px_rgba(10,254,223,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Plan</span>
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar plan por nombre..."
          className="w-full bg-canvas-card border border-canvas-border focus:border-primary rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Mensaje de Error si ocurre */}
      {errorApi && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Estados de Carga, Vacío y Lista */}
      {cargando ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Cargando planes de membresía...</p>
        </div>
      ) : planes.length === 0 ? (
        <div className="py-16 text-center bg-canvas-card border border-canvas-border rounded-2xl p-8">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No se encontraron planes</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {busqueda ? 'No hay planes que coincidan con la búsqueda.' : 'Crea tu primer plan (ej. Mensual, Trimestral) para poder registrar socios.'}
          </p>
          {esDueno && !busqueda && (
            <button
              onClick={abrirModalCrear}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Plan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`bg-canvas-card border rounded-2xl p-5 relative overflow-hidden transition-all duration-200 ${
                plan.activo ? 'border-canvas-border hover:border-primary/40' : 'border-canvas-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">{plan.nombrePlan}</h3>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${
                      plan.activo ? 'bg-kinetic/10 text-kinetic border border-kinetic/30' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {plan.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-display font-black text-primary">
                    ${Number(plan.precio).toFixed(2)}
                  </span>
                  <span className="block text-[11px] text-slate-400">USD</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-canvas-border/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{plan.duracionDias} días de vigencia</span>
                </div>

                {esDueno && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirModalEditar(plan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-canvas-hover transition"
                      title="Editar plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(plan.id, plan.nombrePlan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition"
                      title="Eliminar plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Plan */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <h2 className="font-display font-bold text-base text-white">
                {planEditando ? 'Editar Plan de Membresía' : 'Nuevo Plan de Membresía'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del Plan
                </label>
                <input
                  type="text"
                  placeholder="Ej. Plan Mensual Completo"
                  {...register('nombrePlan')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {errors.nombrePlan && (
                  <p className="text-xs text-danger mt-1">{errors.nombrePlan.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duración (Días)
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    {...register('duracionDias')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  {errors.duracionDias && (
                    <p className="text-xs text-danger mt-1">{errors.duracionDias.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Precio ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25.00"
                    {...register('precio')}
                    className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  {errors.precio && (
                    <p className="text-xs text-danger mt-1">{errors.precio.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activo"
                  {...register('activo')}
                  className="rounded border-canvas-border bg-canvas text-primary focus:ring-0"
                />
                <label htmlFor="activo" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Plan activo (disponible para inscripciones)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-canvas-border">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-canvas-hover"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-slate-950 hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : planEditando ? 'Actualizar Plan' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
