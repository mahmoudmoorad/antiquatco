"""
WishlistItem model for ANTIKATKO.
"""
from django.db import models
from django.conf import settings
from apps.catalog.models import Product


class WishlistItem(models.Model):
    """
    Customer wishlist item with unique customer/product constraint.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="wishlisted_by",
    )
    created_at = models.DateTimeField("created at", auto_now_add=True)

    class Meta:
        verbose_name = "Wishlist Item"
        verbose_name_plural = "Wishlist Items"
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="unique_user_wishlist_product"),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} -> {self.product.name_en}"
