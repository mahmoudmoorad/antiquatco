from django.contrib import admin
from .models import CustomerProfile, CustomerAddress


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "date_of_birth", "created_at"]
    search_fields = ["user__email", "user__username"]


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "recipient_name", "city", "governorate", "is_default"]
    list_filter = ["governorate", "is_default"]
    search_fields = ["user__email", "recipient_name", "phone_number", "street_address"]
