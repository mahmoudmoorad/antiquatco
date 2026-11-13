"""
Report views for Sales & Inventory analysis with Excel and PDF exports.
"""
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from common.permissions import IsAdminUserRole
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from .services import ReportService


class SalesReportView(APIView):
    """Admin endpoint to retrieve filterable sales report data."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        queryset = Order.objects.select_related("payment").prefetch_related("items").order_by("-created_at")

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        status_param = request.query_params.get("status")

        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if status_param:
            queryset = queryset.filter(status=status_param)

        serializer = OrderSerializer(queryset[:100], many=True)
        return success_response(
            data={
                "count": queryset.count(),
                "results": serializer.data,
            }
        )


class SalesReportExcelExportView(APIView):
    """Admin endpoint to download Excel (.xlsx) sales report."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        queryset = Order.objects.select_related("payment").order_by("-created_at")
        excel_stream = ReportService.generate_sales_excel(queryset)

        response = HttpResponse(
            excel_stream.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="antikatko_sales_report.xlsx"'
        return response


class SalesReportPdfExportView(APIView):
    """Admin endpoint to download PDF (.pdf) sales report."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        queryset = Order.objects.select_related("payment").order_by("-created_at")
        pdf_stream = ReportService.generate_sales_pdf(queryset)

        response = HttpResponse(pdf_stream.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="antikatko_sales_report.pdf"'
        return response


class InventoryReportExcelExportView(APIView):
    """Admin endpoint to download Excel (.xlsx) inventory report."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        excel_stream = ReportService.generate_inventory_excel()

        response = HttpResponse(
            excel_stream.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="antikatko_inventory_report.xlsx"'
        return response
