"""
Contact message serializers and views for ANTIKATKO.
"""
from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from common.responses import success_response
from common.permissions import IsAdminUserRole
from common.pagination import StandardResultsSetPagination
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "is_read", "admin_notes", "created_at"]
        read_only_fields = ["id", "is_read", "admin_notes", "created_at"]


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "is_read", "admin_notes", "created_at"]


class ContactSubmitView(APIView):
    """Public endpoint to submit a contact inquiry."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save()
        return success_response(
            data=ContactMessageSerializer(message).data,
            message="Your message has been submitted successfully. We will contact you soon.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminContactListView(generics.ListAPIView):
    """Admin endpoint to list contact messages."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = ContactMessageAdminSerializer
    pagination_class = StandardResultsSetPagination
    queryset = ContactMessage.objects.all().order_by("-created_at")


class AdminContactDetailView(generics.RetrieveUpdateAPIView):
    """Admin endpoint to view and update contact message status."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = ContactMessageAdminSerializer
    queryset = ContactMessage.objects.all()
