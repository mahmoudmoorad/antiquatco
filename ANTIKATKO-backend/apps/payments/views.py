"""
Payment views for Customer Proof Upload and Admin Verification.
"""
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from common.responses import success_response
from common.permissions import IsAdminUserRole
from common.pagination import StandardResultsSetPagination
from common.exceptions import BusinessLogicError
from apps.orders.models import Order
from .models import Payment, PaymentProof
from .serializers import (
    PaymentSerializer,
    PaymentProofSerializer,
    PaymentProofUploadSerializer,
    PaymentVerifySerializer,
    PaymentRejectSerializer,
)
from .services import PaymentService


class PaymentDetailView(APIView):
    """Retrieve payment details for an order."""
    permission_classes = [AllowAny]

    def get(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        # Authorization check
        is_owner = request.user.is_authenticated and order.user == request.user
        is_admin = request.user.is_authenticated and (getattr(request.user, "is_admin_role", False) or request.user.is_staff)
        provided_token = request.headers.get("X-Guest-Token") or request.query_params.get("guest_token")
        is_authorized_guest = (
            order.user is None
            and order.guest_access_token
            and provided_token
            and order.guest_access_token == provided_token
        )

        if not (is_owner or is_admin or is_authorized_guest):
            raise BusinessLogicError(
                message="You do not have permission to view payment information for this order.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        payment = get_object_or_404(Payment, order=order)
        serializer = PaymentSerializer(payment)
        return success_response(data=serializer.data)


class PaymentProofUploadView(APIView):
    """Upload transfer proof screenshot for Vodafone Cash or InstaPay."""
    permission_classes = [AllowAny]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        # Authorization check
        is_owner = request.user.is_authenticated and order.user == request.user
        is_admin = request.user.is_authenticated and (getattr(request.user, "is_admin_role", False) or request.user.is_staff)
        provided_token = request.headers.get("X-Guest-Token") or request.query_params.get("guest_token")
        is_authorized_guest = (
            order.user is None
            and order.guest_access_token
            and provided_token
            and order.guest_access_token == provided_token
        )

        if not (is_owner or is_admin or is_authorized_guest):
            raise BusinessLogicError(
                message="You do not have permission to upload proof for this order.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = PaymentProofUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = get_object_or_404(Payment, order=order)
        proof = PaymentService.submit_proof(
            payment=payment,
            proof_image=serializer.validated_data["proof_image"],
            transaction_reference=serializer.validated_data.get("transaction_reference", ""),
            sender_info=serializer.validated_data.get("sender_info", ""),
        )

        return success_response(
            data=PaymentProofSerializer(proof).data,
            message="Payment proof uploaded successfully and queued for review.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminPaymentListView(generics.ListAPIView):
    """Admin view: list and filter payments requiring verification."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = PaymentSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "payment_method"]
    search_fields = ["order__order_number", "transaction_reference", "order__customer_email"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]
    queryset = Payment.objects.select_related("order").prefetch_related("proof_submissions")


class AdminPaymentDetailView(generics.RetrieveAPIView):
    """Admin view: inspect and update specific payment record."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = PaymentSerializer
    queryset = Payment.objects.select_related("order").prefetch_related("proof_submissions")

    def patch(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        new_status = request.data.get("status") or request.data.get("paymentStatus")
        admin_notes = request.data.get("admin_notes")
        if new_status:
            ps = str(new_status).strip().upper()
            valid_statuses = [c[0] for c in Payment.Status.choices]
            if ps in valid_statuses:
                payment.status = ps
                if ps == Payment.Status.PAID and payment.order and payment.order.status == Order.Status.PENDING:
                    payment.order.status = Order.Status.CONFIRMED
                    payment.order.save(update_fields=["status", "updated_at"])
            else:
                raise BusinessLogicError(message=f"Invalid payment status. Choices are {valid_statuses}")
        if admin_notes is not None:
            payment.admin_notes = admin_notes
        payment.save()
        return success_response(data=PaymentSerializer(payment).data, message=f"Payment status updated to {payment.status}.")


class AdminPaymentVerifyView(APIView):
    """Admin endpoint to approve and verify payment proof."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verified_payment = PaymentService.verify_payment(
            payment=payment,
            admin_user=request.user,
            admin_notes=serializer.validated_data.get("admin_notes", ""),
        )

        return success_response(
            data=PaymentSerializer(verified_payment).data,
            message="Payment verified successfully. Order marked as Confirmed.",
        )


class AdminPaymentRejectView(APIView):
    """Admin endpoint to reject payment proof."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        serializer = PaymentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rejected_payment = PaymentService.reject_payment(
            payment=payment,
            admin_user=request.user,
            rejection_reason=serializer.validated_data["rejection_reason"],
            admin_notes=serializer.validated_data.get("admin_notes", ""),
        )

        return success_response(
            data=PaymentSerializer(rejected_payment).data,
            message="Payment proof rejected. Payment status set to Failed.",
        )
