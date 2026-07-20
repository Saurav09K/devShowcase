# DevShowcase

DevShowcase is a MERN-style portfolio platform for uploading and presenting developer projects with video demos. The project includes a React frontend, an Express/Prisma backend, and a separate distributed storage layer that accepts chunked uploads across multiple storage nodes.

## What It Does

- User registration and login with JWT-based authentication
- Create portfolio projects with title, description, tech stack, GitHub URL, and live URL
- Upload large demo videos in chunks
- Distribute uploaded chunks across multiple storage nodes
- Resume interrupted uploads by checking which chunks already exist
- Merge stored chunks into a final video on the main backend
- Queue thumbnail generation with BullMQ and Redis
- Serve uploaded videos and generated thumbnails

## Architecture

The repository is split into three apps:

- `frontend` - React + Vite UI
- `backend` - Main API, Prisma models, upload coordination, and thumbnail job queue
- `storage-node` - Lightweight chunk storage service used by multiple nodes

High-level upload flow:

1. The frontend initializes an upload session from the backend.
2. The file is split into 5 MB chunks in the browser.
3. The backend forwards each chunk to one of the storage nodes.
4. Chunk placement is tracked in PostgreSQL through Prisma.
5. When all chunks arrive, the backend downloads and merges them into a final video.
6. A BullMQ worker generates a thumbnail for the uploaded video.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT, BullMQ, Redis, Multer
- Media processing: FFmpeg via `fluent-ffmpeg` and `@ffmpeg-installer/ffmpeg`
- Infrastructure: Docker Compose, Redis, multi-node storage services

## Repository Structure

```text
devShowcase/
|-- frontend/
|-- backend/
|   |-- prisma/
|   `-- src/
|-- storage-node/
`-- docker-compose.yml
```

## Prerequisites

Make sure these are installed before running the project:

- Node.js 18+
- npm
- PostgreSQL
- Redis
- Docker Desktop and Docker Compose for containerized runs

## Environment Variables

The backend expects a `.env` file inside `backend/`.

Example `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/devshowcase
JWT_SECRET=your_jwt_secret_here
REDIS_URL=redis://localhost:6379
NODE_A_URL=http://localhost:5001
NODE_B_URL=http://localhost:5002
NODE_C_URL=http://localhost:5003
```

The storage node can run without a `.env` file because Docker Compose already injects:

- `PORT`
- `NODE_ID`
- `STORAGE_PATH`

## Local Development Setup

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../storage-node && npm install
```

### 2. Create the backend environment file

Add `backend/.env` using the example above.

### 3. Set up the database

From `backend/`:

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start Redis

If Redis is installed locally:

```bash
redis-server
```

Or run it with Docker:

```bash
docker run -p 6379:6379 redis:7-alpine
```

### 5. Start the storage nodes

Open three terminals from `storage-node/` and run:

```bash
npm run dev
```

The current code expects three storage services reachable at:

- `http://localhost:5001`
- `http://localhost:5002`
- `http://localhost:5003`

If you run them manually, set different values for `PORT`, `NODE_ID`, and `STORAGE_PATH` in each terminal session.

Example:

```bash
PORT=5001 NODE_ID=node-a STORAGE_PATH=./data/node-a npm run dev
PORT=5002 NODE_ID=node-b STORAGE_PATH=./data/node-b npm run dev
PORT=5003 NODE_ID=node-c STORAGE_PATH=./data/node-c npm run dev
```

### 6. Start the backend API

From `backend/`:

```bash
npm run dev
```

### 7. Start the thumbnail worker

From `backend/` in another terminal:

```bash
node src/workers/thumbnail.worker.js
```

### 8. Start the frontend

From `frontend/`:

```bash
npm run dev
```

The frontend currently calls the backend directly at `http://localhost:5000`.

## Docker Compose

The repository includes a `docker-compose.yml` that starts:

- `main-api`
- `redis`
- `thumbnail-worker`
- `node-a`
- `node-b`
- `node-c`

Run:

```bash
docker compose up --build
```

Important note:

- The current Compose file does not define a PostgreSQL service.
- You still need a running PostgreSQL instance and a valid `backend/.env` file.

## Core API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/upload/init`
- `POST /api/upload/chunk`
- `POST /api/upload/complete`
- `GET /api/upload/status/:uploadId`
- `GET /api/videos/stream/:videoId`

## Current Frontend Flow

1. Register or log in.
2. Create a project.
3. Go to the upload page.
4. Select the target project.
5. Upload a demo video in chunks.
6. Let the backend merge the file and queue thumbnail generation.

## Known Limitations

- The frontend uses hardcoded backend URLs pointing to `http://localhost:5000`.
- Docker Compose does not currently provision PostgreSQL.
- There are no automated tests configured yet.
- Local manual storage-node startup on Windows may require setting env vars differently than the inline Unix-style examples above.

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
npm run dev
npm start
```

### Storage Node

```bash
npm run dev
npm start
```

## Future Improvements

- Add PostgreSQL to `docker-compose.yml`
- Move frontend API URLs to environment variables
- Add upload retry/backoff and better failure reporting
- Add automated tests for upload, merge, and auth flows
- Add deployment documentation
