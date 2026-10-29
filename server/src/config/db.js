import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bcf',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Check if XAMPP socket exists if connecting via 127.0.0.1 fails
const pool = mysql.createPool(dbConfig);

// Helper to test connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] Successfully connected to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[MySQL] Database connection failed:', error.message);
    return false;
  }
};

export default pool;
