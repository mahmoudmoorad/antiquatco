"""
Cart API Views for ANTIKATKO.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from common.responses import success_response
from common.permissions import IsCustomerUserRole
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    CartItemAddSerializer,
    CartItemUpdateSerializer,
    CartSyncSerializer,
)
from .services import CartService


class CartView(APIView):
    """Retrieve customer's active shopping cart and current totals."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def get(self, request):
        cart = CartService.get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return success_response(data=serializer.data)


class CartItemAddView(APIView):
    """Add a product to the cart with stock validation."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def post(self, request):
        serializer = CartItemAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart_item = CartService.add_item(
            user=request.user,
            product_id=serializer.validated_data["product_id"],
            quantity=serializer.validated_data["quantity"],
        )
        return success_response(
            data=CartItemSerializer(cart_item).data,
            message="Item added to cart.",
            status_code=status.HTTP_201_CREATED,
        )


class CartItemDetailView(APIView):
    """Update quantity or remove an item from the cart."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def patch(self, request, pk):
        serializer = CartItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart_item = CartService.update_item_quantity(
            user=request.user,
            item_id=pk,
            quantity=serializer.validated_data["quantity"],
        )
        return success_response(
            data=CartItemSerializer(cart_item).data,
            message="Cart item quantity updated.",
        )

    def delete(self, request, pk):
        CartService.remove_item(user=request.user, item_id=pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartClearView(APIView):
    """Clear all items from customer cart."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def post(self, request):
        CartService.clear_cart(request.user)
        return success_response(
            data={},
            message="Cart cleared successfully.",
        )


class CartSyncView(APIView):
    """Synchronize / merge guest cart upon login."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def post(self, request):
        serializer = CartSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = CartService.sync_guest_cart(
            user=request.user,
            guest_items=serializer.validated_data["items"],
        )
        return success_response(
            data=CartSerializer(cart).data,
            message="Guest cart synchronized successfully.",
        )
