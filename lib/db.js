import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",     // or 127.0.0.1
  user: "root",          // your MySQL username
  password: "",          // leave empty if no password
  database: "test_db",   // your phpMyAdmin DB name
  port: 3306,            // default MySQL port
});

export default pool;
