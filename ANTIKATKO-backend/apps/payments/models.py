"""
Payment models for ANTIKATKO.
Maintains payment status independently from order status.
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.orders.models import Order


class Payment(models.Model):
    """
    Payment record linked to a sales order.
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Verification"
        UNPAID = "UNPAID", "Unpaid"
        PAID = "PAID", "Paid / Verified"
        FAILED = "FAILED", "Failed / Rejected"

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment",
    )
    payment_method = models.CharField(
        "payment method",
        max_length=30,
        choices=Order.PaymentMethod.choices,
    )
    status = models.CharField(
        "payment status",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    amount = models.DecimalField("amount (EGP)", max_digits=12, decimal_places=2)
    transaction_reference = models.CharField(
        "transaction / transfer reference",
        max_length=120,
        blank=True,
        db_index=True,
    )
    proof_image = models.ImageField(
        "transfer screenshot",
        upload_to="payment_proofs/%Y/%m/",
        null=True,
        blank=True,
    )

    # Verification workflow
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_payments",
    )
    verification_timestamp = models.DateTimeField("verified at", null=True, blank=True)
    rejection_reason = models.TextField("rejection reason", blank=True)
    admin_notes = models.TextField("admin notes", blank=True)

    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment for {self.order.order_number}: {self.amount} EGP ({self.status})"


class PaymentProof(models.Model):
    """
    Detailed audit log for proof screenshot submissions (supports re-submissions).
    """
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="proof_submissions",
    )
    proof_image = models.ImageField("proof image", upload_to="payment_proofs/%Y/%m/")
    transaction_reference = models.CharField("transaction reference", max_length=120, blank=True)
    sender_info = models.CharField("sender phone / wallet / handle", max_length=255, blank=True)
    status = models.CharField("review status", max_length=20, choices=Status.choices, default=Status.PENDING)
    review_notes = models.TextField("review notes", blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    reviewed_at = models.DateTimeField("reviewed at", null=True, blank=True)
    submitted_at = models.DateTimeField("submitted at", auto_now_add=True)

    class Meta:
        verbose_name = "Payment Proof Submission"
        verbose_name_plural = "Payment Proof Submissions"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Proof for {self.payment.order.order_number} at {self.submitted_at}"
