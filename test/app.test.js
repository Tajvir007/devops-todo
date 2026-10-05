const request = require('supertest');
const { createApp } = require('../src/app');

// In-memory fake store: tests need no database, so CI stays fast
function fakeStore() {
  let id = 0, rows = [];
  return {
    ping: async () => {},
    list: async () => rows,
    create: async (title) => { const r = { id: ++id, title, done: false }; rows.push(r); return r; },
    toggle: async (i) => { const r = rows.find(x => x.id === i); if (r) r.done = !r.done; return r; },
    remove: async (i) => { const n = rows.length; rows = rows.filter(x => x.id !== i); return rows.length < n; },
  };
}

describe('todo api', () => {
  const app = createApp(fakeStore());
  test('health', async () => { expect((await request(app).get('/health')).body.status).toBe('ok'); });
  test('ready', async () => { expect((await request(app).get('/ready')).status).toBe(200); });
  test('create + list', async () => {
    await request(app).post('/api/todos').send({ title: 'learn docker' }).expect(201);
    const res = await request(app).get('/api/todos');
    expect(res.body[0].title).toBe('learn docker');
  });
  test('validation', async () => { await request(app).post('/api/todos').send({}).expect(400); });
  test('toggle + delete', async () => {
    await request(app).patch('/api/todos/1/toggle').expect(200);
    await request(app).delete('/api/todos/1').expect(204);
    await request(app).delete('/api/todos/1').expect(404);
  });
});
