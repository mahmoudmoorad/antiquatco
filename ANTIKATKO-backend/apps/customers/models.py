"""
Customer profile and address models for ANTIKATKO.
"""
from django.db import models
from django.conf import settings


class CustomerProfile(models.Model):
    """
    Profile extension for customer accounts.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    avatar = models.ImageField("avatar", upload_to="avatars/%Y/%m/", null=True, blank=True)
    notes = models.TextField("customer notes", blank=True)
    date_of_birth = models.DateField("date of birth", null=True, blank=True)
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Customer Profile"
        verbose_name_plural = "Customer Profiles"

    def __str__(self):
        return f"Profile of {self.user.email}"


class CustomerAddress(models.Model):
    """
    Saved shipping addresses for registered customers.
    Enforces that only one address per customer can be default.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    title = models.CharField("address label", max_length=50, default="Home")
    recipient_name = models.CharField("recipient name", max_length=150)
    phone_number = models.CharField("phone number", max_length=20)
    governorate = models.CharField("governorate / state", max_length=100)
    city = models.CharField("city", max_length=100)
    street_address = models.TextField("street address")
    building_number = models.CharField("building number", max_length=50, blank=True)
    floor_number = models.CharField("floor number", max_length=50, blank=True)
    apartment_number = models.CharField("apartment number", max_length=50, blank=True)
    postal_code = models.CharField("postal code", max_length=20, blank=True)
    is_default = models.BooleanField("is default address", default=False)
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Customer Address"
        verbose_name_plural = "Customer Addresses"
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.title}: {self.recipient_name}, {self.city}"

    def save(self, *args, **kwargs):
        # If this address is set to default, unset default on other addresses of the user
        if self.is_default:
            CustomerAddress.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        # If this is the user's first address, make it default automatically
        elif not self.pk and not CustomerAddress.objects.filter(user=self.user).exists():
            self.is_default = True
        super().save(*args, **kwargs)
