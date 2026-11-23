import { z } from 'zod';

export const claseSchema = z.object({
  nombreClase: z
    .string({ required_error: 'El nombre de la clase es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  coach: z
    .string({ required_error: 'El nombre del coach/entrenador es obligatorio' })
    .trim()
    .min(3, 'El nombre del coach debe tener al menos 3 caracteres')
    .max(100, 'El nombre del coach no puede exceder los 100 caracteres'),
  fechaHora: z
    .string({ required_error: 'La fecha y hora son obligatorias' })
    .trim()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'La fecha y hora deben ser una fecha válida'
    }),
  cupoMaximo: z
    .number({ required_error: 'El cupo máximo es obligatorio' })
    .int('El cupo máximo debe ser un número entero')
    .positive('El cupo máximo debe ser mayor a 0')
    .max(200, 'El cupo máximo no puede exceder 200 personas')
});

export const inscribirSocioManualSchema = z.object({
  socioId: z
    .number({ required_error: 'El ID del socio es obligatorio' })
    .int()
    .positive('ID de socio no válido')
});

export const asistenciaSchema = z.object({
  asistio: z.boolean({ required_error: 'El estado de asistencia es obligatorio' })
});
