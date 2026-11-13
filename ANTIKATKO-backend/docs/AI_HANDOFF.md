# ANTIKATKO Backend — AI Handoff & Technical Reference Manual

**Project Name:** ANTIKATKO Backend  
**Project Location:** `D:\S&M Apps\ANTIKATKO-backend`  
**Python Environment:** `D:\S&M Apps\ANTIKATKO-backend\.venv` (Python 3.14.7)  
**Django Version:** 5.2.19 | **DRF Version:** 3.18.3  
**Database:** SQLite (`db.sqlite3` for local development/testing) | PostgreSQL ready via `DB_ENGINE=postgresql`  
**Current State:** 100% Fully Implemented, Unit Tested (18/18 PASS), Live API Verified (66/66 PASS)  
**Last Updated:** November 7, 2026  

---

## 1. Project Directory Architecture

```
ANTIKATKO-backend/
├── .venv/                          # Virtual environment (Python 3.14.7)
├── common/                         # Shared utilities, permissions, pagination, exceptions
│   ├── exceptions.py               # Custom contract exception handler
│   ├── pagination.py               # StandardResultsSetPagination (contract enveloped)
│   ├── permissions.py              # IsAdminUserRole, IsCustomerUserRole, IsOwnerOrAdmin
│   ├── responses.py               # success_response(), error_response() helpers
│   └── utils.py                    # generate_order_number(), validate_image_file()
├── config/                         # Django project configuration
│   ├── settings/
│   │   ├── base.py                 # Core settings, all 14 apps registered, SimpleJWT config
│   │   ├── development.py          # CORS open, debug enabled
│   │   └── production.py           # Production security hardening
│   ├── asgi.py
│   ├── urls.py                     # Root routing, Swagger/ReDoc, /api/v1/...
│   └── wsgi.py
├── apps/                           # Modular domain applications (14 total)
│   ├── accounts/                   # Custom User (CUSTOMER, ADMIN), OTPVerification, Auth APIs
│   ├── customers/                  # CustomerProfile, CustomerAddress, Admin CRM
│   ├── catalog/                    # Category, Product, ProductImage, Django-Filter
│   ├── cart/                       # Cart, CartItem, server subtotal, guest cart sync
│   ├── wishlist/                   # WishlistItem, duplicate prevention
│   ├── inventory/                  # InventoryTransaction, atomic stock adjustment service
│   ├── orders/                     # Order, OrderItem snapshots, checkout, guest tokens
│   ├── payments/                   # Payment, PaymentProof, manual admin verification
│   ├── dashboard/                  # DashboardService KPIs, sales trends, low stock alerts
│   ├── reports/                    # ReportService Excel (.xlsx) and PDF (.pdf) exports
│   ├── contact/                    # ContactMessage submission and admin triage
│   ├── newsletter/                 # NewsletterSubscriber email capture
│   ├── store_settings/             # StoreSetting (shipping fees, contact numbers, wallet IDs)
│   └── notifications/              # Notification alerts and read receipts
├── docs/                           # Architecture specifications & project documentation
│   ├── AI_HANDOFF.md               # This handoff and reference manual
│   ├── API_ENDPOINTS_PLAN.md       # Complete 75-endpoint API specification matrix
│   ├── DATABASE_DESIGN.md          # Full relational database ERD & table schema
│   ├── IMPLEMENTATION_STATUS.md    # Phase-by-phase completion log
│   ├── PROJECT_AUDIT.md            # Initial codebase audit report
│   └── TECHNICAL_DECISIONS.md      # Core business invariants & architectural decisions
├── postman/                        # Postman collection & automated test suite
│   ├── ACTUAL_TEST_RESULTS.md      # 66/66 live executed test results report
│   ├── ANTIKATKO_API.postman_collection.json  # v2.1.0 collection with tests & saved responses
│   ├── ANTIKATKO_Local.postman_environment.json # Environment variables and defaults
│   ├── API_COVERAGE_REPORT.md      # Exhaustive API coverage matrix and security assessment
│   ├── POSTMAN_GUIDE.md            # Step-by-step import and workflow testing guide
│   └── build_and_test_collection.py # Live DRF client test runner and collection generator
├── tests/                          # Django automated unit test suite
│   ├── test_accounts.py            # Auth, register, login, refresh, logout, password tests
│   ├── test_customers.py           # Profile, address creation, default address enforcement
│   ├── test_catalog.py             # Category, product listings, filtering, image validation
│   └── test_cart_wishlist.py       # Cart operations, wishlist constraints, stock validation
├── manage.py
└── requirements.txt
```

