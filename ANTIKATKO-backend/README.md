# ANTIKATKO — Backend API

Production-ready Django REST Framework backend for **ANTIKATKO**, a bilingual (Arabic/English) e-commerce platform specializing in vintage furniture, antiques, and handcrafted home decorations.

---

## 🛠 Tech Stack

- **Framework:** Python 3.14+, Django 5.2+, Django REST Framework 3.18+
- **Database:** PostgreSQL (with `psycopg` 3.x driver)
- **Authentication:** JWT via `djangorestframework-simplejwt` (Access & Refresh tokens, rotation & blacklist)
- **API Documentation:** OpenAPI 3.0, Swagger UI, and ReDoc via `drf-spectacular`
- **Filtering & Search:** `django-filter`, DRF search & ordering filters
- **Media & Processing:** `Pillow` for image validation and handling
- **Reporting & Exports:** `openpyxl` (Excel exports), `reportlab` (PDF exports)
- **Environment Management:** `python-dotenv`

---

## 📂 Project Architecture

```
ANTIKATKO-backend/
├── apps/
│   ├── accounts/       # Custom User model, Customer/Admin auth, JWT
│   ├── customers/      # Customer profiles, admin customer CRM
│   ├── catalog/        # Categories & Products (bilingual), image handling
│   ├── cart/           # Authenticated customer cart
│   ├── wishlist/       # Customer wishlist with duplicate prevention
│   ├── inventory/      # Stock tracking, atomic deduction/restoration, logs
│   ├── orders/         # Orders, snapshots, server-side pricing & checkout
│   ├── payments/       # Payment records (Vodafone Cash, InstaPay, COD)
│   ├── dashboard/      # Admin analytics, sales metrics, low stock alerts
│   └── reports/        # Sales, order, customer reports (Excel/PDF)
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── common/             # Shared permissions, pagination, exceptions, responses, utils
├── docs/               # Architecture, analysis, endpoint plan, integration guides
├── tests/              # Test suites across all apps
├── media/              # Uploaded media assets
├── static/             # Static files
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Environment Setup

#### Windows PowerShell:
```powershell
cd "d:\S&M Apps\ANTIKATKO-backend"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### Windows Command Prompt (CMD):
```cmd
cd "d:\S&M Apps\ANTIKATKO-backend"
py -m venv .venv
.venv\Scripts\activate.bat
```

#### Linux / macOS:
```bash
cd ANTIKATKO-backend
python3 -m venv .venv
source .venv/bin/activate
```

#### Verify environment:
```bash
python --version
python -m pip --version
```

### 2. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy the example file and update with your credentials:
```bash
cp .env.example .env
```
Key variables:
- `DB_ENGINE`: `postgresql` (or `sqlite` for lightweight local testing)
- `DB_NAME`: `antikatko_db`
- `DB_USER`: `postgres`
- `DB_PASSWORD`: `your_password`
- `DB_HOST`: `localhost`
- `DB_PORT`: `5432`
- `SECRET_KEY`: Secure secret key
- `CORS_ALLOWED_ORIGINS`: Frontend URLs (e.g. `http://localhost:3000,http://localhost:5173`)

### 4. Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Initial Admin User
```bash
python manage.py createsuperuser
```

### 6. Run the Development Server
```bash
python manage.py runserver
```

---

## 📖 API Documentation & Swagger

When the server is running, explore interactive OpenAPI 3 documentation:
- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **ReDoc:** `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema (JSON):** `http://127.0.0.1:8000/api/schema/`

---

## 🧪 Running Tests
```bash
python manage.py test
```

---

## 🔒 Security & Data Integrity Highlights
- **Strict Role Isolation:** Only `Customer` and `Admin` accounts exist.
- **Server-Side Financials:** All subtotals, 100 EGP flat shipping, and order totals are calculated exclusively on the backend from verified database prices.
- **Race Condition Prevention:** Stock adjustments use database transactions and atomic deductions (`select_for_update()`).
- **Snapshot Integrity:** Historical orders retain frozen product details, prices, and bilingual names even if products are edited or deactivated later.
- **Independent Payments:** Payment status is managed independently from order status; choosing a payment method never auto-marks payments as Paid.
