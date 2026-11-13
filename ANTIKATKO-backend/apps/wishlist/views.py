"""
Wishlist API Views for ANTIKATKO.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from common.responses import success_response
from common.permissions import IsCustomerUserRole
from apps.catalog.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer, WishlistAddSerializer


class WishlistListCreateView(APIView):
    """Retrieve customer's wishlist or add an item."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related("product", "product__category")
        serializer = WishlistItemSerializer(items, many=True)
        return success_response(data=serializer.data)

    def post(self, request):
        serializer = WishlistAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = get_object_or_404(
            Product,
            pk=serializer.validated_data["product_id"],
            is_active=True,
            is_archived=False,
        )
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        return success_response(
            data=WishlistItemSerializer(item).data,
            message="Product added to wishlist." if created else "Product already in wishlist.",
            status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class WishlistDeleteView(APIView):
    """Remove a product from the wishlist by product ID."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def delete(self, request, product_id):
        WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
