"""
Contact message models for ANTIKATKO.
"""
from django.db import models


class ContactMessage(models.Model):
    name = models.CharField("sender name", max_length=150)
    email = models.EmailField("sender email")
    phone = models.CharField("sender phone", max_length=20, blank=True)
    subject = models.CharField("subject", max_length=200)
    message = models.TextField("message")
    is_read = models.BooleanField("is read", default=False)
    admin_notes = models.TextField("admin notes", blank=True)
    created_at = models.DateTimeField("submitted at", auto_now_add=True)

    class Meta:
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} from {self.name} ({self.email})"
