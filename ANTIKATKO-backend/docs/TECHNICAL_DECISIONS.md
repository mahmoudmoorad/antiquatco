# ANTIKATKO Backend — Technical Decisions & Architecture Rationale

**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Senior Backend Architect  

---

## 1. Context & Objectives

The goal is to deliver an enterprise-grade Django REST Framework backend for the **ANTIKATKO** antique, vintage furniture, and home decor e-commerce platform. This document formally records key architectural decisions, security boundaries, financial invariants, and resolutions to business ambiguities.

---

## 2. Decision Log

### Decision 1: Standard API Response Envelope
- **Decision:** All JSON responses conform strictly to the frontend contract:
  - Success: `{"success": true, "message": "...", "data": {...}}`
  - Error: `{"success": false, "message": "...", "errors": {...}}`
  - Paginated: `{"success": true, "data": {"count": N, "next": ..., "previous": ..., "results": [...]}}`
- **Rationale:** Standardizes frontend consumption, simplifies Axios/Fetch interceptors, and provides uniform error surfacing for bilingual UIs.
- **Implementation:** Integrated into `common.responses`, `common.pagination.StandardResultsSetPagination`, and `common.exceptions.custom_exception_handler`.

### Decision 2: Guest Checkout & Secure Guest Order Access
- **Decision:** The platform permits both registered customer checkout and guest checkout. Guest orders generate a high-entropy cryptographically secure token (`guest_access_token` via `secrets.token_urlsafe(32)`).
- **Security Rule:** Private guest order details (`GET /api/v1/orders/{order_number}/`) and proof uploads (`POST /api/v1/payments/{order_number}/proof/`) require either:
  1. The authenticated customer owner (`order.user == request.user`), OR
  2. A matching `guest_token` passed via the `X-Guest-Token` header or `?guest_token=` query parameter, OR
  3. An authenticated Admin (`request.user.is_admin_role`).
- **Rationale:** Prevents unauthorized enumeration and exposure of customer PII (phone number, address, full name) simply by guessing order numbers.

### Decision 3: Guest Order Linking via OTP Verification
- **Decision:** Provide `POST /api/v1/auth/link-guest-orders/` to allow registered customers to claim orders placed as a guest under the same email.
- **Rule:** Before orders are transferred to the registered customer account, ownership of the guest email address must be verified via a 6-digit OTP code (`purpose='GUEST_ORDER_LINK'`) generated with an expiration time of 10 minutes and hashed in the database.
- **Rationale:** Prevents a malicious user from registering with someone else's email or phone and gaining unauthorized access to their past order history.

### Decision 4: Inventory Deduction & Concurrency Strategy
- **Decision:** Inventory deduction occurs **at checkout creation time** (`POST /api/v1/orders/checkout/`), inside a PostgreSQL transaction with pessimistic row-locking (`select_for_update()`).
- **Rule:** 
  1. Product rows are locked in a deterministic order (by ID) to avoid database deadlocks.
  2. If any item has insufficient stock, the transaction aborts with an HTTP 409 Conflict error detailing the unavailable product.
  3. Every deduction logs an `InventoryTransaction` with type `ORDER_DEDUCTION` and the assigned `order_number`.
- **Rationale:** Antiques and vintage furniture are frequently unique (stock = 1) or limited-quantity items. Immediate reservation prevents two buyers from placing concurrent orders for the same one-of-a-kind antique.

### Decision 5: Order Cancellation & Inventory Restoration
- **Decision:** Cancellation is permitted only while orders are in `PENDING`, `CONFIRMED`, or `PROCESSING` status. Orders in `SHIPPED` or `DELIVERED` status cannot be directly cancelled by customers.
- **Rule:** Stock restoration is idempotent and strictly executed once per order:
  1. Guarded by the database boolean `order.is_stock_restored`.
  2. Restores item quantities inside `transaction.atomic()`.
  3. Generates an `InventoryTransaction` with type `ORDER_RESTOCK`.
  4. Flips `is_stock_restored = True` and `order.status = 'CANCELLED'`.
- **Rationale:** Prevents double-restock vulnerabilities where repeated cancellation requests could artificially inflate inventory.

### Decision 6: Financial Authority & Pricing Invariants
- **Decision:** The backend is the sole authority for all monetary calculations.
- **Rules:**
  1. Prices submitted by the frontend are strictly ignored.
  2. Line totals are computed from the active database `Product.price`.
  3. Shipping fee defaults to 100.00 EGP per order (configurable in `StoreSetting`).
  4. All money values use `DecimalField(max_digits=12, decimal_places=2)`. Floating-point arithmetic is prohibited.
  5. Immutable historical snapshots (`OrderItem.unit_price`, `OrderItem.product_name_en`, `OrderItem.product_name_ar`) are permanently stored on the order item so subsequent catalog edits never alter past financial records.

### Decision 7: Decoupled Order & Payment Status Lifecycles
- **Decision:** `Order.status` and `Payment.status` are strictly independent state machines.
- **Initial Statuses:**
  - `vodafone_cash`: Payment status `PENDING`, Order status `PENDING`.
  - `instapay`: Payment status `PENDING`, Order status `PENDING`.
  - `cash_on_delivery`: Payment status `UNPAID`, Order status `PENDING`.
- **Rule:** Selecting a payment method NEVER marks payment as `PAID`. Transitions to `PAID` occur exclusively via Admin manual verification (`/api/v1/admin/payments/{id}/verify/`).

### Decision 8: Role-Based Access Control (RBAC)
- **Decision:** Strictly two user roles: `CUSTOMER` and `ADMIN`.
- **Security Invariants:**
  1. Public registration defaults to `role='CUSTOMER'`. Any payload specifying `role='ADMIN'` is rejected or sanitized.
  2. Admin status requires `user.role == 'ADMIN'` or `user.is_staff == True`.
  3. Admin APIs reside under `/api/v1/admin/...` or have explicit `IsAdminUserRole` permission checks.

### Decision 9: Additional Dedicated Store Applications
- **Decision:** Rather than stuffing unrelated features into existing apps, four modular Django apps are added:
  1. `apps.contact` for contact form inquiries and admin triage.
  2. `apps.newsletter` for marketing subscriptions.
  3. `apps.store_settings` for dynamic store contact, flat shipping fee, and payment transfer details.
  4. `apps.notifications` for in-app customer and admin alerts.
- **Rationale:** Follows high cohesion and low coupling Django architecture.

### Decision 10: Product Catalog Protection & Safe Archiving
- **Decision:** Categories cannot be deleted if they contain products (`ForeignKey(Category, on_delete=models.PROTECT)`). Products referenced by existing historical orders cannot be hard-deleted from the database (`OrderItem.product` uses `models.SET_NULL` and `Product.is_archived=True` is applied).
- **Rationale:** Preserves historical audit integrity and prevents broken relational references in accounting reports.
