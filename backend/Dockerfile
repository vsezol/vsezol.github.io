# Build context: repo root (Railway root directory "/",
# dockerfilePath backend/Dockerfile — see railway.json at the repo root).

FROM python:3.12-slim

RUN pip install --no-cache-dir uv

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/app ./app

EXPOSE 8000
CMD uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
