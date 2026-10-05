const { Pool } = require('pg');
const { createStore } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
// Config from env vars (12-factor) -> works with Docker, Ansible, Terraform, AWS
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'todo',
        password: process.env.DB_PASSWORD || 'todo',
        database: process.env.DB_NAME || 'todo',
      }
);
const store = createStore(pool);

async function start() {
  // Retry: DB container may start after the app
  for (let i = 1; i <= 10; i++) {
    try { await store.init(); break; }
    catch (e) {
      console.error(`DB not ready (attempt ${i}/10): ${e.message}`);
      if (i === 10) process.exit(1);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  const server = createApp(store).listen(PORT, () => console.log(`Listening on :${PORT}`));

  // Graceful shutdown for docker stop / rolling deploys
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down');
    server.close(async () => { await pool.end(); process.exit(0); });
  });
}
start();
