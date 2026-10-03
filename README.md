# Certificate Generator 🎓

> **Automated Bulk Certificate Generation Studio from Google Sheets**  
> Built with **React**, **FastAPI**, **PyMuPDF**, and **Pillow**, ready for **Hostinger VPS** deployment.

---

## 🌟 Overview

**Certificate Generator** is an automated web application that bridges **certificate design templates** (PDF, PNG, JPG) with **Google Sheets participant data**. It extracts placeholders, facilitates visual column mapping, provides live row-by-row certificate previews with validation, and batch-generates personalized certificates (PDF, PNG, JPG) with individual and ZIP bulk download options.

---

## ✨ Features (V1)

- 📊 **Interactive Dashboard**: Create, view, open, and delete certificate projects with generation stats and timestamps.
- 🎨 **Multi-Format Template Support**: Upload PDF, PNG, or JPG templates with auto-detection of `{{name}}`, `{{competition}}`, `{{year}}`, and `{{position}}` placeholders.
- 🔗 **Google Sheets API & Public Link Integration**: Connect Google Sheets via URL or Google Sheets API v4 with tab selector, header reader, and instant 1-click Demo data.
- 🗺️ **Visual Field Mapping & Typography Studio**: Map placeholders to columns with live interactive positioning canvas, font size slider, color picker, and text alignment.
- 👁️ **Live Row-by-Row Certificate Preview**: Carousel through participants (`1 / 250`, Previous, Next, search) with live rendered certificate previews before batch generation.
- 🛡️ **Pre-Generation Data Validation**: Scans for missing participant names, empty rows, duplicate records, and missing required columns.
- ⚡ **Background Batch Processing & Live Progress**: Non-blocking asynchronous generator with real-time percentage (`72%`, `180 / 250`), confetti completion, and error isolation.
- 📦 **Individual & ZIP Bulk Downloads**: Download single certificates or all certificates in a clean `certificates.zip`.
- 🏷️ **Customizable File Naming**: Pattern templating like `{{name}}_Certificate_{{year}}.pdf` with filesystem sanitization.
- 🚀 **Hostinger Server / VPS Ready**: Native Systemd service, Nginx reverse proxy, and Docker / Docker Compose configurations included.

---

## 🏗️ Architecture & Project Structure

```text
CG-Web/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── certificates.py    # Download single/bulk ZIP endpoints
│   │   │       ├── generate.py        # Background task & single preview
│   │   │       ├── mappings.py        # Field mapping persistence
│   │   │       ├── projects.py        # Project CRUD & stats
│   │   │       ├── sheets.py          # Google Sheets connection & validation
│   │   │       └── templates.py       # Template upload & preview rendering
│   │   ├── config/
│   │   │   └── settings.py            # Pydantic environment settings
│   │   ├── models/
│   │   │   ├── database.py            # SQLAlchemy engine & session factory
│   │   │   └── entities.py            # User, Project, FieldMapping, Certificate, Job
│   │   ├── repositories/
│   │   │   └── project_repo.py        # Database access layer
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── certificate_generator_service.py # Core PDF/PNG/JPG generator
│   │   │   ├── google_sheets_service.py         # Google Sheets API v4 & export fallback
│   │   │   ├── template_service.py              # PyMuPDF & Pillow placeholder detection
│   │   │   ├── validation_service.py            # Row validation engine
│   │   │   └── zip_service.py                   # Archive packaging service
│   │   └── main.py                    # FastAPI application entrypoint
│   ├── data/                          # SQLite DB and sample templates
│   ├── uploads/                       # Uploaded templates & generated certificates
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── FieldMappingStep.tsx   # Column mapping & typography controls
│   │   │   ├── GenerateStep.tsx       # Progress bar & download table
│   │   │   ├── GoogleSheetStep.tsx    # Sheet URL & tab picker
│   │   │   ├── PreviewValidationStep.tsx # Live preview & row validation
│   │   │   ├── ProjectModal.tsx       # Project creation modal
│   │   │   └── TemplateCanvas.tsx     # Interactive drag-and-drop canvas
│   │   ├── layouts/
│   │   │   └── Navbar.tsx             # App header & breadcrumb navigation
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx      # Projects overview & metrics
│   │   │   └── ProjectWorkspacePage.tsx # 5-step wizard workspace
│   │   ├── services/
│   │   │   └── api.ts                 # Typed fetch client
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript models
│   │   ├── App.tsx
│   │   ├── index.css                  # Custom design system & glassmorphism
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── deploy/
    ├── Dockerfile                     # Multi-stage production container
    ├── docker-compose.yml             # One-command Docker launch
    ├── nginx.conf                     # Nginx reverse proxy configuration
    ├── certificate-generator.service  # Systemd service unit for Hostinger VPS
    └── deploy.sh                      # Automated VPS deployment script
```

