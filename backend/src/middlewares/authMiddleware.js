import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar la validez del token JWT
 * Inyecta req.usuario con { id, rol, negocio_id }
 */
export function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado: No se proporcionó un token válido'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_jwt_gymcontrol_para_desarrollo_seguro_2026');
    // Guardamos los datos decodificados en req.usuario
    req.usuario = {
      id: payload.id,
      rol: payload.rol,
      negocio_id: payload.negocio_id
    };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado. Inicie sesión nuevamente'
    });
  }
}

/**
 * Middleware para verificar si el usuario tiene uno de los roles autorizados
 * @param {string[]} roles - Arreglo de roles permitidos, e.g. ['dueno'] o ['dueno', 'recepcion']
 */
export function autorizarRoles(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado: No cuenta con permisos para realizar esta acción'
      });
    }

    next();
  };
}
