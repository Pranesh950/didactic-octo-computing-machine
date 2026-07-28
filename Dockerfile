# StartupWiki Terminal — Railway / Cloud Run Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install setuptools first (needed for pip install .)
RUN pip install --no-cache-dir setuptools wheel

COPY backend/ .

RUN pip install --no-cache-dir .

# Railway injects PORT at runtime; default 8000 for local dev
ENV PORT=8000

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
