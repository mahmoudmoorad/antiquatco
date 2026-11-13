"""
Customer Order URL routes.
"""
from django.urls import path
from .views import (
    CheckoutView,
    CustomerOrderListView,
    OrderDetailView,
    OrderCancelView,
)

app_name = "orders"

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("my-orders/", CustomerOrderListView.as_view(), name="customer_orders"),
    path("<str:order_number>/", OrderDetailView.as_view(), name="order_detail"),
    path("<str:order_number>/cancel/", OrderCancelView.as_view(), name="order_cancel"),
]
