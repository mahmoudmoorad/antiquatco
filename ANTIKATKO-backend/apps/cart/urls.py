"""
Cart URL routes.
"""
from django.urls import path
from .views import (
    CartView,
    CartItemAddView,
    CartItemDetailView,
    CartClearView,
    CartSyncView,
)

app_name = "cart"

urlpatterns = [
    path("", CartView.as_view(), name="cart_detail"),
    path("items/", CartItemAddView.as_view(), name="cart_item_add"),
    path("items/<int:pk>/", CartItemDetailView.as_view(), name="cart_item_detail"),
    path("clear/", CartClearView.as_view(), name="cart_clear"),
    path("sync/", CartSyncView.as_view(), name="cart_sync"),
]
