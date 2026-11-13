"""
Reports URL routes.
"""
from django.urls import path
from .views import (
    SalesReportView,
    SalesReportExcelExportView,
    SalesReportPdfExportView,
    InventoryReportExcelExportView,
)

app_name = "reports"

urlpatterns = [
    path("sales/", SalesReportView.as_view(), name="sales_report"),
    path("sales/export-excel/", SalesReportExcelExportView.as_view(), name="sales_export_excel"),
    path("sales/export-pdf/", SalesReportPdfExportView.as_view(), name="sales_export_pdf"),
    path("inventory/export-excel/", InventoryReportExcelExportView.as_view(), name="inventory_export_excel"),
]
