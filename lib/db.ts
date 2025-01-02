import mysql from 'mysql2/promise'

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function query(sql: string, values: unknown[] = []) {
  console.log('Executing SQL query:', sql)
  console.log('Query parameters:', values)
  
  try {
    const [rows] = await pool.execute(sql, values)
    console.log('Query result:', rows)
    return rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}
