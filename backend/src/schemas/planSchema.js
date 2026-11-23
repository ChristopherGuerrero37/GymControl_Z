import { z } from 'zod';

export const planSchema = z.object({
  nombrePlan: z
    .string({ required_error: 'El nombre del plan es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  duracionDias: z
    .number({ required_error: 'La duración en días es obligatoria' })
    .int('La duración en días debe ser un número entero')
    .positive('La duración debe ser mayor a 0 días'),
  precio: z
    .number({ required_error: 'El precio es obligatorio' })
    .positive('El precio debe ser mayor a 0')
    .max(9999.99, 'El precio excede el límite permitido'),
  activo: z
    .boolean()
    .optional()
    .default(true)
});
