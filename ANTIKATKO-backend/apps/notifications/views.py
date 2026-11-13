"""
Notification views for ANTIKATKO.
"""
from rest_framework import serializers, generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from common.responses import success_response
from common.pagination import StandardResultsSetPagination
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "notification_type", "is_read", "link_url", "created_at"]


class NotificationListView(generics.ListAPIView):
    """Retrieve notifications for the authenticated user or admin broadcast."""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(Q(recipient=user) | Q(recipient__isnull=True)).order_by("-created_at")
        unread_only = self.request.query_params.get("unread_only")
        if unread_only and unread_only.lower() in ("true", "1"):
            queryset = queryset.filter(is_read=False)
        return queryset


class NotificationMarkReadView(APIView):
    """Mark a notification as read."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(
            Notification,
            Q(recipient=request.user) | Q(recipient__isnull=True),
            pk=pk,
        )
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return success_response(
            data=NotificationSerializer(notification).data,
            message="Notification marked as read.",
        )
