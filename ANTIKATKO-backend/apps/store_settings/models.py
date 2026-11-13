"""
Store Settings model for ANTIKATKO.
"""
from django.db import models


class StoreSetting(models.Model):
    key = models.CharField("setting key", max_length=100, unique=True, db_index=True)
    value = models.TextField("setting value")
    description = models.CharField("description", max_length=255, blank=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Store Setting"
        verbose_name_plural = "Store Settings"

    def __str__(self):
        return f"{self.key}: {self.value}"
