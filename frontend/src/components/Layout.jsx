import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  LogOut, 
  Dumbbell, 
  Menu, 
  X,
  UserCheck,
  Calendar,
  Award
} from 'lucide-react';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  // RN-19: Filtrar módulos accesibles según el rol del usuario (RBAC)
  const todosLosNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['dueno'] },
    { to: '/admin/verificador', icon: ShieldCheck, label: 'Verificador Rápido', roles: ['dueno', 'recepcion'] },
    { to: '/admin/socios', icon: Users, label: 'Gestión de Socios', roles: ['dueno', 'recepcion'] },
    { to: '/admin/clases', icon: Calendar, label: 'Clases Colectivas', roles: ['dueno', 'recepcion', 'entrenador'] },
    { to: '/admin/promociones', icon: Award, label: 'Promociones', roles: ['dueno', 'recepcion'] },
    { to: '/admin/planes', icon: CreditCard, label: 'Planes de Membresía', roles: ['dueno', 'recepcion'] },
  ];

  const rolActual = usuario?.rol || 'recepcion';
  const navItems = todosLosNavItems.filter((item) => item.roles.includes(rolActual));

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row text-slate-100">
      {/* Sidebar para pantallas medianas y grandes */}
      <aside className="hidden md:flex flex-col w-64 bg-canvas-card border-r border-canvas-border p-4 justify-between">
        <div className="space-y-6">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-canvas-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-kinetic/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(10,254,223,0.15)]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-wide text-white block">
                GymControl <span className="text-primary font-black">Z</span>
              </span>
              <span className="text-xs text-slate-400 font-medium truncate block max-w-[140px]">
                {usuario?.nombreGimnasio || 'Mi Gimnasio'}
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_12px_rgba(10,254,223,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-canvas-hover'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Perfil del Usuario en el pie del Sidebar */}
        <div className="border-t border-canvas-border pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-canvas-hover border border-canvas-border flex items-center justify-center text-kinetic font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{usuario?.nombre}</p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-kinetic/10 text-kinetic border border-kinetic/30">
                {usuario?.rol === 'dueno' ? 'Dueño / Admin' : usuario?.rol === 'entrenador' ? 'Entrenador' : 'Recepción'}
              </span>
            </div>
          </div>

          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-danger/10 border border-transparent hover:border-danger/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Header móvil */}
      <header className="md:hidden flex items-center justify-between p-4 bg-canvas-card border-b border-canvas-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Dumbbell className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base text-white">
            GymControl <span className="text-primary font-black">Z</span>
          </span>
        </div>
        <button
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-canvas-hover"
        >
          {menuMovilAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menú Desplegable Móvil */}
      {menuMovilAbierto && (
        <div className="md:hidden bg-canvas-card border-b border-canvas-border p-4 space-y-3">
          <div className="text-xs text-slate-400 pb-2 border-b border-canvas-border">
            Gimnasio: <span className="text-white font-medium">{usuario?.nombreGimnasio}</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuMovilAbierto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-slate-400 hover:bg-canvas-hover'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-danger bg-danger/10 border border-danger/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
