/**
 * Kezdobarat magyarazat:
 * Fajl: backend/sql/database.js
 * Szerep: Kozos MySQL kapcsolatpool es parameteres execute helper a teljes backendhez.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import mysql from "mysql2/promise";

// A pool ujrahasznalja a kapcsolatokat, igy minden lekereshez nem kell uj DB-kapcsolatot nyitni.
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export function execute(query, values = []) {
  // A kulso kod altalaban ezt a rovid helper-t hivja, nem kozvetlenul a poolt.
  return pool.execute(query, values);
}
