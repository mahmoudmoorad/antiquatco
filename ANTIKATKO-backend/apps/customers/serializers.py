"""
Serializers for Customer Profiles and Addresses.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum, Max, Count
from .models import CustomerProfile, CustomerAddress

User = get_user_model()


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Customer profile serializer."""
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "avatar",
            "date_of_birth",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "email", "username", "created_at", "updated_at"]


class CustomerAddressSerializer(serializers.ModelSerializer):
    """Customer address serializer."""
    class Meta:
        model = CustomerAddress
        fields = [
            "id",
            "title",
            "recipient_name",
            "phone_number",
            "governorate",
            "city",
            "street_address",
            "building_number",
            "floor_number",
            "apartment_number",
            "postal_code",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminCustomerSerializer(serializers.ModelSerializer):
    """Admin customer management view with order stats."""
    total_orders = serializers.SerializerMethodField()
    total_purchases = serializers.SerializerMethodField()
    last_order_date = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "is_email_verified",
            "is_phone_verified",
            "date_joined",
            "total_orders",
            "total_purchases",
            "last_order_date",
        ]

    def get_total_orders(self, obj) -> int:
        if hasattr(obj, "orders"):
            return getattr(obj, "orders_count", None) or obj.orders.count()
        return 0

    def get_total_purchases(self, obj) -> float:
        if hasattr(obj, "orders"):
            paid_orders = obj.orders.filter(payment__status="PAID")
            total = paid_orders.aggregate(total=Sum("total"))["total"]
            return float(total) if total else 0.0
        return 0.0

    def get_last_order_date(self, obj):
        if hasattr(obj, "orders"):
            last_order = obj.orders.order_by("-created_at").first()
            return last_order.created_at if last_order else None
        return None
