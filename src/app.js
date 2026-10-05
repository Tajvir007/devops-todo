const express = require('express');
const path = require('path');

function createApp(store) {
  const app = express();
  const startedAt = Date.now();
  let requests = 0;

  app.use(express.json());
  app.use((req, res, next) => {
    requests++;
    console.log(JSON.stringify({ t: new Date().toISOString(), method: req.method, url: req.url }));
    next();
  });
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Liveness: process is up (Docker HEALTHCHECK / ALB)
  app.get('/health', (req, res) => res.json({ status: 'ok', uptime_s: Math.floor((Date.now() - startedAt) / 1000) }));

  // Readiness: dependencies (DB) reachable
  app.get('/ready', async (req, res) => {
    try { await store.ping(); res.json({ status: 'ready' }); }
    catch (e) { res.status(503).json({ status: 'db_unavailable' }); }
  });

  // Prometheus-style metrics for monitoring practice
  app.get('/metrics', (req, res) => {
    res.type('text/plain').send(`app_requests_total ${requests}\napp_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}\n`);
  });

  app.get('/api/todos', async (req, res, next) => {
    try { res.json(await store.list()); } catch (e) { next(e); }
  });
  app.post('/api/todos', async (req, res, next) => {
    try {
      const title = (req.body.title || '').trim();
      if (!title) return res.status(400).json({ error: 'title required' });
      res.status(201).json(await store.create(title));
    } catch (e) { next(e); }
  });
  app.patch('/api/todos/:id/toggle', async (req, res, next) => {
    try {
      const todo = await store.toggle(Number(req.params.id));
      todo ? res.json(todo) : res.status(404).json({ error: 'not found' });
    } catch (e) { next(e); }
  });
  app.delete('/api/todos/:id', async (req, res, next) => {
    try {
      (await store.remove(Number(req.params.id))) ? res.status(204).end() : res.status(404).json({ error: 'not found' });
    } catch (e) { next(e); }
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  });
  return app;
}
module.exports = { createApp };
