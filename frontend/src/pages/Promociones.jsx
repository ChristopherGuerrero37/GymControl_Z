import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Power,
  Sparkles,
  Tag
} from 'lucide-react';

const promocionFormSchema = z.object({
  titulo: z
    .string({ required_error: 'El título es obligatorio' })
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().optional().or(z.literal('')),
  descuento: z
    .string({ required_error: 'El descuento o beneficio es obligatorio' })
    .min(2, 'Debe especificar el beneficio'),
  fechaFin: z.string().optional().or(z.literal('')),
  activa: z.boolean().default(true)
});

export default function Promociones() {
  const { fetchConToken } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(promocionFormSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      descuento: '',
      fechaFin: '',
      activa: true
    }
  });

  const cargarPromociones = async () => {
    setCargando(true);
    setErrorApi('');
    try {
      const res = await fetchConToken('/api/promociones');
      if (!res.ok) throw new Error('Error al obtener promociones');
      const data = await res.json();
      setPromociones(data);
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPromociones();
  }, []);

  // 1. Crear Promoción (HU-10)
  const onSubmitCrear = async (datos) => {
    setErrorApi('');
    try {
      const res = await fetchConToken('/api/promociones', {
        method: 'POST',
        body: JSON.stringify(datos)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la promoción');

      setMensajeExito(`¡Promoción "${datos.titulo}" creada exitosamente!`);
      setTimeout(() => setMensajeExito(''), 5000);
      setModalCrearAbierto(false);
      reset();
      cargarPromociones();
    } catch (err) {
      setErrorApi(err.message);
    }
  };

  // 2. Toggle Activación
  const handleToggleEstado = async (id) => {
    try {
      const res = await fetchConToken(`/api/promociones/${id}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        cargarPromociones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Eliminar Promoción
  const handleEliminar = async (id, titulo) => {
    if (!window.confirm(`¿Deseas eliminar la promoción "${titulo}"?`)) return;

    try {
      const res = await fetchConToken(`/api/promociones/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setMensajeExito('Promoción eliminada');
      setTimeout(() => setMensajeExito(''), 4000);
      cargarPromociones();
    } catch (err) {
      setErrorApi(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <span>Módulo de Promociones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crea ofertas y descuentos visibles para tus socios en su portal móvil.
          </p>
        </div>

        <button
          onClick={() => {
            reset();
            setModalCrearAbierto(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-semibold text-sm hover:bg-primary-dark transition shadow-[0_0_15px_rgba(10,254,223,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Promoción</span>
        </button>
      </div>

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

      {/* Grid de Promociones */}
      {cargando ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Cargando promociones...</p>
        </div>
      ) : promociones.length === 0 ? (
        <div className="py-16 text-center bg-canvas-card border border-canvas-border rounded-2xl p-8">
          <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No hay promociones configuradas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Crea descuentos u ofertas para fidelizar a tus clientes en momentos clave como Black Friday o Año Nuevo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {promociones.map((promo) => (
            <div
              key={promo.id}
              className={`bg-canvas-card border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                promo.expirada
                  ? 'border-canvas-border opacity-60'
                  : promo.activa
                  ? 'border-canvas-border hover:border-kinetic/50 shadow-lg'
                  : 'border-canvas-border opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-base text-white">{promo.titulo}</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-kinetic/15 text-kinetic border border-kinetic/30 whitespace-nowrap">
                    {promo.descuento}
                  </span>
                </div>

                {promo.descripcion && (
                  <p className="text-xs text-slate-300 line-clamp-3">{promo.descripcion}</p>
                )}

                <div className="pt-2 border-t border-canvas-border text-[11px] text-slate-400 space-y-1">
                  {promo.fechaFin && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Vence: {promo.fechaFin}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        promo.expirada
                          ? 'bg-danger'
                          : promo.activa
                          ? 'bg-kinetic'
                          : 'bg-slate-500'
                      }`}
                    ></span>
                    <span>
                      {promo.expirada
                        ? 'Expirada (RN-09)'
                        : promo.activa
                        ? 'Activa y visible en portal'
                        : 'Pausada / Desactivada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="mt-4 pt-3 border-t border-canvas-border flex items-center justify-between">
                <button
                  onClick={() => handleToggleEstado(promo.id)}
                  disabled={promo.expirada}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    promo.activa
                      ? 'bg-kinetic/15 text-kinetic border border-kinetic/30 hover:bg-kinetic/25'
                      : 'bg-canvas text-slate-400 hover:text-white border border-canvas-border'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{promo.activa ? 'Pausar' : 'Activar'}</span>
                </button>

                <button
                  onClick={() => handleEliminar(promo.id, promo.titulo)}
                  className="p-1.5 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Promoción */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>Nueva Promoción u Oferta</span>
              </h2>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-canvas-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitCrear)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Título de la Promoción
                </label>
                <input
                  type="text"
                  placeholder="Ej. 2x1 en Renovación Black November"
                  {...register('titulo')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {errors.titulo && (
                  <p className="text-xs text-danger mt-1">{errors.titulo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Beneficio / Descuento Destacado
                </label>
                <input
                  type="text"
                  placeholder="Ej. 20% OFF, Mes Gratis, Sin Matrícula"
                  {...register('descuento')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                {errors.descuento && (
                  <p className="text-xs text-danger mt-1">{errors.descuento.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explica las condiciones de la oferta..."
                  {...register('descripcion')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  {...register('fechaFin')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                />
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
                  {isSubmitting ? 'Guardando...' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
