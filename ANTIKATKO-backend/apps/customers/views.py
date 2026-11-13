"""
Customer Profile, Address, and Admin Customer Management views.
"""
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Count

from common.responses import success_response
from common.permissions import IsAdminUserRole, IsCustomerUserRole, IsOwnerOrAdmin
from common.pagination import StandardResultsSetPagination
from .models import CustomerProfile, CustomerAddress
from .serializers import (
    CustomerProfileSerializer,
    CustomerAddressSerializer,
    AdminCustomerSerializer,
)

User = get_user_model()


class CustomerProfileView(APIView):
    """Retrieve or update logged-in customer's profile."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def get(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(user=request.user)
        serializer = CustomerProfileSerializer(profile)
        return success_response(data=serializer.data)

    def patch(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(user=request.user)
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=serializer.data,
            message="Profile updated successfully.",
        )


class CustomerAddressListCreateView(APIView):
    """List or create saved customer addresses."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def get(self, request):
        addresses = CustomerAddress.objects.filter(user=request.user)
        serializer = CustomerAddressSerializer(addresses, many=True)
        return success_response(data=serializer.data)

    def post(self, request):
        serializer = CustomerAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return success_response(
            data=serializer.data,
            message="Address added successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class CustomerAddressDetailView(APIView):
    """Retrieve, update, or delete a specific address."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def get_object(self, pk, user):
        return get_object_or_404(CustomerAddress, pk=pk, user=user)

    def get(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = CustomerAddressSerializer(address)
        return success_response(data=serializer.data)

    def patch(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = CustomerAddressSerializer(address, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=serializer.data,
            message="Address updated successfully.",
        )

    def delete(self, request, pk):
        address = self.get_object(pk, request.user)
        was_default = address.is_default
        address.delete()
        # If the deleted address was default, promote another address if one exists
        if was_default:
            next_addr = CustomerAddress.objects.filter(user=request.user).first()
            if next_addr:
                next_addr.is_default = True
                next_addr.save(update_fields=["is_default"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerAddressSetDefaultView(APIView):
    """Set address as default for the customer."""
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    def post(self, request, pk):
        address = get_object_or_404(CustomerAddress, pk=pk, user=request.user)
        address.is_default = True
        address.save()
        serializer = CustomerAddressSerializer(address)
        return success_response(
            data=serializer.data,
            message="Default address updated.",
        )


class AdminCustomerListView(generics.ListAPIView):
    """Admin view: list all registered customers with aggregate stats."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = AdminCustomerSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = User.objects.filter(role=User.Role.CUSTOMER).order_by("-date_joined")
        has_orders = any(f.name == "orders" for f in User._meta.get_fields())
        if has_orders:
            queryset = queryset.annotate(orders_count=Count("orders"))
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search)
                | models.Q(username__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
                | models.Q(phone_number__icontains=search)
            )
        return queryset


class AdminCustomerDetailView(generics.RetrieveAPIView):
    """Admin view: inspect detailed customer record."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = AdminCustomerSerializer
    queryset = User.objects.filter(role=User.Role.CUSTOMER)
