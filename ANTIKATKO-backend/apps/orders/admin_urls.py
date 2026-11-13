"""
Admin Order Management URL routes.
"""
from django.urls import path
from .views import (
    AdminOrderListView,
    AdminOrderDetailView,
    AdminOrderStatusUpdateView,
)

urlpatterns = [
    path("", AdminOrderListView.as_view(), name="admin_order_list"),
    path("<int:pk>/", AdminOrderDetailView.as_view(), name="admin_order_detail"),
    path("<int:pk>/status/", AdminOrderStatusUpdateView.as_view(), name="admin_order_status"),
]
