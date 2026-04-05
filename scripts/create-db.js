require('dotenv').config();
const { Client } = require('pg');

async function ensureDatabase() {
  const targetDb = process.env.DB_NAME || 'db-farmacia';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres',
  });

  try {
    await client.connect();
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);

    if (exists.rowCount > 0) {
      console.log(`La base "${targetDb}" ya existe.`);
      return;
    }

    const safeName = targetDb.replace(/"/g, '""');
    await client.query(`CREATE DATABASE "${safeName}"`);
    console.log(`Base creada: "${targetDb}"`);
  } finally {
    await client.end();
  }
}

ensureDatabase().catch((error) => {
  console.error('No se pudo crear la base de datos:', error.message);
  process.exit(1);
});
