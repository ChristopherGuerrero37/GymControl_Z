import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { validarSchema } from '../middlewares/validarSchema.js';
import { registroNegocioSchema, loginSchema, crearUsuarioStaffSchema } from '../schemas/authSchema.js';
import { verificarToken, autorizarRoles } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * Función auxiliar para generar un slug seguro a partir del nombre del gimnasio
 */
function generarSlug(nombre) {
  const base = nombre
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const sufijo = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${sufijo}`;
}

/**
 * POST /api/auth/registro
 * HU-01: Registrar un nuevo gimnasio y su cuenta de dueño/administrador
 */
router.post('/registro', validarSchema(registroNegocioSchema), async (req, res) => {
  const { nombreGimnasio, telefono, nombreAdmin, correo, password } = req.body;
  let connection;

  try {
    // 1. Validar si el correo ya existe en la plataforma (RN-04)
    const [usuariosExistentes] = await pool.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una cuenta registrada con este correo'
      });
    }

    // 2. Transacción para asegurar la creación atómica de negocio y usuario
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const slug = generarSlug(nombreGimnasio);

    // Insertar negocio
    const [resultadoNegocio] = await connection.query(
      'INSERT INTO negocios (nombre, slug, telefono) VALUES (?, ?, ?)',
      [nombreGimnasio, slug, telefono || null]
    );
    const negocioId = resultadoNegocio.insertId;

    // Hashear contraseña con bcryptjs (RN-04)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario con rol 'dueno'
    const [resultadoUsuario] = await connection.query(
      'INSERT INTO usuarios (negocio_id, nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
      [negocioId, nombreAdmin, correo, passwordHash, 'dueno']
    );
    const usuarioId = resultadoUsuario.insertId;

    await connection.commit();

    // 3. Generar token JWT con id, rol y negocio_id (RN-04)
    const token = jwt.sign(
      {
        id: usuarioId,
        rol: 'dueno',
        negocio_id: negocioId
      },
      process.env.JWT_SECRET || 'clave_secreta_jwt_gymcontrol_para_desarrollo_seguro_2026',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      mensaje: 'Gimnasio y cuenta creados exitosamente',
      token,
      usuario: {
        id: usuarioId,
        nombre: nombreAdmin,
        correo,
        rol: 'dueno',
        negocioId,
        nombreGimnasio,
        slug
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en /api/auth/registro:', error);
    return res.status(500).json({ error: 'Error interno al registrar el gimnasio' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/auth/login
 * HU-02: Inicio de sesión con credenciales
 */
router.post('/login', validarSchema(loginSchema), async (req, res) => {
  const { correo, password } = req.body;

  try {
    // 1. Buscar usuario junto con los datos de su gimnasio
    const [usuarios] = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.password_hash AS passwordHash, 
              u.rol, u.negocio_id AS negocioId, n.nombre AS nombreGimnasio, n.slug
       FROM usuarios u
       INNER JOIN negocios n ON u.negocio_id = n.id
       WHERE u.correo = ?`,
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    const usuario = usuarios[0];

    // 2. Verificar la contraseña con bcryptjs (RN-04)
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    // 3. Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
        negocio_id: usuario.negocioId
      },
      process.env.JWT_SECRET || 'clave_secreta_jwt_gymcontrol_para_desarrollo_seguro_2026',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        negocioId: usuario.negocioId,
        nombreGimnasio: usuario.nombreGimnasio,
        slug: usuario.slug
      }
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return res.status(500).json({ error: 'Error interno al procesar el inicio de sesión' });
  }
});

/**
 * GET /api/auth/perfil
 * Consulta los datos del usuario autenticado a través del token JWT
 */
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.rol, u.negocio_id AS negocioId,
              n.nombre AS nombreGimnasio, n.telefono, n.slug
       FROM usuarios u
       INNER JOIN negocios n ON u.negocio_id = n.id
       WHERE u.id = ? AND u.negocio_id = ?`,
      [req.usuario.id, req.usuario.negocio_id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({ usuario: usuarios[0] });
  } catch (error) {
    console.error('Error en /api/auth/perfil:', error);
    return res.status(500).json({ error: 'Error interno al consultar el perfil' });
  }
});

/**
 * GET /api/auth/usuarios
 * HU-12: Lista todos los usuarios/empleados del negocio (Solo Dueño)
 */
router.get('/usuarios', verificarToken, autorizarRoles('dueno'), async (req, res) => {
  const negocioId = req.usuario.negocio_id;

  try {
    const [usuarios] = await pool.query(
      `SELECT id, nombre, correo, rol, creado_en AS creadoEn
       FROM usuarios
       WHERE negocio_id = ?
       ORDER BY id DESC`,
      [negocioId]
    );

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Error al consultar la lista de empleados' });
  }
});

/**
 * POST /api/auth/usuarios
 * HU-12: Crear cuentas para el personal (Recepcionista o Entrenador) (Solo Dueño)
 */
router.post(
  '/usuarios',
  verificarToken,
  autorizarRoles('dueno'),
  validarSchema(crearUsuarioStaffSchema),
  async (req, res) => {
    const negocioId = req.usuario.negocio_id;
    const { nombre, correo, password, rol } = req.body;

    try {
      const [existentes] = await pool.query(
        'SELECT id FROM usuarios WHERE correo = ?',
        [correo]
      );

      if (existentes.length > 0) {
        return res.status(409).json({
          error: 'Ya existe una cuenta registrada con este correo electrónico'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const [resultado] = await pool.query(
        'INSERT INTO usuarios (negocio_id, nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
        [negocioId, nombre, correo, passwordHash, rol]
      );

      return res.status(201).json({
        mensaje: `Usuario con rol ${rol} creado exitosamente`,
        usuario: {
          id: resultado.insertId,
          negocioId,
          nombre,
          correo,
          rol
        }
      });
    } catch (error) {
      console.error('Error al crear usuario del personal:', error);
      return res.status(500).json({ error: 'Error al crear la cuenta del empleado' });
    }
  }
);

export default router;
