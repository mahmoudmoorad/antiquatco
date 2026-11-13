"""
Newsletter subscriber model for ANTIKATKO.
"""
from django.db import models


class NewsletterSubscriber(models.Model):
    email = models.EmailField("subscriber email", unique=True, db_index=True)
    is_active = models.BooleanField("is active", default=True)
    subscribed_at = models.DateTimeField("subscribed at", auto_now_add=True)

    class Meta:
        verbose_name = "Newsletter Subscriber"
        verbose_name_plural = "Newsletter Subscribers"
        ordering = ["-subscribed_at"]

    def __str__(self):
        return self.email
