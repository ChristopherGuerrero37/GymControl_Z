import { z } from 'zod';

export const loginSchema = z.object({
  correo: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

export const registroGimnasioSchema = z.object({
  nombreGimnasio: z
    .string()
    .min(3, 'El nombre del gimnasio debe tener al menos 3 caracteres'),
  telefono: z
    .string()
    .optional(),
  nombreAdmin: z
    .string()
    .min(3, 'El nombre del administrador debe tener al menos 3 caracteres'),
  correo: z
    .string()
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});
