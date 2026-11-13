"""
Inventory API views for admin stock listing, adjustments, and transactions.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from common.responses import success_response
from common.permissions import IsAdminUserRole
from common.pagination import StandardResultsSetPagination
from apps.catalog.models import Product
from .models import InventoryTransaction
from .serializers import (
    InventoryProductSerializer,
    InventoryTransactionSerializer,
    StockAdjustmentSerializer,
)
from .services import InventoryService


class InventoryListView(generics.ListAPIView):
    """Admin view: list stock levels, low-stock products, out-of-stock items."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = InventoryProductSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name_en", "name_ar", "slug"]
    ordering_fields = ["stock", "price", "updated_at"]
    ordering = ["stock"]

    def get_queryset(self):
        queryset = Product.objects.filter(is_archived=False).select_related("category")
        low_stock = self.request.query_params.get("low_stock")
        out_of_stock = self.request.query_params.get("out_of_stock")

        if low_stock and low_stock.lower() in ("true", "1"):
            queryset = queryset.filter(stock__lte=3, stock__gt=0)
        elif out_of_stock and out_of_stock.lower() in ("true", "1"):
            queryset = queryset.filter(stock=0)

        return queryset


class StockAdjustmentView(APIView):
    """Admin endpoint to perform an atomic stock adjustment."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product, log_entry = InventoryService.adjust_stock(
            product_id=serializer.validated_data["product_id"],
            quantity_change=serializer.validated_data["quantity_change"],
            transaction_type=serializer.validated_data["transaction_type"],
            reason=serializer.validated_data["reason"],
            user=request.user,
        )

        return success_response(
            data={
                "product": InventoryProductSerializer(product).data,
                "transaction": InventoryTransactionSerializer(log_entry).data,
            },
            message="Stock adjusted successfully.",
            status_code=status.HTTP_200_OK,
        )


class InventoryTransactionListView(generics.ListAPIView):
    """Admin view: inspect complete inventory audit logs."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = InventoryTransactionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["transaction_type", "product"]
    search_fields = ["product__name_en", "reason", "related_order_number"]
    ordering = ["-created_at"]
    queryset = InventoryTransaction.objects.select_related("product", "created_by")
