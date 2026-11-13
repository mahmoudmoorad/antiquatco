
"""
Custom user, OTP verification, pending registration, and guest order linking
models for ANTIKATKO.
"""

import secrets

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager for ANTIKATKO users."""

    use_in_migrations = True

    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("The email address is required.")

        email = self.normalize_email(email)
        role = extra_fields.get("role", "CUSTOMER")

        if role != "CUSTOMER":
            raise ValueError("Public user creation is restricted to customers.")

        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)

        user = self.model(
            email=email,
            username=username,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("role") != "ADMIN":
            raise ValueError("Superuser must have ADMIN role.")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            username=username,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user


class User(AbstractUser):
    """Custom ANTIKATKO user model."""

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        ADMIN = "ADMIN", "Admin"

    email = models.EmailField(
        "email address",
        unique=True,
        db_index=True,
    )

    username = models.CharField(
        "username",
        max_length=150,
        unique=True,
        db_index=True,
    )

    phone_number = models.CharField(
        "phone number",
        max_length=20,
        blank=True,
    )

    role = models.CharField(
        "role",
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
    )

    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN

    @property
    def is_customer_role(self):
        return self.role == self.Role.CUSTOMER


class PendingRegistration(models.Model):
    """Temporarily stores registration data until email verification."""

    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    password_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pending Registration"
        verbose_name_plural = "Pending Registrations"
        ordering = ["-updated_at"]

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def __str__(self):
        return self.email


class GuestOrderLinkVerification(models.Model):
    """Records guest orders linked to a verified customer account."""

    verified_email = models.EmailField("verified guest email")

    orders_linked_count = models.PositiveIntegerField(
        "linked orders count",
        default=0,
    )

    created_at = models.DateTimeField(
        "linked at",
        auto_now_add=True,
    )

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="guest_links",
    )

    class Meta:
        verbose_name = "Guest Order Link"
        verbose_name_plural = "Guest Order Links"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.verified_email} → {self.user.email}"


class OTPVerification(models.Model):
    """Stores hashed OTP codes for account verification workflows."""

    class Purpose(models.TextChoices):
        REGISTRATION = "REGISTRATION", "Registration"
        PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"
        PHONE_VERIFY = "PHONE_VERIFY", "Phone Verification"
        GUEST_ORDER_LINK = "GUEST_ORDER_LINK", "Guest Order Link"

    identifier = models.CharField(
        "email or phone",
        max_length=255,
        db_index=True,
    )

    purpose = models.CharField(
        "purpose",
        max_length=30,
        choices=Purpose.choices,
    )

    otp_hash = models.CharField(
        "hashed OTP",
        max_length=128,
    )

    expires_at = models.DateTimeField(
        "expiration time",
        db_index=True,
    )

    attempts = models.PositiveSmallIntegerField(
        "verification attempts",
        default=0,
    )

    is_used = models.BooleanField(
        "is used",
        default=False,
    )

    created_at = models.DateTimeField(
        "created at",
        auto_now_add=True,
    )

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="otp_records",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "OTP Verification"
        verbose_name_plural = "OTP Verifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["identifier", "purpose", "is_used"],
                name="accounts_ot_identif_8cf730_idx",
            ),
        ]

    def __str__(self):
        return f"{self.identifier} - {self.purpose}"

    @classmethod
    def generate_otp(
        cls,
        identifier,
        purpose,
        user=None,
        expiry_minutes=5,
    ):
        """Generate a new OTP and invalidate previous unused OTPs."""

        cls.objects.filter(
            identifier=identifier,
            purpose=purpose,
            is_used=False,
        ).update(is_used=True)

        otp = f"{secrets.randbelow(1000000):06d}"

        record = cls.objects.create(
            identifier=identifier,
            purpose=purpose,
            otp_hash=make_password(otp),
            expires_at=timezone.now()
            + timezone.timedelta(minutes=expiry_minutes),
            user=user,
        )

        return record, otp

    def verify_otp(self, otp, max_attempts=5):
        """Verify OTP while enforcing expiry and attempt limits."""

        if self.is_used:
            return False

        if timezone.now() >= self.expires_at:
            self.is_used = True
            self.save(update_fields=["is_used"])
            return False

        if self.attempts >= max_attempts:
            self.is_used = True
            self.save(update_fields=["is_used"])
            return False

        if not check_password(str(otp), self.otp_hash):
            self.attempts += 1

            update_fields = ["attempts"]

            if self.attempts >= max_attempts:
                self.is_used = True
                update_fields.append("is_used")

            self.save(update_fields=update_fields)
            return False

        self.is_used = True
        self.save(update_fields=["is_used"])
        return True
