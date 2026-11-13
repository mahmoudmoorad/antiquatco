"""
Dashboard URL routes for Admin.
"""
from django.urls import path
from .views import (
    DashboardOverviewView,
    DashboardSalesTrendsView,
    DashboardTopProductsView,
    DashboardLowStockView,
)

app_name = "dashboard"

urlpatterns = [
    path("overview/", DashboardOverviewView.as_view(), name="overview"),
    path("sales/", DashboardSalesTrendsView.as_view(), name="sales_trends"),
    path("top-products/", DashboardTopProductsView.as_view(), name="top_products"),
    path("low-stock/", DashboardLowStockView.as_view(), name="low_stock"),
]
