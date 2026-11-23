import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gymcontrol_token') || null);
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('gymcontrol_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(true);

  // Al montar, si hay token, verificar si sigue vigente consultando /perfil
  useEffect(() => {
    async function cargarPerfil() {
      if (!token) {
        setCargando(false);
        return;
      }

      try {
        const respuesta = await fetch('/api/auth/perfil', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (respuesta.ok) {
          const data = await respuesta.json();
          setUsuario(data.usuario);
          localStorage.setItem('gymcontrol_usuario', JSON.stringify(data.usuario));
        } else {
          // Si el token es inválido o expiró, cerrar sesión
          logout();
        }
      } catch (error) {
        console.error('Error al validar sesión:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarPerfil();
  }, [token]);

  const login = (nuevoToken, datosUsuario) => {
    setToken(nuevoToken);
    setUsuario(datosUsuario);
    localStorage.setItem('gymcontrol_token', nuevoToken);
    localStorage.setItem('gymcontrol_usuario', JSON.stringify(datosUsuario));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('gymcontrol_token');
    localStorage.removeItem('gymcontrol_usuario');
  };

  /**
   * Helper para realizar peticiones HTTP autenticadas con el Bearer token
   */
  const fetchConToken = async (url, opciones = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    };

    const respuesta = await fetch(url, {
      ...opciones,
      headers
    });

    if (respuesta.status === 401) {
      logout();
    }

    return respuesta;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        usuario,
        cargando,
        autenticado: !!token,
        login,
        logout,
        fetchConToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
