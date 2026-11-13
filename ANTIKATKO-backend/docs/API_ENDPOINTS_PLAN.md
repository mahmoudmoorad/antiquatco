# ANTIKATKO Backend — Complete API Endpoints Matrix & Implementation Plan

**Base URL:** `/api/v1/`  
**Standard Response Formats:**
- **Success:** `{"success": true, "message": "...", "data": {...}}`
- **Error:** `{"success": false, "message": "...", "errors": {...}}`
- **Paginated:** `{"success": true, "data": {"count": N, "next": ..., "previous": ..., "results": [...]}}`
- **Status Codes:** `200 OK`, `201 Created`, `204 No Content` (Empty body), `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

---

## 1. Complete Endpoint Matrix

| # | Endpoint URL | Method | Module & Feature | Access Level | Request Payload / Params | Status |
|---|:---|:---:|:---|:---|:---|:---:|
| **AUTH & ACCOUNTS** | | | | | | |
| 1 | `/api/v1/auth/register/` | POST | Customer Registration | Public | `{email, username, password, first_name, last_name, phone_number}` | Planned |
| 2 | `/api/v1/auth/login/` | POST | Email/Password JWT Login | Public | `{email, password}` | Planned |
| 3 | `/api/v1/auth/token/refresh/` | POST | Refresh JWT Access Token | Public | `{refresh}` | Planned |
| 4 | `/api/v1/auth/logout/` | POST | Logout & Blacklist Token | Authenticated | `{refresh}` | Planned |
| 5 | `/api/v1/auth/me/` | GET | Retrieve Current User Profile | Authenticated | None | Planned |
| 6 | `/api/v1/auth/me/` | PATCH | Update Current User Profile | Authenticated | `{first_name, last_name, phone_number}` | Planned |
| 7 | `/api/v1/auth/change-password/` | POST | Change Account Password | Authenticated | `{old_password, new_password}` | Planned |
| 8 | `/api/v1/auth/password-reset/request/` | POST | Request Password Reset OTP | Public | `{email}` | Planned |
| 9 | `/api/v1/auth/password-reset/confirm/` | POST | Reset Password with OTP | Public | `{email, otp, new_password}` | Planned |
| 10 | `/api/v1/auth/otp/send/` | POST | Send Verification OTP | Public / Auth | `{identifier, purpose}` | Planned |
| 11 | `/api/v1/auth/otp/verify/` | POST | Verify OTP Code | Public / Auth | `{identifier, purpose, otp}` | Planned |
| 12 | `/api/v1/auth/link-guest-orders/` | POST | Link Historical Guest Orders | Customer | `{verified_email, otp}` | Planned |
| **CUSTOMERS & ADDRESSES** | | | | | | |
| 13 | `/api/v1/customers/profile/` | GET | Retrieve Customer Profile | Customer | None | Planned |
| 14 | `/api/v1/customers/profile/` | PATCH | Update Customer Profile/Avatar | Customer | Multipart: `{avatar, date_of_birth}` | Planned |
| 15 | `/api/v1/customers/addresses/` | GET | List Customer Saved Addresses | Customer | None | Planned |
| 16 | `/api/v1/customers/addresses/` | POST | Create New Shipping Address | Customer | `{title, recipient_name, phone_number, governorate, city, street_address, is_default}` | Planned |
| 17 | `/api/v1/customers/addresses/{id}/` | GET | Retrieve Single Address | Customer (Owner) | Path: `id` | Planned |
| 18 | `/api/v1/customers/addresses/{id}/` | PATCH | Update Address | Customer (Owner) | Address fields | Planned |
| 19 | `/api/v1/customers/addresses/{id}/` | DELETE | Delete Saved Address | Customer (Owner) | Path: `id` (Returns 204) | Planned |
| 20 | `/api/v1/customers/addresses/{id}/set-default/` | POST | Set Address as Default | Customer (Owner) | Path: `id` | Planned |
| 21 | `/api/v1/admin/customers/` | GET | Admin Customer Management List | Admin | Query: `search, page, ordering` | Planned |
| 22 | `/api/v1/admin/customers/{id}/` | GET | Admin Customer Details & History | Admin | Path: `id` | Planned |
| **CATALOG** | | | | | | |
| 23 | `/api/v1/categories/` | GET | Public Active Categories List | Public | None | Planned |
| 24 | `/api/v1/categories/{slug}/` | GET | Public Category Detail | Public | Path: `slug` | Planned |
| 25 | `/api/v1/admin/categories/` | POST | Admin Create Category | Admin | `{name_en, name_ar, slug, description_en, description_ar, image}` | Planned |
| 26 | `/api/v1/admin/categories/{id}/` | PATCH | Admin Update Category | Admin | Category fields | Planned |
| 27 | `/api/v1/admin/categories/{id}/` | DELETE | Admin Safe Delete Category | Admin | Path: `id` (Protected if has products) | Planned |
| 28 | `/api/v1/products/` | GET | Public Filterable Product Catalog | Public | Query: `category, min_price, max_price, in_stock, search, ordering, page` | Planned |
| 29 | `/api/v1/products/{slug}/` | GET | Public Product Detail View | Public | Path: `slug` | Planned |
| 30 | `/api/v1/admin/products/` | POST | Admin Create Product | Admin | Multipart: `{name_en, name_ar, slug, category_id, price, original_price, stock, main_image}` | Planned |
| 31 | `/api/v1/admin/products/{id}/` | PATCH | Admin Update Product | Admin | Product fields | Planned |
| 32 | `/api/v1/admin/products/{id}/` | DELETE | Admin Soft Archive / Delete | Admin | Path: `id` (Safe archive) | Planned |
| 33 | `/api/v1/admin/products/{id}/images/` | POST | Admin Upload Gallery Image | Admin | Multipart: `{image, alt_text, display_order}` | Planned |
| 34 | `/api/v1/admin/products/images/{id}/` | DELETE | Admin Delete Gallery Image | Admin | Path: `id` (Returns 204) | Planned |
| **CART** | | | | | | |
| 35 | `/api/v1/cart/` | GET | Retrieve Customer Cart & Totals | Customer | None | Planned |
| 36 | `/api/v1/cart/items/` | POST | Add Product to Cart | Customer | `{product_id, quantity}` | Planned |
| 37 | `/api/v1/cart/items/{id}/` | PATCH | Update Cart Item Quantity | Customer (Owner) | `{quantity}` | Planned |
| 38 | `/api/v1/cart/items/{id}/` | DELETE | Remove Item from Cart | Customer (Owner) | Path: `id` (Returns 204) | Planned |
| 39 | `/api/v1/cart/clear/` | POST | Clear All Cart Items | Customer | None | Planned |
| 40 | `/api/v1/cart/sync/` | POST | Merge Guest Cart on Login | Customer | `{items: [{product_id, quantity}]}` | Planned |
| **WISHLIST** | | | | | | |
| 41 | `/api/v1/wishlist/` | GET | Retrieve Customer Wishlist | Customer | None | Planned |
| 42 | `/api/v1/wishlist/` | POST | Add Product to Wishlist | Customer | `{product_id}` | Planned |
| 43 | `/api/v1/wishlist/{product_id}/` | DELETE | Remove Product from Wishlist | Customer | Path: `product_id` (Returns 204) | Planned |
| **INVENTORY** | | | | | | |
| 44 | `/api/v1/inventory/` | GET | Admin Stock Listing & Alerts | Admin | Query: `low_stock, out_of_stock, search, page` | Planned |
| 45 | `/api/v1/inventory/adjust/` | POST | Admin Atomic Stock Adjustment | Admin | `{product_id, quantity_change, transaction_type, reason}` | Planned |
| 46 | `/api/v1/inventory/transactions/` | GET | Admin Inventory Audit Logs | Admin | Query: `product_id, type, date_from, date_to, page` | Planned |
| **ORDERS & CHECKOUT** | | | | | | |
| 47 | `/api/v1/orders/checkout/` | POST | Place Order (Guest or Customer) | Public / Customer | `{items, customer_name, customer_email, customer_phone, shipping_governorate, shipping_city, shipping_street_address, payment_method}` | Planned |
| 48 | `/api/v1/orders/my-orders/` | GET | Customer Order History | Customer | Query: `status, page, ordering` | Planned |
| 49 | `/api/v1/orders/{order_number}/` | GET | Retrieve Order Details | Customer or Guest | Path: `order_number` (Guest requires header/query `guest_token`) | Planned |
| 50 | `/api/v1/orders/{order_number}/cancel/` | POST | Cancel Eligible Order | Customer or Admin | `{reason}` (Restores inventory atomically) | Planned |
| 51 | `/api/v1/admin/orders/` | GET | Admin Order Management List | Admin | Query: `status, payment_method, date_from, date_to, search, page` | Planned |
| 52 | `/api/v1/admin/orders/{id}/` | GET | Admin Detailed Order View | Admin | Path: `id` | Planned |
| 53 | `/api/v1/admin/orders/{id}/status/` | PATCH | Admin Update Order Status | Admin | `{status, admin_notes}` | Planned |
| **PAYMENTS** | | | | | | |
| 54 | `/api/v1/payments/{order_number}/` | GET | Retrieve Order Payment Record | Customer or Guest | Path: `order_number` | Planned |
| 55 | `/api/v1/payments/{order_number}/proof/` | POST | Upload Transfer Proof Screenshot | Customer or Guest | Multipart: `{proof_image, transaction_reference, sender_info}` | Planned |
| 56 | `/api/v1/admin/payments/` | GET | Admin Payment Verification List | Admin | Query: `status, method, page` | Planned |
| 57 | `/api/v1/admin/payments/{id}/` | GET | Admin Payment Details View | Admin | Path: `id` | Planned |
| 58 | `/api/v1/admin/payments/{id}/verify/` | POST | Admin Approve Payment Proof | Admin | `{admin_notes}` (Sets status PAID) | Planned |
| 59 | `/api/v1/admin/payments/{id}/reject/` | POST | Admin Reject Payment Proof | Admin | `{rejection_reason, admin_notes}` (Sets status FAILED) | Planned |
| **ADMIN DASHBOARD** | | | | | | |
| 60 | `/api/v1/admin/dashboard/overview/` | GET | Aggregated KPI Metric Cards | Admin | None | Planned |
| 61 | `/api/v1/admin/dashboard/sales/` | GET | Historical Sales & Revenue Chart | Admin | Query: `period (daily, weekly, monthly)` | Planned |
| 62 | `/api/v1/admin/dashboard/top-products/` | GET | Best Selling Products | Admin | Query: `limit` (default 5) | Planned |
| 63 | `/api/v1/admin/dashboard/low-stock/` | GET | Urgent Low Stock Table (<= 3) | Admin | None | Planned |
| **REPORTS** | | | | | | |
| 64 | `/api/v1/admin/reports/sales/` | GET | Filterable Sales Analytics Report | Admin | Query: `date_from, date_to, payment_method` | Planned |
| 65 | `/api/v1/admin/reports/sales/export-excel/` | GET | Download Excel Sales Report | Admin | Query: `date_from, date_to` (Returns `.xlsx` file) | Planned |
| 66 | `/api/v1/admin/reports/sales/export-pdf/` | GET | Download PDF Sales Summary | Admin | Query: `date_from, date_to` (Returns `.pdf` file) | Planned |
| 67 | `/api/v1/admin/reports/inventory/export-excel/` | GET | Download Excel Inventory Report | Admin | None (Returns `.xlsx` file) | Planned |
| **STORE MODULES (CONTACT, NEWSLETTER, SETTINGS, NOTIFICATIONS)** | | | | | | |
| 68 | `/api/v1/contact/` | POST | Submit Contact Message | Public | `{name, email, phone, subject, message}` | Planned |
| 69 | `/api/v1/admin/contact/` | GET | Admin View Contact Inquiries | Admin | Query: `is_read, page` | Planned |
| 70 | `/api/v1/admin/contact/{id}/` | PATCH | Mark Read / Respond to Inquiry | Admin | `{is_read, notes}` | Planned |
| 71 | `/api/v1/newsletter/subscribe/` | POST | Subscribe to Newsletter | Public | `{email}` | Planned |
| 72 | `/api/v1/settings/` | GET | Public Store Info & Payment Info | Public | None (Shipping fee, wallet numbers) | Planned |
| 73 | `/api/v1/admin/settings/` | PATCH | Update Store Settings & Fees | Admin | `{shipping_fee, vodafone_number, instapay_handle}` | Planned |
| 74 | `/api/v1/notifications/` | GET | List User / Admin Notifications | Authenticated | Query: `unread_only, page` | Planned |
| 75 | `/api/v1/notifications/{id}/read/` | PATCH | Mark Notification As Read | Authenticated | Path: `id` | Planned |