---

## 🚀 Local Development Setup

### 1. Backend

```bash
cd backend

# Create virtual environment (Python 3.10+)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Generate sample certificate templates
python generate_samples.py

# Launch FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be accessible at:  
- **API**: http://127.0.0.1:8000  
- **Interactive Swagger Docs**: http://127.0.0.1:8000/docs  

---

### 2. Frontend

```bash
cd frontend

# Install node dependencies
npm install

# Start Vite dev server (proxies /api to localhost:8000)
npm run dev
```

Frontend will be accessible at: **http://localhost:5173**

---

## 🔑 Google Sheets Configuration

The application supports three ways to connect to Google Sheets:

### Option A: Public Google Sheet Link (Zero-Config)
1. Open your Google Sheet.
2. Click **Share** → Set to **"Anyone with the link can view"**.
3. Paste the URL into the application.

### Option B: Google Cloud Service Account (Recommended for Private Sheets)
1. In Google Cloud Console, create a Service Account with the **Google Sheets API** enabled.
2. Download the JSON key file.
3. Configure `backend/.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/service-account.json
   ```
4. Share your private Google Sheet with the service account email (e.g. `cert-bot@project.iam.gserviceaccount.com`).

### Option C: Instant Demo Mode
- Click the **"Load Demo Participant Sheet"** button inside the workspace to test immediately with 8 built-in participant rows.

---

## 🌐 Deploying to Hostinger Server / VPS

### Method A: Native Hostinger VPS (Ubuntu / Debian)

1. **Clone repository onto VPS**:
   ```bash
   sudo mkdir -p /var/www/certgen
   sudo git clone <your-repo-url> /var/www/certgen
   cd /var/www/certgen
   ```

2. **Run automated deployment script**:
   ```bash
   chmod +x deploy/deploy.sh
   ./deploy/deploy.sh
   ```

3. **Configure Nginx domain**:
   - Edit `/etc/nginx/sites-available/certgen` and replace `yourdomain.com` with your actual domain or VPS IP.
   - Reload Nginx: `sudo systemctl restart nginx`

4. **Add SSL (Free Let's Encrypt)**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

### Method B: Docker & Docker Compose on Hostinger VPS

1. **Install Docker on your Hostinger VPS**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   sudo apt-get install -y docker-compose-plugin
   ```

2. **Launch with Docker Compose**:
   ```bash
   cd /var/www/certgen/deploy
   docker compose up -d --build
   ```

3. **Check status**:
   ```bash
   docker compose logs -f
   ```

The app will be live on port `8000`, ready for Nginx reverse proxying or direct domain mapping!

---

## 🔒 Security Best Practices Implemented

- **No Secrets in Frontend**: Google API credentials, database connections, and service accounts remain strictly on the backend.
- **Upload Validation**: File extension allowlist (`.pdf`, `.png`, `.jpg`, `.jpeg`) and 25MB file size limits strictly enforced.
- **Filename Sanitization**: Replaces directory traversal characters, backslashes, and shell delimiters with safe alphanumeric identifiers.
- **Error Obfuscation**: Production exceptions are trapped and returned as structured JSON messages without exposing internal stack traces.

---

## 📄 License
MIT License. Built for seamless high-performance certificate automation.
