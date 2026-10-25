const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./pool');

async function createAdmin() {
  const hash = await bcrypt.hash('admin123', 12);

  await query("DELETE FROM users WHERE email = 'admin@nova.app'");
  await query(
    `INSERT INTO users (id, email, password_hash, display_name, email_verified, is_active, created_at, updated_at)
     VALUES ($1, 'admin@nova.app', $2, 'Admin', 1, 1, datetime('now'), datetime('now'))`,
    [uuidv4(), hash]
  );

  await query("UPDATE users SET password_hash = $1, is_active = 1 WHERE email = 'test@nova.app'", [hash]);

  console.log('✅ Admin user created/updated successfully:');
  console.log('   Email:    admin@nova.app');
  console.log('   Password: admin123');
  console.log('   Also test@nova.app password set to admin123');
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
