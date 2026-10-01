# CI/CD TestFlow

A small, real FastAPI + React app built to demonstrate **software testing and CI/CD**: Pytest, REST APIs, Docker, Git, and GitHub Actions.

**Stack:** Python 3.12 · FastAPI · Pytest · React + TypeScript + Vite + Tailwind · Docker · GitHub Actions

## Architecture

One Docker image. A multi-stage build compiles the React frontend, then a slim Python image runs FastAPI, which serves both the API and the built UI on port 8000. No separate frontend container is needed.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{"status": "healthy"}` |
| GET | `/items` | List items |
| POST | `/items` | Create item (`name` required) → 201 |
| GET | `/items/{id}` | Get item, 404 if missing |
| GET | `/pipeline/status` | CI/CD info (`APP_ENV` sets environment) |

Interactive docs: http://localhost:8000/docs

## Run locally

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload                        # http://localhost:8000

# Frontend (second terminal)
cd frontend
npm install
npm run dev                                          # http://localhost:5173 (proxies API to :8000)
```

## Tests

```bash
cd backend
pytest -v
```

### Demonstrating a FAILING test
In `backend/app/main.py`, change `"status": "passing"` to `"status": "failing"` in `pipeline_status`, then run `pytest -v`: `test_pipeline_status` fails. Push that to a branch and open a pull request to see the GitHub Actions run go red and the Docker build job get skipped. Revert it and the run goes green.

## Docker

```bash
docker build -t cicd-testflow .
docker run --rm -p 8000:8000 cicd-testflow           # http://localhost:8000
```

## CI/CD (`.github/workflows/ci-cd.yml`)

Triggers: push to `main`, pull request to `main`, manual (`workflow_dispatch`).

1. **test**: checkout → setup Python → install → `pytest -v` (workflow fails if any test fails)
2. **build**: builds the Docker image (needs `test`)
3. **deploy**: on `main` only, pushes the image to **GitHub Container Registry** as `ghcr.io/<owner>/<repo>:latest` and `:<sha>`

### Deployment setup
- **GHCR publish** needs no secrets; it uses the built-in `GITHUB_TOKEN`. If the push is denied, enable *Settings → Actions → General → Workflow permissions → Read and write*.
- **Optional hosted deploy (Render):** create a Web Service from the GHCR image (or this repo's Dockerfile), copy its Deploy Hook URL, and add it as the repository secret `RENDER_DEPLOY_HOOK_URL` (*Settings → Secrets and variables → Actions*). If the secret is absent, that step is skipped.
- No credentials are stored in the repo.

## Structure

```
backend/app/main.py        FastAPI app
backend/tests/test_api.py  Pytest suite (TestClient)
frontend/                  React + TS + Tailwind UI
Dockerfile                 multi-stage build
.github/workflows/ci-cd.yml
```
