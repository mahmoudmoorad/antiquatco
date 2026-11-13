"""
Store settings URL routes.
"""
from django.urls import path
from .views import PublicStoreSettingsView, AdminStoreSettingsUpdateView

app_name = "store_settings"

urlpatterns = [
    path("", PublicStoreSettingsView.as_view(), name="store_settings"),
    path("admin/", AdminStoreSettingsUpdateView.as_view(), name="admin_store_settings_update"),
]
