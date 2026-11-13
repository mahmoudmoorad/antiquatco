from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPVerification, GuestOrderLinkVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "username", "role", "is_active", "is_staff", "date_joined"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["email", "username", "first_name", "last_name", "phone_number"]
    ordering = ["-date_joined"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("username", "first_name", "last_name", "phone_number")}),
        ("Permissions & Role", {"fields": ("role", "is_active", "is_staff", "is_superuser", "is_email_verified", "is_phone_verified")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ["identifier", "purpose", "is_used", "attempts", "expires_at", "created_at"]
    list_filter = ["purpose", "is_used"]
    search_fields = ["identifier"]


@admin.register(GuestOrderLinkVerification)
class GuestOrderLinkVerificationAdmin(admin.ModelAdmin):
    list_display = ["user", "verified_email", "orders_linked_count", "created_at"]
    search_fields = ["user__email", "verified_email"]
