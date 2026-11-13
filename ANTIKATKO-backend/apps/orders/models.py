"""
Order and OrderItem models for ANTIKATKO.
Preserves immutable snapshots of historical order data.
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.catalog.models import Product


class Order(models.Model):
    """
    Sales order supporting both registered customer and guest checkout.
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentMethod(models.TextChoices):
        VODAFONE_CASH = "vodafone_cash", "Vodafone Cash"
        INSTAPAY = "instapay", "InstaPay"
        CASH_ON_DELIVERY = "cash_on_delivery", "Cash on Delivery"

    order_number = models.CharField(
        "order number",
        max_length=64,
        unique=True,
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    guest_access_token = models.CharField(
        "guest access token",
        max_length=128,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
    )
    status = models.CharField(
        "order status",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # Customer Contact Snapshot
    customer_name = models.CharField("customer full name", max_length=150)
    customer_email = models.EmailField("customer email", db_index=True)
    customer_phone = models.CharField("customer phone", max_length=20, db_index=True)

    # Shipping Address Snapshot
    shipping_governorate = models.CharField("governorate", max_length=100)
    shipping_city = models.CharField("city", max_length=100)
    shipping_street_address = models.TextField("street address")
    shipping_building = models.CharField("building", max_length=50, blank=True)
    shipping_floor = models.CharField("floor", max_length=50, blank=True)
    shipping_apartment = models.CharField("apartment", max_length=50, blank=True)
    shipping_notes = models.TextField("delivery notes", blank=True)

    # Financial Totals (Strictly server calculated)
    subtotal = models.DecimalField("subtotal (EGP)", max_digits=12, decimal_places=2)
    shipping_fee = models.DecimalField("shipping fee (EGP)", max_digits=10, decimal_places=2, default=Decimal("100.00"))
    discount_amount = models.DecimalField("discount amount (EGP)", max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField("final total (EGP)", max_digits=12, decimal_places=2)

    payment_method = models.CharField(
        "payment method",
        max_length=30,
        choices=PaymentMethod.choices,
    )

    # Workflow & History
    admin_notes = models.TextField("internal admin notes", blank=True)
    cancellation_reason = models.TextField("cancellation reason", blank=True)
    cancelled_at = models.DateTimeField("cancelled at", null=True, blank=True)
    is_stock_restored = models.BooleanField("is inventory restored", default=False)

    created_at = models.DateTimeField("placed at", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.order_number} ({self.get_status_display()}) - {self.total} EGP"


class OrderItem(models.Model):
    """
    Immutable line item snapshot of an ordered product.
    Guarantees financial and product name fidelity even if catalog changes.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    # Immutable historical snapshots
    product_id_snapshot = models.PositiveIntegerField("historical product ID")
    product_name_en = models.CharField("historical English name", max_length=255)
    product_name_ar = models.CharField("historical Arabic name", max_length=255)
    unit_price = models.DecimalField("unit price (EGP)", max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField("quantity", default=1)
    line_subtotal = models.DecimalField("line subtotal (EGP)", max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.quantity}x {self.product_name_en} @ {self.unit_price} EGP"
