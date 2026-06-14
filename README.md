# Study App

React frontend and Express/Prisma backend for the study quiz app.

## Production Setup

### Backend environment

Create the backend environment variables from `backend/.env.example`.

Required in production:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: long random secret used to sign auth tokens
- `CORS_ORIGIN`: comma-separated frontend origins allowed to call the API
- `NODE_ENV=production`
- `PORT`: backend port, if your host does not provide one

### Frontend environment

Create the frontend environment variables from `frontend/.env.example`.

- `VITE_API_URL`: public backend API origin, for example `https://api.example.com`

### Build

```bash
npm install
npm run build
```

This builds:

- backend TypeScript into `backend/dist`
- frontend static assets into `frontend/dist`

### Database migration

Run migrations against the production database before starting the backend:

```bash
npm run migrate:deploy
```

Seed demo quiz data only when you intentionally want sample data in that environment:

```bash
npm run seed
```

### Start backend

```bash
npm run start
```

The API exposes:

- `GET /`: basic API status
- `GET /health`: database-backed health check

### Static frontend hosting

Deploy `frontend/dist` to your static host. Set `VITE_API_URL` before building so the frontend points at the production backend.

## Local Development

```bash
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies `/api` to the backend on `http://localhost:4000`.
