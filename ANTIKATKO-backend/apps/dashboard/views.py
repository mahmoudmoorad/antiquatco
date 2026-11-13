"""
Dashboard API Views for ANTIKATKO Admin.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.responses import success_response
from common.permissions import IsAdminUserRole
from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer
from .services import DashboardService


class DashboardOverviewView(APIView):
    """Admin endpoint to retrieve key operational and revenue KPI metrics."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        metrics = DashboardService.get_overview_metrics()
        return success_response(data=metrics)


class DashboardSalesTrendsView(APIView):
    """Admin endpoint to retrieve sales trends and order status distribution."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        trends = DashboardService.get_sales_trends()
        return success_response(data=trends)


class DashboardTopProductsView(APIView):
    """Admin endpoint to retrieve best selling products."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        limit = int(request.query_params.get("limit", 5))
        top_products = DashboardService.get_top_products(limit=limit)
        return success_response(data=top_products)


class DashboardLowStockView(APIView):
    """Admin endpoint to retrieve urgent low-stock products (stock <= 3)."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        products = Product.objects.filter(is_archived=False, stock__lte=3).select_related("category").order_by("stock")
        serializer = ProductListSerializer(products, many=True)
        return success_response(data=serializer.data)
