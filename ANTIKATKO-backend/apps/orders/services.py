"""
Order placement, calculation, inventory reservation, and cancellation services.
"""
from decimal import Decimal
import secrets
from django.db import transaction
from django.utils import timezone
from common.utils import generate_order_number
from common.exceptions import BusinessLogicError
from apps.catalog.models import Product
from apps.inventory.models import InventoryTransaction
from apps.cart.services import CartService
from .models import Order, OrderItem


class OrderService:
    @classmethod
    def create_order(cls, user, validated_data: dict) -> Order:
        """
        Creates a sales order with server-calculated totals and atomic stock deduction.
        Supports both registered customer and guest checkout.
        """
        items_data = validated_data.pop("items")
        if not items_data:
            raise BusinessLogicError(
                message="Order must contain at least one item.",
                errors={"items": ["No items provided for checkout."]},
            )

        order_number = generate_order_number()
        guest_access_token = secrets.token_urlsafe(32) if user is None else None

        # Flat shipping fee is 100 EGP
        shipping_fee = Decimal("100.00")
        discount_amount = Decimal("0.00")

        # Collect product IDs and sort deterministically to prevent deadlocks
        product_quantities = {item["product_id"]: item["quantity"] for item in items_data}
        sorted_product_ids = sorted(product_quantities.keys())

        with transaction.atomic():
            # Lock product rows
            products = {
                p.id: p
                for p in Product.objects.select_for_update().filter(id__in=sorted_product_ids)
            }

            # Verify all products exist and are active
            subtotal = Decimal("0.00")
            order_items_to_create = []

            for product_id in sorted_product_ids:
                if product_id not in products:
                    raise BusinessLogicError(
                        message=f"Product #{product_id} was not found.",
                        errors={"product_id": [f"Product #{product_id} does not exist."]},
                    )

                product = products[product_id]
                quantity = product_quantities[product_id]

                if not product.is_active or product.is_archived:
                    raise BusinessLogicError(
                        message=f"Product '{product.name_en}' is no longer available for purchase.",
                        errors={"product": [f"{product.name_en} is inactive or archived."]},
                        status_code=409,
                    )

                if product.stock < quantity:
                    raise BusinessLogicError(
                        message=f"Insufficient stock for '{product.name_en}'. Requested {quantity}, available {product.stock}.",
                        errors={"stock": [f"Requested {quantity}, available {product.stock}."]},
                        status_code=409,
                    )

                # Deduct stock atomically
                previous_stock = product.stock
                product.stock -= quantity
                product.save(update_fields=["stock", "updated_at"])

                # Audit inventory deduction
                InventoryTransaction.objects.create(
                    product=product,
                    transaction_type=InventoryTransaction.TransactionType.ORDER_DEDUCTION,
                    previous_stock=previous_stock,
                    quantity_change=-quantity,
                    new_stock=product.stock,
                    reason=f"Order {order_number} checkout deduction",
                    related_order_number=order_number,
                    created_by=user,
                )

                # Calculate item pricing from database
                line_subtotal = Decimal(quantity) * product.price
                subtotal += line_subtotal

                order_items_to_create.append(
                    {
                        "product": product,
                        "product_id_snapshot": product.id,
                        "product_name_en": product.name_en,
                        "product_name_ar": product.name_ar,
                        "unit_price": product.price,
                        "quantity": quantity,
                        "line_subtotal": line_subtotal,
                    }
                )

            total = subtotal + shipping_fee - discount_amount

            # Create Order
            order = Order.objects.create(
                order_number=order_number,
                user=user,
                guest_access_token=guest_access_token,
                status=Order.Status.PENDING,
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                discount_amount=discount_amount,
                total=total,
                **validated_data,
            )

            # Bulk create OrderItem records
            for item in order_items_to_create:
                OrderItem.objects.create(order=order, **item)

            # Create associated Payment record lazily to avoid circular imports
            from apps.payments.models import Payment

            # Determine initial payment status
            if order.payment_method == Order.PaymentMethod.CASH_ON_DELIVERY:
                initial_payment_status = Payment.Status.UNPAID
            else:
                initial_payment_status = Payment.Status.PENDING

            Payment.objects.create(
                order=order,
                payment_method=order.payment_method,
                status=initial_payment_status,
                amount=order.total,
            )

            # Clear cart if authenticated customer
            if user is not None:
                CartService.clear_cart(user)

        return order

    @classmethod
    def cancel_order(cls, order: Order, reason: str, user=None) -> Order:
        """
        Cancel an order and restore inventory exactly once.
        Only unfulfilled orders (PENDING, CONFIRMED, PROCESSING) are eligible.
        """
        if order.status == Order.Status.CANCELLED:
            raise BusinessLogicError(
                message="This order has already been cancelled.",
                errors={"order": ["Order is already cancelled."]},
                status_code=400,
            )

        if order.status in [Order.Status.SHIPPED, Order.Status.DELIVERED]:
            raise BusinessLogicError(
                message=f"Cannot cancel order in '{order.get_status_display()}' status. Please contact support.",
                errors={"status": [f"Ineligible status: {order.status}"]},
                status_code=400,
            )

        with transaction.atomic():
            locked_order = Order.objects.select_for_update().get(pk=order.pk)

            # Restore inventory if not already restored
            if not locked_order.is_stock_restored:
                for item in locked_order.items.select_related("product"):
                    if item.product:
                        product = Product.objects.select_for_update().get(pk=item.product.pk)
                        prev_stock = product.stock
                        product.stock += item.quantity
                        product.save(update_fields=["stock", "updated_at"])

                        InventoryTransaction.objects.create(
                            product=product,
                            transaction_type=InventoryTransaction.TransactionType.ORDER_RESTOCK,
                            previous_stock=prev_stock,
                            quantity_change=item.quantity,
                            new_stock=product.stock,
                            reason=f"Restock on Order {locked_order.order_number} cancellation",
                            related_order_number=locked_order.order_number,
                            created_by=user,
                        )

                locked_order.is_stock_restored = True

            locked_order.status = Order.Status.CANCELLED
            locked_order.cancellation_reason = reason
            locked_order.cancelled_at = timezone.now()
            locked_order.save(
                update_fields=["status", "cancellation_reason", "cancelled_at", "is_stock_restored", "updated_at"]
            )

            # Mark payment as failed if unpaid or pending
            if hasattr(locked_order, "payment"):
                payment = locked_order.payment
                if payment.status in ["PENDING", "UNPAID"]:
                    payment.status = "FAILED"
                    payment.rejection_reason = "Order was cancelled."
                    payment.save(update_fields=["status", "rejection_reason", "updated_at"])

        return locked_order
