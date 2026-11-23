import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ rolesPermitidos }) {
  const { autenticado, cargando, usuario } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-medium">Cargando GymControl Z...</span>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  // RN-19: Restricción por roles
  if (rolesPermitidos && !rolesPermitidos.includes(usuario?.rol)) {
    const destino = usuario?.rol === 'entrenador' ? '/admin/clases' : '/admin/verificador';
    return <Navigate to={destino} replace />;
  }

  return <Outlet />;
}
