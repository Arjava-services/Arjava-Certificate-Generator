# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies (fonts, poppler/mupdf essentials)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    libmupdf-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/app ./app
COPY backend/data ./data

# Copy built frontend assets into static distribution folder
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist

# Create upload and data directories
RUN mkdir -p /app/uploads/templates /app/uploads/generated /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
