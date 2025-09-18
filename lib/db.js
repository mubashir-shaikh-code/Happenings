// lib/db.js
import mysql from 'mysql2/promise';

// Hardcoded DB config
const pool = mysql.createPool({
  host: 'localhost',       // your DB host
  user: 'root',            // your DB username
  password: '',            // your DB password
  database: 'test_db',     // your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
 export default pool;
// Example query usage:
// const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
