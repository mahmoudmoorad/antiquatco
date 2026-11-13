"""
Inventory service for atomic stock adjustments and transaction logging.
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from common.exceptions import BusinessLogicError
from apps.catalog.models import Product
from .models import InventoryTransaction


class InventoryService:
    @classmethod
    def adjust_stock(
        cls,
        product_id: int,
        quantity_change: int,
        transaction_type: str,
        reason: str,
        user=None,
        related_order_number: str = "",
    ) -> tuple[Product, InventoryTransaction]:
        """
        Atomically adjust product stock with row-level locking and transaction logging.
        Prevents negative stock under all circumstances.
        """
        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product_id)
            previous_stock = product.stock
            new_stock = previous_stock + quantity_change

            if new_stock < 0:
                raise BusinessLogicError(
                    message=f"Insufficient stock for {product.name_en}. Cannot reduce by {-quantity_change} from current stock of {previous_stock}.",
                    errors={"stock": [f"Current stock is {previous_stock}."]},
                )

            product.stock = new_stock
            product.save(update_fields=["stock", "updated_at"])

            log_entry = InventoryTransaction.objects.create(
                product=product,
                transaction_type=transaction_type,
                previous_stock=previous_stock,
                quantity_change=quantity_change,
                new_stock=new_stock,
                reason=reason,
                related_order_number=related_order_number,
                created_by=user,
            )

        return product, log_entry
