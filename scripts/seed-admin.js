require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'db-farmacia',
  });

  await client.connect();

  try {
    // Ensure admin role exists (id_role = 2)
    const roleRes = await client.query('SELECT id_role FROM roles WHERE id_role = $1', [2]);
    if (roleRes.rowCount === 0) {
      await client.query("INSERT INTO roles (id_role, name, is_deleted) VALUES ($1, $2, false)", [2, 'admin']);
      console.log('Inserted admin role');
    } else {
      console.log('Admin role exists');
    }

    const username = process.env.SEED_ADMIN_USER || process.env.ADMIN_USER || 'admin'
    const password = process.env.SEED_ADMIN_PASS || process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '123456'
    const email = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com'
    const name = process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME || 'Admin'
    const hash = await bcrypt.hash(password, 10);

    const userRes = await client.query('SELECT id_user FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    if (userRes.rowCount > 0) {
      await client.query(
        `UPDATE users
           SET password = $1,
               is_active = true,
               is_deleted = false
         WHERE id_user = $2`,
        [hash, userRes.rows[0].id_user]
      );
      console.log('Admin user already exists, password updated and account reactivated');
    } else {
      await client.query(
        `INSERT INTO users (id_role, name, email, username, password, is_active, is_deleted)
         VALUES ($1,$2,$3,$4,$5,true,false)`,
        [2, name, email, username, hash]
      );
      console.log('Admin user created:', username);
      console.log('Use this password to login (change after first login):', password);
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await client.end();
  }
}

seed();
