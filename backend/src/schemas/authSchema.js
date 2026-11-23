import { z } from 'zod';

// Esquema para registro de un nuevo negocio y su dueño/administrador (HU-01)
export const registroNegocioSchema = z.object({
  nombreGimnasio: z
    .string({ required_error: 'El nombre del gimnasio es obligatorio' })
    .trim()
    .min(3, 'El nombre del gimnasio debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  telefono: z
    .string()
    .trim()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  nombreAdmin: z
    .string({ required_error: 'El nombre del administrador es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  correo: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El formato del correo electrónico no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Esquema para inicio de sesión (HU-02)
export const loginSchema = z.object({
  correo: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El formato del correo electrónico no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña no puede estar vacía')
});

// Esquema para creación de cuentas de personal (HU-12, RN-19)
export const crearUsuarioStaffSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del empleado es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  correo: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El formato del correo electrónico no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['recepcion', 'entrenador'], {
    required_error: 'Debe especificar el rol: recepcion o entrenador'
  })
});
