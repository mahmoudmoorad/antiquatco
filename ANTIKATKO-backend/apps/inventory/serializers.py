"""
Serializers for Inventory and Stock Transactions.
"""
from rest_framework import serializers
from apps.catalog.models import Product
from .models import InventoryTransaction


class InventoryProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name_en", read_only=True)
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name_en",
            "name_ar",
            "slug",
            "category_name",
            "price",
            "stock",
            "status_label",
            "is_active",
            "updated_at",
        ]

    def get_status_label(self, obj) -> str:
        if obj.stock == 0:
            return "Out of Stock"
        elif obj.stock <= 3:
            return "Low Stock"
        return "In Stock"


class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name_en", read_only=True)
    admin_email = serializers.CharField(source="created_by.email", read_only=True, default=None)

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "product",
            "product_name",
            "transaction_type",
            "previous_stock",
            "quantity_change",
            "new_stock",
            "reason",
            "related_order_number",
            "admin_email",
            "created_at",
        ]


class StockAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity_change = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(
        choices=[
            InventoryTransaction.TransactionType.STOCK_IN,
            InventoryTransaction.TransactionType.STOCK_OUT,
            InventoryTransaction.TransactionType.STOCK_ADJUSTMENT,
        ]
    )
    reason = serializers.CharField(max_length=255)
