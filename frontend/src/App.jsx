import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import Planes from './pages/Planes';
import Socios from './pages/Socios';
import VerificadorAcceso from './pages/VerificadorAcceso';
import Clases from './pages/Clases';
import Promociones from './pages/Promociones';
import PortalSocio from './pages/PortalSocio';

function AdminIndexRedirect() {
  const { usuario } = useAuth();
  if (usuario?.rol === 'entrenador') {
    return <Navigate to="/admin/clases" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/socio/:dui" element={<PortalSocio />} />

          {/* Rutas Protegidas bajo Layout */}
          <Route path="/admin" element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<AdminIndexRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="verificador" element={<VerificadorAcceso />} />
              <Route path="socios" element={<Socios />} />
              <Route path="clases" element={<Clases />} />
              <Route path="promociones" element={<Promociones />} />
              <Route path="planes" element={<Planes />} />
            </Route>
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
