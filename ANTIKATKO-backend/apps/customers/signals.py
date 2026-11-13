"""
Signals for CustomerProfile auto-creation.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import CustomerProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_customer_profile(sender, instance, created, **kwargs):
    """
    Automatically create CustomerProfile when a new User is created.
    """
    if created and instance.role == User.Role.CUSTOMER:
        CustomerProfile.objects.get_or_create(user=instance)
