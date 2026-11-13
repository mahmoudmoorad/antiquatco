"""
Customer and Admin Customer routes.
"""
from django.urls import path
from .views import (
    CustomerProfileView,
    CustomerAddressListCreateView,
    CustomerAddressDetailView,
    CustomerAddressSetDefaultView,
    AdminCustomerListView,
    AdminCustomerDetailView,
)

app_name = "customers"

urlpatterns = [
    # Customer endpoints
    path("profile/", CustomerProfileView.as_view(), name="profile"),
    path("addresses/", CustomerAddressListCreateView.as_view(), name="address_list_create"),
    path("addresses/<int:pk>/", CustomerAddressDetailView.as_view(), name="address_detail"),
    path("addresses/<int:pk>/set-default/", CustomerAddressSetDefaultView.as_view(), name="address_set_default"),
]
