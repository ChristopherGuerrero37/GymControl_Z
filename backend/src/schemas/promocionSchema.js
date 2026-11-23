import { z } from 'zod';

export const promocionSchema = z.object({
  titulo: z
    .string({ required_error: 'El título de la promoción es obligatorio' })
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .trim()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  descuento: z
    .string({ required_error: 'El beneficio o descuento es obligatorio' })
    .trim()
    .min(2, 'El descuento debe tener al menos 2 caracteres')
    .max(50, 'El descuento no puede exceder 50 caracteres'),
  fechaFin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin debe tener formato YYYY-MM-DD')
    .optional()
    .nullable()
    .or(z.literal('')),
  activa: z.boolean().optional().default(true)
});
