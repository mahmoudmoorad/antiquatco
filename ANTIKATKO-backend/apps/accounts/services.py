
"""
Authentication and account management services.
"""

import logging
import re
import uuid

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from common.exceptions import BusinessLogicError
from .models import (
    OTPVerification,
    GuestOrderLinkVerification,
    PendingRegistration,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class AuthenticationService:
    """Encapsulates authentication workflows and business rules."""

    @staticmethod
    def get_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["email"] = user.email

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    @staticmethod
    def send_verification_email(email, otp, purpose):
        if purpose == OTPVerification.Purpose.REGISTRATION:
            subject = "ANTIKATKO — Verify Your Email"
            message = (
                f"Your ANTIKATKO email verification code is: {otp}\n\n"
                "This code expires in 5 minutes.\n"
                "If you did not request this code, please ignore this email."
            )
        else:
            subject = "ANTIKATKO — Password Reset Code"
            message = (
                f"Your password reset verification code is: {otp}\n\n"
                "This code expires in 5 minutes."
            )

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(
                settings,
                "DEFAULT_FROM_EMAIL",
                "noreply@antikatko.com",
            ),
            recipient_list=[email],
            fail_silently=False,
        )

    @classmethod
    def request_registration(cls, validated_data):
        """Save temporary registration and send email OTP."""

        email = validated_data["email"].strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise BusinessLogicError(
                message="An account with this email already exists.",
                errors={
                    "email": ["An account with this email already exists."]
                },
                status_code=400,
            )

        name_parts = validated_data["name"].strip().split(None, 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        base_username = re.sub(
            r"[^a-zA-Z0-9_]",
            "",
            email.split("@")[0],
        )[:20] or "user"

        username = base_username

        while (
            User.objects.filter(username__iexact=username).exists()
            or PendingRegistration.objects.filter(
                username__iexact=username
            ).exclude(email=email).exists()
        ):
            username = f"{base_username}_{uuid.uuid4().hex[:6]}"

        with transaction.atomic():
            pending, _ = PendingRegistration.objects.update_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone_number": validated_data.get("phone_number", ""),
                    "password_hash": make_password(validated_data["password"]),
                },
            )

            record, raw_otp = OTPVerification.generate_otp(
                identifier=email,
                purpose=OTPVerification.Purpose.REGISTRATION,
                user=None,
                expiry_minutes=5,
            )

            try:
                cls.send_verification_email(
                    email,
                    raw_otp,
                    OTPVerification.Purpose.REGISTRATION,
                )
            except Exception as error:
                record.is_used = True
                record.save(update_fields=["is_used"])

                logger.exception(
                    "Registration verification email failed for %s.",
                    email,
                )

                raise BusinessLogicError(
                    message="Unable to send verification email. Please try again.",
                    errors={
                        "email": [
                            "Unable to send verification email. Please try again."
                        ]
                    },
                    status_code=503,
                ) from error

        return pending

    @classmethod
    def verify_registration(cls, email, otp):
        """Verify OTP and create the customer account atomically."""

        email = email.strip().lower()
        otp = str(otp).strip()

        with transaction.atomic():
            pending = (
                PendingRegistration.objects
                .select_for_update()
                .filter(email__iexact=email)
                .first()
            )

            if not pending:
                raise BusinessLogicError(
                    message="Registration request not found. Please register again.",
                    errors={
                        "email": [
                            "Registration request not found. Please register again."
                        ]
                    },
                    status_code=404,
                )

            if User.objects.filter(email__iexact=email).exists():
                raise BusinessLogicError(
                    message="An account with this email already exists.",
                    errors={
                        "email": ["An account with this email already exists."]
                    },
                    status_code=400,
                )

            otp_record = (
                OTPVerification.objects
                .select_for_update()
                .filter(
                    identifier=email,
                    purpose=OTPVerification.Purpose.REGISTRATION,
                    is_used=False,
                )
                .order_by("-created_at")
                .first()
            )

            if not otp_record or not otp_record.verify_otp(otp):
                raise BusinessLogicError(
                    message="Invalid or expired verification code.",
                    errors={
                        "otp": ["Invalid or expired verification code."]
                    },
                    status_code=400,
                )

            user = User.objects.create(
                email=email,
                username=pending.username,
                first_name=pending.first_name,
                last_name=pending.last_name,
                phone_number=pending.phone_number,
                password=pending.password_hash,
                role=User.Role.CUSTOMER,
                is_staff=False,
                is_superuser=False,
                is_active=True,
                is_email_verified=True,
            )

            pending.delete()

            tokens = cls.get_tokens_for_user(user)

        return {
            "user": user,
            "tokens": tokens,
        }

    @classmethod
    def login(cls, email, password):
        email = email.lower().strip()

        user = authenticate(
            username=email,
            password=password,
        )

        if not user:
            raise BusinessLogicError(
                message="Invalid email or password.",
                errors={
                    "non_field_errors": ["Invalid email or password."]
                },
                status_code=401,
            )

        if not user.is_active:
            raise BusinessLogicError(
                message="This account has been deactivated.",
                errors={
                    "non_field_errors": ["This account has been deactivated."]
                },
                status_code=403,
            )

        if (
            user.role == User.Role.CUSTOMER
            and not user.is_email_verified
        ):
            raise BusinessLogicError(
                message="Please verify your email before logging in.",
                errors={
                    "email": [
                        "Please verify your email before logging in."
                    ]
                },
                status_code=403,
            )

        return {
            "user": user,
            "tokens": cls.get_tokens_for_user(user),
        }

    @staticmethod
    def logout(refresh_token):
        if not refresh_token:
            raise BusinessLogicError(
                message="Refresh token is required for logout.",
                errors={"refresh": ["This field is required."]},
                status_code=400,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as error:
            raise BusinessLogicError(
                message="Invalid or expired token.",
                errors={"refresh": [str(error)]},
                status_code=400,
            )

    @staticmethod
    def change_password(user, old_password, new_password):
        if not user.check_password(old_password):
            raise BusinessLogicError(
                message="Current password is incorrect.",
                errors={
                    "old_password": ["Current password is incorrect."]
                },
                status_code=400,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

    @staticmethod
    def request_password_reset(email):
        email = email.lower().strip()

        user = User.objects.filter(email__iexact=email).first()

        if not user:
            raise BusinessLogicError(
                message="No account associated with this email.",
                errors={
                    "email": ["No account associated with this email."]
                },
                status_code=404,
            )

        record, raw_otp = OTPVerification.generate_otp(
            identifier=email,
            purpose=OTPVerification.Purpose.PASSWORD_RESET,
            user=user,
        )

        try:
            AuthenticationService.send_verification_email(
                email,
                raw_otp,
                OTPVerification.Purpose.PASSWORD_RESET,
            )
        except Exception as error:
            record.is_used = True
            record.save(update_fields=["is_used"])

            logger.exception(
                "Failed to send password reset email for user ID %s.",
                user.pk,
            )

            raise BusinessLogicError(
                message="Unable to send password reset email.",
                errors={"email": ["Unable to send password reset email."]},
                status_code=503,
            ) from error

    @staticmethod
    def confirm_password_reset(email, otp, new_password):
        email = email.lower().strip()
        otp = str(otp).strip()

        record = OTPVerification.objects.filter(
            identifier=email,
            purpose=OTPVerification.Purpose.PASSWORD_RESET,
            is_used=False,
        ).order_by("-created_at").first()

        if not record or not record.verify_otp(otp):
            raise BusinessLogicError(
                message="Invalid or expired verification code.",
                errors={"otp": ["Invalid or expired verification code."]},
                status_code=400,
            )

        user = User.objects.filter(email__iexact=email).first()

        if not user:
            raise BusinessLogicError(
                message="User not found.",
                errors={"email": ["No account associated with this email."]},
                status_code=404,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

    @staticmethod
    def send_otp(identifier, purpose, user=None):
        identifier = identifier.strip().lower()

        record, raw_otp = OTPVerification.generate_otp(
            identifier=identifier,
            purpose=purpose,
            user=user,
        )

        if purpose == OTPVerification.Purpose.PASSWORD_RESET:
            AuthenticationService.send_verification_email(
                identifier,
                raw_otp,
                purpose,
            )

        logger.info("OTP generated for purpose %s.", purpose)
        return raw_otp

    @staticmethod
    def verify_otp(identifier, purpose, otp):
        identifier = identifier.strip().lower()
        otp = str(otp).strip()

        record = OTPVerification.objects.filter(
            identifier=identifier,
            purpose=purpose,
            is_used=False,
        ).order_by("-created_at").first()

        if not record or not record.verify_otp(otp):
            raise BusinessLogicError(
                message="Invalid or expired verification code.",
                errors={"otp": ["Invalid or expired verification code."]},
                status_code=400,
            )

        return True

    @staticmethod
    def link_guest_orders(customer_user, verified_email, otp):
        verified_email = verified_email.strip().lower()

        AuthenticationService.verify_otp(
            identifier=verified_email,
            purpose=OTPVerification.Purpose.GUEST_ORDER_LINK,
            otp=otp,
        )

        from apps.orders.models import Order

        updated_count = Order.objects.filter(
            customer_email__iexact=verified_email,
            user__isnull=True,
        ).update(user=customer_user)

        GuestOrderLinkVerification.objects.create(
            user=customer_user,
            verified_email=verified_email,
            orders_linked_count=updated_count,
        )

        return updated_count
