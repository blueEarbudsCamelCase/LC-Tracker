# LC-Tracker
Tracker made for keeping track of LC zone usage per student over a long period of time.
Backend scaffold added under `backend/` with Docker Compose.

Quick start (requires Docker):

```bash
# from repository root
docker compose up --build
# in another shell, run migrations against the running backend container
docker compose exec backend npm run migrate
```

The backend exposes a simple REST API on port 4000. See `backend/src/index.js` for routes.
