"""
Newsletter subscription views.
"""
from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from common.responses import success_response
from common.permissions import IsAdminUserRole
from common.pagination import StandardResultsSetPagination
from .models import NewsletterSubscriber


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "is_active", "subscribed_at"]
        read_only_fields = ["id", "is_active", "subscribed_at"]


class NewsletterSubscribeView(APIView):
    """Public endpoint to subscribe email to newsletter."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email or "@" not in email:
            return Response(
                {"success": False, "message": "Valid email address is required.", "errors": {"email": ["Invalid email."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub, created = NewsletterSubscriber.objects.get_or_create(email=email)
        if not sub.is_active:
            sub.is_active = True
            sub.save(update_fields=["is_active"])

        return success_response(
            data={"email": sub.email, "subscribed_at": sub.subscribed_at},
            message="Thank you for subscribing to ANTIKATKO newsletter!" if created else "You are already subscribed to our newsletter.",
            status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class AdminNewsletterListView(generics.ListAPIView):
    """Admin endpoint to list subscribers."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    serializer_class = NewsletterSubscriberSerializer
    pagination_class = StandardResultsSetPagination
    queryset = NewsletterSubscriber.objects.all().order_by("-subscribed_at")
