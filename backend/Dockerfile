# Multi-stage Dockerfile for Flask Backend
# Stage 1: Build dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder and install gunicorn globally
COPY --from=builder /root/.local /root/.local

# Install gunicorn globally to ensure it's in PATH
RUN pip install --no-cache-dir gunicorn==21.2.0

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:/usr/local/bin:$PATH

# Verify gunicorn is accessible
RUN which gunicorn || echo "Gunicorn not found in PATH"

# Copy application code
COPY . .

# Copy and make entrypoint script executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create data directory for SQLite (if needed)
RUN mkdir -p data

# Expose port (Koyeb will set PORT env variable)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, os; port = os.getenv('PORT', '8080'); urllib.request.urlopen(f'http://localhost:{port}/api/health')" || exit 1

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

