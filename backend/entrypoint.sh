#!/bin/bash
set -e

# Get port from environment or use default
PORT=${PORT:-8080}

# Run gunicorn
exec gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120

