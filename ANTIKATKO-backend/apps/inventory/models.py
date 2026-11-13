"""
Inventory tracking and auditing models for ANTIKATKO.
"""
from django.db import models
from django.conf import settings
from apps.catalog.models import Product


class InventoryTransaction(models.Model):
    """
    Immutable audit log of all stock changes across the catalog.
    Tracks adjustments, incoming stock, order deductions, and cancellations.
    """
    class TransactionType(models.TextChoices):
        STOCK_IN = "STOCK_IN", "Stock In / Restock"
        STOCK_OUT = "STOCK_OUT", "Stock Out / Write-off"
        STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT", "Manual Stock Adjustment"
        ORDER_DEDUCTION = "ORDER_DEDUCTION", "Order Placement Deduction"
        ORDER_RESTOCK = "ORDER_RESTOCK", "Order Cancellation Restock"

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="inventory_transactions",
    )
    transaction_type = models.CharField(
        "transaction type",
        max_length=30,
        choices=TransactionType.choices,
        db_index=True,
    )
    previous_stock = models.IntegerField("previous stock")
    quantity_change = models.IntegerField("quantity change")
    new_stock = models.IntegerField("new stock")
    reason = models.CharField("reason / note", max_length=255)
    related_order_number = models.CharField(
        "related order number",
        max_length=64,
        blank=True,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_actions",
    )
    created_at = models.DateTimeField("created at", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Inventory Transaction"
        verbose_name_plural = "Inventory Transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_type} on {self.product.name_en} ({self.quantity_change:+d}) -> {self.new_stock}"
