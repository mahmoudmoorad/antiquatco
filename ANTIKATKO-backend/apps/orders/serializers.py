"""
Serializers for Orders and Checkout.
Provides dual compatibility with existing frontend models and backend models.
"""
from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="product_name_en", read_only=True)
    nameAr = serializers.CharField(source="product_name_ar", read_only=True)
    price = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "name",
            "nameAr",
            "price",
            "product_id_snapshot",
            "product_name_en",
            "product_name_ar",
            "unit_price",
            "quantity",
            "line_subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_status = serializers.CharField(source="payment.status", read_only=True, default=None)
    paymentStatus = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    finalTotal = serializers.DecimalField(source="total", max_digits=12, decimal_places=2, read_only=True)
    shippingCost = serializers.DecimalField(source="shipping_fee", max_digits=10, decimal_places=2, read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "guest_access_token",
            "status",
            "status_display",
            "customer",
            "customer_name",
            "customer_email",
            "customer_phone",
            "shipping_governorate",
            "shipping_city",
            "shipping_street_address",
            "shipping_building",
            "shipping_floor",
            "shipping_apartment",
            "shipping_notes",
            "subtotal",
            "shipping_fee",
            "shippingCost",
            "discount_amount",
            "total",
            "finalTotal",
            "payment_method",
            "payment_status",
            "paymentStatus",
            "admin_notes",
            "cancellation_reason",
            "items",
            "created_at",
            "createdAt",
            "updated_at",
        ]
        read_only_fields = fields

    def get_customer(self, obj):
        return {
            "name": obj.customer_name,
            "email": obj.customer_email,
            "phone": obj.customer_phone,
            "city": obj.shipping_city,
            "address": obj.shipping_street_address,
            "notes": obj.shipping_notes,
        }

    def get_paymentStatus(self, obj):
        if hasattr(obj, "payment") and obj.payment:
            st = obj.payment.status
            mapping = {
                "PENDING": "Pending",
                "UNPAID": "Unpaid",
                "PAID": "Paid",
                "FAILED": "Failed",
            }
            return mapping.get(st, st)
        return "Unpaid" if obj.payment_method == "cash_on_delivery" else "Pending"


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False)
    id = serializers.IntegerField(required=False)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if "product_id" not in data and "id" in data:
            data["product_id"] = data["id"]
        return super().to_internal_value(data)

    def validate(self, attrs):
        if not attrs.get("product_id") and attrs.get("id"):
            attrs["product_id"] = attrs["id"]
        if not attrs.get("product_id"):
            raise serializers.ValidationError({"product_id": "This field is required."})
        return attrs


class CheckoutSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True)
    customer_name = serializers.CharField(max_length=150, required=False)
    customer_email = serializers.EmailField(required=False)
    customer_phone = serializers.CharField(max_length=20, required=False)
    shipping_governorate = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100, required=False)
    shipping_street_address = serializers.CharField(required=False)
    shipping_building = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_floor = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_apartment = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField()

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)

        # Support frontend aliases
        if "name" in data and not data.get("customer_name"):
            data["customer_name"] = str(data["name"]).strip()
        if "email" in data and not data.get("customer_email"):
            data["customer_email"] = str(data["email"]).strip()
        if "phone" in data and not data.get("customer_phone"):
            data["customer_phone"] = str(data["phone"]).strip()
        if "address" in data and not data.get("shipping_street_address"):
            data["shipping_street_address"] = str(data["address"]).strip()
        if "city" in data and not data.get("shipping_city"):
            data["shipping_city"] = str(data["city"]).strip()
        if "notes" in data and not data.get("shipping_notes"):
            data["shipping_notes"] = str(data["notes"]).strip()
        if "paymentMethod" in data and not data.get("payment_method"):
            data["payment_method"] = str(data["paymentMethod"]).strip()

        # Fallback governorate to city
        if not data.get("shipping_governorate"):
            data["shipping_governorate"] = data.get("shipping_city") or "Cairo"

        # Normalize payment method
        if "payment_method" in data and isinstance(data["payment_method"], str):
            pm = data["payment_method"].strip().lower()
            if pm in ("cod", "cash on delivery"):
                pm = "cash_on_delivery"
            elif pm in ("vodafone cash", "vodafone"):
                pm = "vodafone_cash"
            elif pm in ("insta pay", "insta_pay"):
                pm = "instapay"
            data["payment_method"] = pm

        return super().to_internal_value(data)

    def validate(self, attrs):
        for field in ["customer_name", "customer_email", "customer_phone", "shipping_street_address", "shipping_city"]:
            if not attrs.get(field):
                raise serializers.ValidationError({field: "This field is required."})

        valid_pms = [c[0] for c in Order.PaymentMethod.choices]
        if attrs.get("payment_method") not in valid_pms:
            raise serializers.ValidationError(
                {"payment_method": f"Invalid payment method. Choices are: {valid_pms}"}
            )

        if not attrs.get("shipping_governorate"):
            attrs["shipping_governorate"] = attrs.get("shipping_city") or "Cairo"

        return attrs


class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=True)


class AdminOrderStatusSerializer(serializers.Serializer):
    status = serializers.CharField(required=False, allow_blank=True)
    admin_notes = serializers.CharField(required=False, allow_blank=True)
    payment_status = serializers.CharField(required=False, allow_blank=True)

    def validate_status(self, value):
        if not value:
            return value
        val = value.strip().upper()
        valid = [c[0] for c in Order.Status.choices]
        if val not in valid:
            raise serializers.ValidationError(f"Invalid status '{value}'. Choices are: {valid}")
        return val