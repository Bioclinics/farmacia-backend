const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'farmacia',
  });

  await client.connect();

  try {
    // Ensure admin role exists (id_role = 2)
    const roleRes = await client.query('SELECT id_role FROM roles WHERE id_role = $1', [2]);
    if (roleRes.rowCount === 0) {
      await client.query("INSERT INTO roles (id_role, name, created_at, updated_at, is_deleted) VALUES ($1, $2, now(), now(), false)", [2, 'admin']);
      console.log('Inserted admin role');
    } else {
      console.log('Admin role exists');
    }

    const username = process.env.SEED_ADMIN_USER || 'admin'
    const password = process.env.SEED_ADMIN_PASS || 'Admin1234'
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
    const name = process.env.SEED_ADMIN_NAME || 'Admin'

    const userRes = await client.query('SELECT id_user FROM users WHERE username = $1', [username]);
    if (userRes.rowCount > 0) {
      console.log('Admin user already exists');
    } else {
      const hash = await bcrypt.hash(password, 10);
      await client.query(
        `INSERT INTO users (id_role, name, email, username, password, is_active, is_deleted, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,true,false, now(), now())`,
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
