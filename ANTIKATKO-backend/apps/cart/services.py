"""
Cart management services for ANTIKATKO.
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from common.exceptions import BusinessLogicError
from apps.catalog.models import Product
from .models import Cart, CartItem


class CartService:
    @staticmethod
    def get_or_create_cart(user) -> Cart:
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @classmethod
    def add_item(cls, user, product_id: int, quantity: int = 1) -> CartItem:
        if quantity < 1:
            raise BusinessLogicError(
                message="Quantity must be at least 1.",
                errors={"quantity": ["Quantity must be at least 1."]},
            )

        cart = cls.get_or_create_cart(user)
        product = get_object_or_404(Product, pk=product_id, is_active=True, is_archived=False)

        with transaction.atomic():
            cart_item, created = CartItem.objects.select_for_update().get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": quantity},
            )

            if not created:
                total_qty = cart_item.quantity + quantity
                if total_qty > product.stock:
                    raise BusinessLogicError(
                        message=f"Cannot add {quantity} more. Only {product.stock} in stock.",
                        errors={"stock": [f"Available stock is {product.stock}."]},
                    )
                cart_item.quantity = total_qty
                cart_item.save(update_fields=["quantity", "updated_at"])
            else:
                if quantity > product.stock:
                    raise BusinessLogicError(
                        message=f"Requested quantity ({quantity}) exceeds available stock ({product.stock}).",
                        errors={"stock": [f"Available stock is {product.stock}."]},
                    )

        return cart_item

    @classmethod
    def update_item_quantity(cls, user, item_id: int, quantity: int) -> CartItem:
        if quantity < 1:
            raise BusinessLogicError(
                message="Quantity must be at least 1.",
                errors={"quantity": ["Quantity must be at least 1."]},
            )

        cart = cls.get_or_create_cart(user)
        cart_item = get_object_or_404(CartItem.objects.select_related("product"), pk=item_id, cart=cart)

        if quantity > cart_item.product.stock:
            raise BusinessLogicError(
                message=f"Requested quantity ({quantity}) exceeds available stock ({cart_item.product.stock}).",
                errors={"stock": [f"Available stock is {cart_item.product.stock}."]},
            )

        cart_item.quantity = quantity
        cart_item.save(update_fields=["quantity", "updated_at"])
        return cart_item

    @classmethod
    def remove_item(cls, user, item_id: int):
        cart = cls.get_or_create_cart(user)
        cart_item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        cart_item.delete()

    @classmethod
    def clear_cart(cls, user):
        cart = cls.get_or_create_cart(user)
        cart.items.all().delete()

    @classmethod
    def sync_guest_cart(cls, user, guest_items: list) -> Cart:
        """
        Merge guest cart items into authenticated user's cart.
        """
        cart = cls.get_or_create_cart(user)
        for item in guest_items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
            try:
                cls.add_item(user=user, product_id=product_id, quantity=quantity)
            except BusinessLogicError:
                # If an item exceeds stock, skip or add max available
                continue
        return cart
