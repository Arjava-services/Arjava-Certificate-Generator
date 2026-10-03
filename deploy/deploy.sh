#!/usr/bin/env bash
# ==============================================================================
# Certificate Generator - Hostinger VPS Deployment Script
# ==============================================================================
set -e

APP_DIR="/var/www/certgen"
echo "==> Starting deployment at ${APP_DIR}..."

# 1. Update system dependencies
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv nginx curl

# 2. Setup backend virtual environment
echo "==> Setting up backend Python virtual environment..."
cd "${APP_DIR}/backend"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Create required runtime directories
mkdir -p "${APP_DIR}/backend/uploads/templates"
mkdir -p "${APP_DIR}/backend/uploads/generated"
mkdir -p "${APP_DIR}/backend/data"
sudo chown -R www-data:www-data "${APP_DIR}/backend/uploads" "${APP_DIR}/backend/data"

# 4. Build Frontend
echo "==> Building React frontend..."
cd "${APP_DIR}/frontend"
npm install
npm run build

# 5. Setup Systemd Service
echo "==> Installing systemd service..."
sudo cp "${APP_DIR}/deploy/certificate-generator.service" /etc/systemd/system/certgen.service
sudo systemctl daemon-reload
sudo systemctl enable certgen
sudo systemctl restart certgen

# 6. Setup Nginx Configuration
echo "==> Configuring Nginx..."
if [ ! -f /etc/nginx/sites-available/certgen ]; then
    sudo cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/certgen
    sudo ln -s /etc/nginx/sites-available/certgen /etc/nginx/sites-enabled/ || true
    sudo nginx -t
    sudo systemctl restart nginx
fi

echo "=============================================================================="
echo " Deployment Complete! Certificate Generator is running."
echo " Check status with: sudo systemctl status certgen"
echo "=============================================================================="
