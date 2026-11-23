/**
 * Middleware para validar el cuerpo de la petición con un esquema de Zod
 * @param {import('zod').ZodSchema} schema 
 */
export function validarSchema(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error.errors) {
        return res.status(400).json({
          error: 'Error de validación en los datos enviados',
          detalles: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensaje: err.message
          }))
        });
      }
      return res.status(400).json({ error: 'Datos no válidos' });
    }
  };
}