---

## 2. Essential Commands

### Environment Activation
```powershell
# Windows PowerShell
cd "D:\S&M Apps\ANTIKATKO-backend"
.\.venv\Scripts\Activate.ps1
```

### Database & Migrations
```powershell
# Check migration status
python manage.py showmigrations

# Apply any pending migrations
python manage.py migrate
```

### Seed Local Data
Populate categories, products, addresses, settings, and seed user accounts:
```powershell
python manage.py seed_local_data
```

**Pre-configured Seed Accounts:**
- **Administrator:** `admin@antikatko.com` / `AdminPass123!` (Role: `ADMIN`)
- **Customer:** `customer@antikatko.com` / `CustomerPass123!` (Role: `CUSTOMER`)

### Running Automated Test Suites
```powershell
# Run Django unit tests (18 tests)
python manage.py test tests

# Run live API test runner (66 requests with live DRF client)
python postman/build_and_test_collection.py
```

### Starting the Local Development Server
```powershell
python manage.py runserver 127.0.0.1:8000
```
- Interactive Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc UI: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI Schema: `http://127.0.0.1:8000/api/schema/`

---

## 3. Core Architectural Invariants & Business Logic

Any future developer or AI agent modifying this codebase must adhere strictly to these invariants:

1. **Strictly Two Roles:**
   The `accounts.User` model supports only two roles: `CUSTOMER` and `ADMIN`. Superusers are administrators with Django admin flags. There are no sub-roles or external vendor classes.

2. **Standard API Response Envelopes:**
   - **Success:**
     ```json
     {
       "success": true,
       "message": "Human readable confirmation.",
       "data": { ... }
     }
     ```
   - **Error:**
     ```json
     {
       "success": false,
       "message": "Reason for error.",
       "errors": { "field": ["Validation error message."] }
     }
     ```
   - **Paginated:**
     ```json
     {
       "success": true,
       "data": {
         "count": 12,
         "next": "http://127.0.0.1:8000/api/v1/products/?page=2",
         "previous": null,
         "results": [ ... ]
       }
     }
     ```

3. **Server-Side Financial Authority:**
   - Subtotals, taxes, shipping fees, and grand totals are calculated **exclusively on the server** from current database product records.
   - Any prices passed in the request body from client applications are discarded.
   - Default shipping fee is 100.00 EGP (configurable dynamically in `store_settings.StoreSetting`).

4. **Row-Level Concurrency & Stock Integrity:**
   - Order checkout and stock adjustments use `Product.objects.select_for_update().filter(id__in=sorted_ids)` within `transaction.atomic()`.
   - Primary keys are always sorted before locking to prevent database deadlocks.
   - Restocking during order cancellation is idempotent: `Order.cancel()` validates that the order is not already cancelled and records a single `ORDER_RESTOCK` transaction in `InventoryTransaction`.

5. **Decoupled Payment Lifecycle:**
   - Selecting a payment method (`vodafone_cash`, `instapay`, `cash_on_delivery`) creates a payment record in `PENDING` state.
   - Manual transfer methods require the customer to upload a screenshot proof (`PaymentProof`).
   - Only an administrator calling `POST /api/v1/admin/payments/{id}/verify/` can advance payment status to `PAID`.

6. **Guest Order Privacy & Security:**
   - Guest checkouts generate a high-entropy secret token (`secrets.token_urlsafe(32)`).
   - Reading guest order details or submitting proof requires the `X-Guest-Token` header.
   - Requests without this token return `403 Forbidden` to prevent enumeration of customer PII.

7. **SimpleJWT Refresh Token Rotation:**
   - Calling `/api/v1/auth/token/refresh/` blacklists the old refresh token and returns a new refresh token.
   - Any logout call must pass the active (most recently rotated) refresh token.

---

## 4. Verification Checkpoint Status

- **System Checks:** `python manage.py check` reports `System check identified no issues (0 silenced).`
- **Django Unit Tests:** 18 passing (`OK`).
- **Live DRF Client Runner:** 66 requests executed, 66 passing (`100% Pass Rate`).
- **Postman Collection:** Validated JSON schema against Postman Collection v2.1.0 format.
- **Environment:** Validated JSON schema against Postman Environment format.
