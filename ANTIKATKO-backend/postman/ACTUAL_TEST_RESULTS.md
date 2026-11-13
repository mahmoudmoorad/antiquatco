# ANTIKATKO API — Actual Live Test Execution Results

**Execution Date:** 2026-11-07 16:25:11 UTC

- **Total Live Requests Executed:** 66
- **Passed:** 66
- **Failed:** 0
- **Pass Rate:** 100.0%

---

## Detailed Test Matrix

| # | Folder | Method | Endpoint URL | Status | Result | Scenario Description |
|:---:|---|:---:|---|:---:|:---:|---|
| 1 | Authentication | `POST` | `/api/v1/auth/login/` | `200` | **PASS** | Login with customer credentials |
| 2 | Authentication | `POST` | `/api/v1/auth/login/` | `200` | **PASS** | Login with admin credentials |
| 3 | Authentication | `POST` | `/api/v1/auth/register/` | `201` | **PASS** | Register new customer account |
| 4 | Authentication | `POST` | `/api/v1/auth/token/refresh/` | `200` | **PASS** | Refresh expired access token |
| 5 | Authentication | `POST` | `/api/v1/auth/otp/send/` | `200` | **PASS** | Generate and send OTP code |
| 6 | Authentication | `POST` | `/api/v1/auth/change-password/` | `200` | **PASS** | Change current user password |
| 7 | Authentication | `POST` | `/api/v1/auth/logout/` | `200` | **PASS** | Logout and blacklist refresh token |
| 8 | Authentication | `POST` | `/api/v1/auth/login/` | `401` | **PASS** | Attempt login with wrong password returns 401 |
| 9 | Users | `GET` | `/api/v1/auth/me/` | `200` | **PASS** | Retrieve profile of logged-in user |
| 10 | Users | `PATCH` | `/api/v1/auth/me/` | `200` | **PASS** | Update personal user details |
| 11 | Customer Profiles | `GET` | `/api/v1/customers/profile/` | `200` | **PASS** | Retrieve customer profile |
| 12 | Customer Profiles | `PATCH` | `/api/v1/customers/profile/` | `200` | **PASS** | Update customer profile details |
| 13 | Addresses | `GET` | `/api/v1/customers/addresses/` | `200` | **PASS** | List saved shipping addresses |
| 14 | Addresses | `POST` | `/api/v1/customers/addresses/` | `201` | **PASS** | Create new customer address |
| 15 | Addresses | `POST` | `/api/v1/customers/addresses/1/set-default/` | `200` | **PASS** | Set address as default |
| 16 | Categories | `GET` | `/api/v1/categories/` | `200` | **PASS** | Public active categories list |
| 17 | Categories | `GET` | `/api/v1/categories/antique-mirrors/` | `200` | **PASS** | Get category by slug |
| 18 | Categories | `POST` | `/api/v1/admin/categories/` | `201` | **PASS** | Admin create category |
| 19 | Categories | `PATCH` | `/api/v1/admin/categories/6/` | `200` | **PASS** | Admin update category |
| 20 | Products | `GET` | `/api/v1/products/` | `200` | **PASS** | Public paginated product catalog |
| 21 | Products | `GET` | `/api/v1/products/?category=antique-mirrors&in_stock=true&min_price=1000` | `200` | **PASS** | Filter products by category, price, and stock |
| 22 | Products | `GET` | `/api/v1/products/antique-brass-mantel-clock/` | `200` | **PASS** | Get product details by slug |
| 23 | Product Images | `POST` | `/api/v1/admin/products/3/images/` | `201` | **PASS** | Admin upload gallery image |
| 24 | Cart | `POST` | `/api/v1/cart/items/` | `201` | **PASS** | Add product to customer cart |
| 25 | Cart | `GET` | `/api/v1/cart/` | `200` | **PASS** | Retrieve active cart and line totals |
| 26 | Cart | `PATCH` | `/api/v1/cart/items/4/` | `200` | **PASS** | Update cart item quantity |
| 27 | Cart | `POST` | `/api/v1/cart/sync/` | `200` | **PASS** | Merge guest cart items into customer cart |
| 28 | Wishlist | `POST` | `/api/v1/wishlist/` | `201` | **PASS** | Add product to wishlist |
| 29 | Wishlist | `GET` | `/api/v1/wishlist/` | `200` | **PASS** | List customer wishlist items |
| 30 | Wishlist | `DELETE` | `/api/v1/wishlist/3/` | `204` | **PASS** | Delete product from wishlist |
| 31 | Inventory | `GET` | `/api/v1/inventory/` | `200` | **PASS** | Admin inventory status and stock monitoring |
| 32 | Inventory | `POST` | `/api/v1/inventory/adjust/` | `200` | **PASS** | Atomic stock adjustment and transaction logging |
| 33 | Inventory | `GET` | `/api/v1/inventory/transactions/` | `200` | **PASS** | Audit logs of stock movements |
| 34 | Orders | `POST` | `/api/v1/orders/checkout/` | `201` | **PASS** | Place order as authenticated customer |
| 35 | Orders | `GET` | `/api/v1/orders/my-orders/` | `200` | **PASS** | List customer order history |
| 36 | Orders | `GET` | `/api/v1/orders/ANT-20261107-2DC340/` | `200` | **PASS** | Retrieve order details with line item snapshots |
| 37 | Guest Checkout | `POST` | `/api/v1/orders/checkout/` | `201` | **PASS** | Place order as guest buyer |
| 38 | Guest Checkout | `GET` | `/api/v1/orders/ANT-20261107-988A03/` | `200` | **PASS** | Retrieve guest order using secret token |
| 39 | Guest Checkout | `GET` | `/api/v1/orders/ANT-20261107-988A03/` | `403` | **PASS** | Unauthorized order inspection returns 403 |
| 40 | Guest Order Verification | `POST` | `/api/v1/auth/link-guest-orders/` | `400` | **PASS** | Link past guest orders to account using email OTP |
| 41 | Payments | `GET` | `/api/v1/payments/ANT-20261107-2DC340/` | `200` | **PASS** | Retrieve payment record and status for order |
| 42 | Payments | `POST` | `/api/v1/payments/ANT-20261107-2DC340/proof/` | `201` | **PASS** | Submit transfer screenshot for review |
| 43 | Admin Payment Management | `GET` | `/api/v1/admin/payments/` | `200` | **PASS** | Admin list pending and verified payments |
| 44 | Admin Payment Management | `POST` | `/api/v1/admin/payments/6/verify/` | `200` | **PASS** | Approve payment proof and advance status to PAID |
| 45 | Admin Order Management | `GET` | `/api/v1/admin/orders/` | `200` | **PASS** | Admin list all sales orders |
| 46 | Admin Order Management | `GET` | `/api/v1/admin/orders/6/` | `200` | **PASS** | Admin inspect single order |
| 47 | Admin Order Management | `PATCH` | `/api/v1/admin/orders/6/status/` | `200` | **PASS** | Update order status and append notes |
| 48 | Admin Customers | `GET` | `/api/v1/admin/customers/` | `200` | **PASS** | List registered customers with purchase metrics |
| 49 | Dashboard | `GET` | `/api/v1/admin/dashboard/overview/` | `200` | **PASS** | Operational KPI cards |
| 50 | Dashboard | `GET` | `/api/v1/admin/dashboard/sales/` | `200` | **PASS** | Sales trends by status |
| 51 | Dashboard | `GET` | `/api/v1/admin/dashboard/top-products/` | `200` | **PASS** | Best selling products |
| 52 | Dashboard | `GET` | `/api/v1/admin/dashboard/low-stock/` | `200` | **PASS** | Products requiring restocking (stock <= 3) |
| 53 | Reports | `GET` | `/api/v1/admin/reports/sales/` | `200` | **PASS** | Sales report data |
| 54 | Reports | `GET` | `/api/v1/admin/reports/sales/export-excel/` | `200` | **PASS** | Download Excel sales spreadsheet |
| 55 | Reports | `GET` | `/api/v1/admin/reports/sales/export-pdf/` | `200` | **PASS** | Download PDF sales report |
| 56 | Reports | `GET` | `/api/v1/admin/reports/inventory/export-excel/` | `200` | **PASS** | Download Excel inventory spreadsheet |
| 57 | Contact | `POST` | `/api/v1/contact/` | `201` | **PASS** | Submit inquiry to store |
| 58 | Contact | `GET` | `/api/v1/contact/admin/` | `200` | **PASS** | Admin list contact messages |
| 59 | Newsletter | `POST` | `/api/v1/newsletter/subscribe/` | `200` | **PASS** | Subscribe to email newsletter |
| 60 | Newsletter | `GET` | `/api/v1/newsletter/admin/` | `200` | **PASS** | Admin list newsletter subscribers |
| 61 | Store Settings | `GET` | `/api/v1/settings/` | `200` | **PASS** | Public store parameters and payment details |
| 62 | Store Settings | `PATCH` | `/api/v1/settings/admin/` | `200` | **PASS** | Admin update store fees and phone numbers |
| 63 | Notifications | `GET` | `/api/v1/notifications/` | `200` | **PASS** | List user notifications |
| 64 | Notifications | `PATCH` | `/api/v1/notifications/1/read/` | `200` | **PASS** | Mark notification as read |
| 65 | Dashboard | `GET` | `/api/v1/admin/dashboard/overview/` | `403` | **PASS** | Customer accessing admin API receives 403 |
| 66 | Customer Profiles | `GET` | `/api/v1/customers/profile/` | `401` | **PASS** | Unauthenticated request receives 401 |
