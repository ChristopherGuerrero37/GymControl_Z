import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '../schemas/authSchemas';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorApi, setErrorApi] = useState('');
  const [cargando, setCargando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (datos) => {
    setErrorApi('');
    setCargando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      login(data.token, data.usuario);
      navigate('/admin/dashboard');
    } catch (err) {
      setErrorApi(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-kinetic/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Encabezado */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-canvas-hover border border-primary/40 text-primary mb-4 shadow-[0_0_20px_rgba(10,254,223,0.15)]">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            GymControl <span className="text-primary font-black">Z</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Panel Administrativo y Punto de Acceso
          </p>
        </div>

        {/* Alerta de error si falla la autenticación */}
        {errorApi && (
          <div className="mb-6 p-3.5 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorApi}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="admin@tugimnasio.com"
                {...register('correo')}
                className={`w-full bg-canvas border ${
                  errors.correo ? 'border-danger' : 'border-canvas-border focus:border-primary'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors`}
              />
            </div>
            {errors.correo && (
              <p className="text-xs text-danger mt-1">{errors.correo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full bg-canvas border ${
                  errors.password ? 'border-danger' : 'border-canvas-border focus:border-primary'
                } rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-danger mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-primary text-slate-950 hover:bg-primary-dark transition-all duration-200 shadow-[0_0_20px_rgba(10,254,223,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargando ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Enlace al Registro */}
        <div className="mt-8 text-center border-t border-canvas-border pt-4">
          <p className="text-xs text-slate-400">
            ¿Tu gimnasio aún no está registrado?{' '}
            <Link to="/registro" className="text-primary hover:underline font-semibold ml-1">
              Registrar nuevo gimnasio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
