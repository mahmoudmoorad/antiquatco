"""
Serializers for Wishlist.
"""
from rest_framework import serializers
from apps.catalog.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "created_at"]
        read_only_fields = ["id", "created_at"]


class WishlistAddSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
