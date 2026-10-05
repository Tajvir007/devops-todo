// PostgreSQL-backed store. Kept separate so tests can swap in a fake.
function createStore(pool) {
  return {
    async init() {
      await pool.query(`CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    },
    async ping() { await pool.query('SELECT 1'); },
    async list() { return (await pool.query('SELECT * FROM todos ORDER BY id')).rows; },
    async create(title) {
      return (await pool.query('INSERT INTO todos(title) VALUES($1) RETURNING *', [title])).rows[0];
    },
    async toggle(id) {
      return (await pool.query('UPDATE todos SET done = NOT done WHERE id=$1 RETURNING *', [id])).rows[0];
    },
    async remove(id) {
      return (await pool.query('DELETE FROM todos WHERE id=$1', [id])).rowCount > 0;
    },
  };
}
module.exports = { createStore };
