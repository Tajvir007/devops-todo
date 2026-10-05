# DevOps Todo

Practice app for CI/CD, Docker, Terraform, Ansible, AWS.

## Run locally (Node 20 + Postgres)
    npm install
    npm test
    docker run -d --name pg -e POSTGRES_USER=todo -e POSTGRES_PASSWORD=todo -e POSTGRES_DB=todo -p 5432:5432 postgres:16
    npm start     # http://localhost:3000

## Endpoints
GET /health | GET /ready | GET /metrics | GET/POST /api/todos | PATCH /api/todos/:id/toggle | DELETE /api/todos/:id
