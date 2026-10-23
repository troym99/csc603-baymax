require('dotenv').config();
const { Pool } = require('pg');

// Set DATABASE_SSL=true when connecting to AWS RDS (or most hosted Postgres).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error', err);
});

// Always use parameterized queries: query('SELECT * FROM users WHERE id = $1', [id])
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
