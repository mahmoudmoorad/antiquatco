
"""
Serializers for accounts and authentication.
"""

import re
import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers

from .models import OTPVerification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="full_name", read_only=True)
    isAdmin = serializers.BooleanField(source="is_admin_role", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "isAdmin", "email", "username",
            "first_name", "last_name", "phone_number", "role",
            "is_email_verified", "is_phone_verified", "date_joined",
        ]
        read_only_fields = [
            "id", "name", "isAdmin", "role",
            "is_email_verified", "is_phone_verified", "date_joined",
        ]


class RegistrationSerializer(serializers.Serializer):
    """Validate registration details before sending the verification OTP."""

    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )

    def validate_email(self, value):
        normalized = value.strip().lower()

        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return normalized

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Name is required.")

        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_phone_number(self, value):
        return value.strip()


class RegistrationVerifySerializer(serializers.Serializer):
    """Verify registration OTP."""

    email = serializers.EmailField()
    otp = serializers.CharField(max_length=10)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_otp(self, value):
        return value.strip()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=10)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class OTPSendSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)
    purpose = serializers.ChoiceField(
        choices=OTPVerification.Purpose.choices
    )


class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)
    purpose = serializers.ChoiceField(
        choices=OTPVerification.Purpose.choices
    )
    otp = serializers.CharField(max_length=10)


class LinkGuestOrdersSerializer(serializers.Serializer):
    verified_email = serializers.EmailField()
    otp = serializers.CharField(max_length=10)
