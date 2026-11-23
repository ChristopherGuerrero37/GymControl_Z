import { z } from 'zod';

const duiRegex = /^\d{8}-\d{1}$/;

export const socioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del socio es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  dui: z
    .string({ required_error: 'El número de DUI es obligatorio' })
    .trim()
    .regex(duiRegex, 'El DUI debe tener el formato 00000000-0'),
  telefono: z
    .string()
    .trim()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  planId: z
    .number({ required_error: 'Debe seleccionar un plan de membresía' })
    .int()
    .positive('Identificador de plan inválido'),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional()
});

export const renovarPlanSchema = z.object({
  planId: z
    .number({ required_error: 'Debe seleccionar un plan de membresía para la renovación' })
    .int()
    .positive('Identificador de plan inválido')
});
