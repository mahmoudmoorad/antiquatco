"""
Notification model for ANTIKATKO.
"""
from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        ORDER = "ORDER", "Order Update"
        PAYMENT = "PAYMENT", "Payment Update"
        INVENTORY = "INVENTORY", "Inventory Alert"
        SYSTEM = "SYSTEM", "System Notification"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    title = models.CharField("title", max_length=200)
    message = models.TextField("message")
    notification_type = models.CharField(
        "type",
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    is_read = models.BooleanField("is read", default=False)
    link_url = models.CharField("link url", max_length=255, blank=True)
    created_at = models.DateTimeField("created at", auto_now_add=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} -> {self.recipient.email if self.recipient else 'Broadcast'}"
