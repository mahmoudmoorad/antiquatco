"""
Inventory URL routes.
"""
from django.urls import path
from .views import (
    InventoryListView,
    StockAdjustmentView,
    InventoryTransactionListView,
)

app_name = "inventory"

urlpatterns = [
    path("", InventoryListView.as_view(), name="inventory_list"),
    path("adjust/", StockAdjustmentView.as_view(), name="stock_adjust"),
    path("transactions/", InventoryTransactionListView.as_view(), name="inventory_transactions"),
]
