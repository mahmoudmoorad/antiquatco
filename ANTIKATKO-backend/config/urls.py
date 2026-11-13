"""
ANTIKATKO URL Configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI 3 Schema & Interactive Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # API v1 routes
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/customers/", include("apps.customers.urls")),
    path("api/v1/admin/customers/", include("apps.customers.admin_urls")),
    path("api/v1/", include("apps.catalog.urls")),
    path("api/v1/cart/", include("apps.cart.urls")),
    path("api/v1/wishlist/", include("apps.wishlist.urls")),
    path("api/v1/inventory/", include("apps.inventory.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/admin/orders/", include("apps.orders.admin_urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/admin/payments/", include("apps.payments.admin_urls")),
    path("api/v1/admin/dashboard/", include("apps.dashboard.urls")),
    path("api/v1/admin/reports/", include("apps.reports.urls")),
    path("api/v1/contact/", include("apps.contact.urls")),
    path("api/v1/newsletter/", include("apps.newsletter.urls")),
    path("api/v1/settings/", include("apps.store_settings.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
