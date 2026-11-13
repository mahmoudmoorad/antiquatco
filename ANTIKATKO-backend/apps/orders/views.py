"""
Order views for Customer Checkout, Order Details, Cancellation, and Admin Management.
"""
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q

from common.responses import success_response
from common.permissions import IsAdminUserRole, IsCustomerUserRole
from common.pagination import StandardResultsSetPagination
from common.exceptions import BusinessLogicError
from .models import Order
from .serializers import (
    OrderSerializer,
    CheckoutSerializer,
    OrderCancelSerializer,
    AdminOrderStatusSerializer,
)
from .services import OrderService


class CheckoutView(APIView):
    """
    Place a sales order.
    Available to both registered customers and guests.
    Server calculates subtotal, 100 EGP flat shipping, and total.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        order = OrderService.create_order(
            user=user,
            validated_data=serializer.validated_data,
        )

        return success_response(
            data=OrderSerializer(order).data,
            message="Order placed successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class CustomerOrderListView(generics.ListAPIView):
    """Retrieve logged-in customer's order history."""
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items").order_by("-created_at")


class OrderDetailView(APIView):
    """
    Retrieve single order by order_number.
    Authorized for:
    1. Authenticated customer owner (order.user == request.user)
    2. Guest checkout with matching guest_token header/query param
    3. Authenticated Admin user
    """
    permission_classes = [AllowAny]

    def get(self, request, order_number):
        order = get_object_or_404(
            Order.objects.prefetch_related("items"),
            order_number=order_number,
        )

        # Authorization check
        is_owner = request.user.is_authenticated and order.user == request.user
        is_admin = request.user.is_authenticated and (getattr(request.user, "is_admin_role", False) or request.user.is_staff)

        # Check guest token
        provided_token = request.headers.get("X-Guest-Token") or request.query_params.get("guest_token")
        is_authorized_guest = (
            order.user is None
            and order.guest_access_token
            and provided_token
            and order.guest_access_token == provided_token
        )

        if not (is_owner or is_admin or is_authorized_guest):
            raise BusinessLogicError(
                message="You do not have permission to view this order.",
                errors={"authorization": ["Guest token or account ownership required."]},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = OrderSerializer(order)
        return success_response(data=serializer.data)


class OrderCancelView(APIView):
    """Cancel an unfulfilled order and restore inventory."""
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
                message="You do not have permission to cancel this order.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        cancelled_order = OrderService.cancel_order(
            order=order,
            reason=serializer.validated_data["reason"],
            user=user,
        )

        return success_response(
            data=OrderSerializer(cancelled_order).data,
            message="Order cancelled successfully. Stock has been restored.",
        )


class AdminOrderListView(generics.ListAPIView):
    """Admin view: list and filter all orders."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = OrderSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "payment_method"]
    search_fields = ["order_number", "customer_name", "customer_email", "customer_phone"]
    ordering_fields = ["created_at", "total", "status"]
    ordering = ["-created_at"]
    queryset = Order.objects.prefetch_related("items").select_related("user")


class AdminOrderDetailView(generics.RetrieveDestroyAPIView):
    """Admin view: inspect or safely delete detailed order record."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = OrderSerializer
    queryset = Order.objects.prefetch_related("items").select_related("user")

    def delete(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status != Order.Status.CANCELLED and not order.is_stock_restored:
            OrderService.cancel_order(order=order, reason="Deleted by administrator.", user=request.user)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminOrderStatusUpdateView(APIView):
    """Admin endpoint to update order status and optional payment status."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = AdminOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data.get("status")
        admin_notes = serializer.validated_data.get("admin_notes")
        payment_status_input = serializer.validated_data.get("payment_status")

        # Update order status if provided
        if new_status:
            if new_status == Order.Status.CANCELLED and order.status != Order.Status.CANCELLED:
                order = OrderService.cancel_order(
                    order=order,
                    reason=admin_notes or "Cancelled by administrator.",
                    user=request.user,
                )
            else:
                order.status = new_status
                if admin_notes:
                    order.admin_notes = admin_notes
                order.save(update_fields=["status", "admin_notes", "updated_at"])

        # Update admin notes independently if status wasn't changed but notes were provided
        if not new_status and admin_notes:
            order.admin_notes = admin_notes
            order.save(update_fields=["admin_notes", "updated_at"])

        # Update payment status if provided
        if payment_status_input and hasattr(order, "payment") and order.payment:
            ps = payment_status_input.strip().upper()
            from apps.payments.models import Payment
            valid_ps = [c[0] for c in Payment.Status.choices]
            if ps in valid_ps:
                order.payment.status = ps
                order.payment.save(update_fields=["status", "updated_at"])

        return success_response(
            data=OrderSerializer(order).data,
            message="Order status updated successfully.",
        )