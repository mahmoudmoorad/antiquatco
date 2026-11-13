
from datetime import timedelta
import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")

        email = self.normalize_email(email)

        requested_role = extra_fields.pop("role", "CUSTOMER")
        requested_staff = extra_fields.pop("is_staff", False)
        requested_superuser = extra_fields.pop("is_superuser", False)

        if requested_role != "CUSTOMER":
            raise ValueError("Only CUSTOMER accounts can be created publicly.")

        if requested_staff or requested_superuser:
            raise ValueError("Public users cannot have admin privileges.")

        if not username:
            username = email.split("@")[0]

        base_username = username
        counter = 1

        while self.model.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = self.model(
            email=email,
            username=username,
            role="CUSTOMER",
            is_staff=False,
            is_superuser=False,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")

        email = self.normalize_email(email)

        if not username:
            username = email.split("@")[0]

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields["role"] = "ADMIN"

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        user = self.model(
            email=email,
            username=username,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
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
        choices=[
            ("CUSTOMER", "Customer"),
            ("ADMIN", "Admin"),
        ],
        default="CUSTOMER",
        db_index=True,
    )

    is_email_verified = models.BooleanField(
        "email verified",
        default=False,
    )

    is_phone_verified = models.BooleanField(
        "phone verified",
        default=False,
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    @property
    def is_admin_role(self):
        return self.role == "ADMIN"

    @property
    def is_customer_role(self):
        return self.role == "CUSTOMER"

    def __str__(self):
        return self.email


class GuestOrderLinkVerification(models.Model):
    verified_email = models.EmailField(
        "verified guest email",
    )

    orders_linked_count = models.PositiveIntegerField(
        "linked orders count",
        default=0,
    )

    created_at = models.DateTimeField(
        "linked at",
        auto_now_add=True,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="guest_links",
    )

    class Meta:
        verbose_name = "Guest Order Link"
        verbose_name_plural = "Guest Order Links"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.verified_email}"


class OTPVerification(models.Model):
    PURPOSE_CHOICES = [
        ("REGISTRATION", "Registration"),
        ("PASSWORD_RESET", "Password Reset"),
        ("PHONE_VERIFY", "Phone Verification"),
        ("GUEST_ORDER_LINK", "Guest Order Link"),
    ]

    identifier = models.CharField(
        "email or phone",
        max_length=255,
        db_index=True,
    )

    purpose = models.CharField(
        "purpose",
        max_length=30,
        choices=PURPOSE_CHOICES,
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
        settings.AUTH_USER_MODEL,
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
        expiry_minutes=10,
    ):
        otp = str(secrets.randbelow(900000) + 100000)

        cls.objects.filter(
            identifier=identifier,
            purpose=purpose,
            is_used=False,
        ).update(is_used=True)

        record = cls.objects.create(
            identifier=identifier,
            purpose=purpose,
            user=user,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + timedelta(minutes=expiry_minutes),
        )

        return record, otp

    def verify(self, otp, max_attempts=5):
        if self.is_used:
            return False

        if timezone.now() >= self.expires_at:
            return False

        if self.attempts >= max_attempts:
            self.is_used = True
            self.save(update_fields=["is_used"])
            return False

        self.attempts += 1
        is_valid = check_password(str(otp), self.otp_hash)

        if is_valid or self.attempts >= max_attempts:
            self.is_used = True

        self.save(update_fields=["attempts", "is_used"])

        return is_valid
