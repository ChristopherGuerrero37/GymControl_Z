import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import planesRoutes from './routes/planes.js';
import sociosRoutes from './routes/socios.js';
import clasesRoutes from './routes/clases.js';
import promocionesRoutes from './routes/promociones.js';
import socioPublicoRoutes from './routes/socioPublico.js';
import dashboardRoutes from './routes/dashboard.js';
import { probarConexion } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Probar conexión a la base de datos al arrancar
probarConexion();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/socios', sociosRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/public/socios', socioPublicoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de estado general
app.get('/api/salud', (req, res) => {
  res.json({
    estado: 'ok',
    mensaje: 'API de GymControl Z funcionando correctamente'
  });
});

// Middleware para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware para manejo de errores global (500)
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
