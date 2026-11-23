import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registroGimnasioSchema } from '../schemas/authSchemas';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Building2, Phone, User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorApi, setErrorApi] = useState('');
  const [cargando, setCargando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registroGimnasioSchema)
  });

  const onSubmit = async (datos) => {
    setErrorApi('');
    setCargando(true);

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar el gimnasio');
      }

      // HU-01: Redirige al Dashboard con sesión activa inmediatamente
      login(data.token, data.usuario);
      navigate('/admin/dashboard');
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-canvas-card border border-canvas-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Encabezado */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-canvas-hover border border-primary/40 text-primary mb-3 shadow-[0_0_20px_rgba(10,254,223,0.15)]">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Registrar Gimnasio en GymControl <span className="text-primary font-black">Z</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Empieza a controlar membresías, accesos rápidos y clases en minutos
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorApi && (
          <div className="mb-6 p-3.5 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorApi}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre del Gimnasio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del Gimnasio
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ej. Iron Power Gym"
                  {...register('nombreGimnasio')}
                  className={`w-full bg-canvas border ${
                    errors.nombreGimnasio ? 'border-danger' : 'border-canvas-border focus:border-primary'
                  } rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors`}
                />
              </div>
              {errors.nombreGimnasio && (
                <p className="text-xs text-danger mt-1">{errors.nombreGimnasio.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ej. 7890-1234"
                  {...register('telefono')}
                  className="w-full bg-canvas border border-canvas-border focus:border-primary rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-canvas-border pt-4">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-3">
              Datos del Administrador / Dueño
            </span>

            {/* Nombre del Admin */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ej. Carlos Mendoza"
                  {...register('nombreAdmin')}
                  className={`w-full bg-canvas border ${
                    errors.nombreAdmin ? 'border-danger' : 'border-canvas-border focus:border-primary'
                  } rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors`}
                />
              </div>
              {errors.nombreAdmin && (
                <p className="text-xs text-danger mt-1">{errors.nombreAdmin.message}</p>
              )}
            </div>

            {/* Correo */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="admin@ironpower.com"
                  {...register('correo')}
                  className={`w-full bg-canvas border ${
                    errors.correo ? 'border-danger' : 'border-canvas-border focus:border-primary'
                  } rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors`}
                />
              </div>
              {errors.correo && (
                <p className="text-xs text-danger mt-1">{errors.correo.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...register('password')}
                  className={`w-full bg-canvas border ${
                    errors.password ? 'border-danger' : 'border-canvas-border focus:border-primary'
                  } rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-danger mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-6 py-3 px-4 rounded-xl font-semibold text-sm bg-primary text-slate-950 hover:bg-primary-dark transition-all duration-200 shadow-[0_0_20px_rgba(10,254,223,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargando ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Crear Cuenta y Gimnasio</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-canvas-border pt-4">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold ml-1">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
