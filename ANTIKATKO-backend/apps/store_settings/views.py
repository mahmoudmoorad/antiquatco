"""
Store settings views for public configuration and administrative updates.
"""
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from common.responses import success_response
from common.permissions import IsAdminUserRole
from .models import StoreSetting


class StoreSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSetting
        fields = ["key", "value", "description", "updated_at"]


class PublicStoreSettingsView(APIView):
    """Public endpoint to fetch store parameters (shipping fee, contact numbers, payment addresses)."""
    permission_classes = [AllowAny]

    def get(self, request):
        defaults = {
            "shipping_fee": "100.00",
            "currency": "EGP",
            "store_phone": "+201012345678",
            "store_email": "info@antikatko.com",
            "vodafone_cash_number": "+201012345678",
            "instapay_address": "antikatko@instapay",
            "store_address_en": "15 Zamalek Antique Row, Cairo, Egypt",
            "store_address_ar": "١٥ شارع التحف والانتيكات، الزمالك، القاهرة",
        }

        # Seed defaults if empty
        if not StoreSetting.objects.exists():
            for k, v in defaults.items():
                StoreSetting.objects.get_or_create(key=k, defaults={"value": v})

        settings_dict = {s.key: s.value for s in StoreSetting.objects.all()}
        return success_response(data=settings_dict)


class AdminStoreSettingsUpdateView(APIView):
    """Admin endpoint to update store configuration."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def patch(self, request):
        updated = {}
        for key, value in request.data.items():
            setting, _ = StoreSetting.objects.update_or_create(
                key=key,
                defaults={"value": str(value)},
            )
            updated[setting.key] = setting.value

        return success_response(
            data=updated,
            message="Store settings updated successfully.",
        )
