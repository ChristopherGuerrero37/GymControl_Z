import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexiones para consultas optimizadas y no bloqueantes
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gymcontrol_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper opcional para probar conexión
export async function probarConexion() {
  try {
    const conexion = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MySQL');
    conexion.release();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
  }
}
