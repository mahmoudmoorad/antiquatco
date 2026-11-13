"""
Cart and CartItem models for ANTIKATKO.
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.catalog.models import Product


class Cart(models.Model):
    """
    Customer shopping cart. Exactly one active cart per authenticated customer.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"Cart of {self.user.email}"

    @property
    def subtotal(self) -> Decimal:
        """Calculate cart subtotal server-side based on current database prices."""
        total = Decimal("0.00")
        for item in self.items.select_related("product"):
            total += item.line_subtotal
        return total

    @property
    def items_count(self) -> int:
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """
    Item within a shopping cart.
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField("quantity", default=1)
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_cart_product"),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.quantity}x {self.product.name_en}"

    @property
    def line_subtotal(self) -> Decimal:
        return Decimal(self.quantity) * self.product.price
