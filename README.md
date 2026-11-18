# Droit-Facile

## Run locally without Docker

Start PostgreSQL locally with the database `droitfacile`, user `postgres`, and password `postgres`.

Run the backend from IntelliJ using `backend/src/main/java/com/droitfacile/DroitFacileApplication.java`.
It listens on `http://localhost:8081`.

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run the full stack with Docker Compose

Stop the IntelliJ backend and local Vite server first, then run from the repository root:

```powershell
docker compose up --build -d
```

Open `http://localhost:5173`.

The Compose services use the internal database hostname `db`. PostgreSQL is exposed to the host on port `5433` so it can run beside a local PostgreSQL service on port `5432`.

View logs or stop the stack:

```powershell
docker compose logs -f
docker compose down
```
