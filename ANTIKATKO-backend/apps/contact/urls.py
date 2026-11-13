"""
Contact URL routes.
"""
from django.urls import path
from .views import ContactSubmitView, AdminContactListView, AdminContactDetailView

app_name = "contact"

urlpatterns = [
    path("", ContactSubmitView.as_view(), name="contact_submit"),
    path("admin/", AdminContactListView.as_view(), name="admin_contact_list"),
    path("admin/<int:pk>/", AdminContactDetailView.as_view(), name="admin_contact_detail"),
]
