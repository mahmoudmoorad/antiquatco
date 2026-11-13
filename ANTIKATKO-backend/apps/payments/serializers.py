"""
Serializers for Payment and PaymentProof models.
"""
from rest_framework import serializers
from .models import Payment, PaymentProof


class PaymentProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProof
        fields = [
            "id",
            "proof_image",
            "transaction_reference",
            "sender_info",
            "status",
            "review_notes",
            "submitted_at",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_email = serializers.EmailField(source="order.customer_email", read_only=True)
    customer_name = serializers.CharField(source="order.customer_name", read_only=True)
    proof_submissions = PaymentProofSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order_number",
            "customer_name",
            "customer_email",
            "payment_method",
            "status",
            "amount",
            "transaction_reference",
            "proof_image",
            "proof_submissions",
            "verification_timestamp",
            "rejection_reason",
            "admin_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PaymentProofUploadSerializer(serializers.Serializer):
    proof_image = serializers.ImageField()
    transaction_reference = serializers.CharField(max_length=120, required=False, allow_blank=True)
    sender_info = serializers.CharField(max_length=255, required=False, allow_blank=True)


class PaymentVerifySerializer(serializers.Serializer):
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class PaymentRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(max_length=500, required=True)
    admin_notes = serializers.CharField(required=False, allow_blank=True)
