"""
Payment verification, proof submission, and audit services.
"""
from django.db import transaction
from django.utils import timezone
from common.exceptions import BusinessLogicError
from .models import Payment, PaymentProof


class PaymentService:
    @classmethod
    def submit_proof(
        cls,
        payment: Payment,
        proof_image,
        transaction_reference: str = "",
        sender_info: str = "",
    ) -> PaymentProof:
        """
        Record a payment transfer screenshot and transaction reference.
        Never auto-marks as PAID.
        """
        if payment.status == Payment.Status.PAID:
            raise BusinessLogicError(
                message="This payment has already been verified and marked as Paid.",
                errors={"payment": ["Payment is already verified."]},
                status_code=400,
            )

        with transaction.atomic():
            proof = PaymentProof.objects.create(
                payment=payment,
                proof_image=proof_image,
                transaction_reference=transaction_reference,
                sender_info=sender_info,
                status=PaymentProof.Status.PENDING,
            )

            payment.proof_image = proof_image
            payment.transaction_reference = transaction_reference
            payment.status = Payment.Status.PENDING
            payment.save(update_fields=["proof_image", "transaction_reference", "status", "updated_at"])

        return proof

    @classmethod
    def verify_payment(cls, payment: Payment, admin_user, admin_notes: str = "") -> Payment:
        """
        Admin manual verification. Transitions payment to PAID and advances order to CONFIRMED.
        """
        if payment.status == Payment.Status.PAID:
            raise BusinessLogicError(
                message="Payment is already verified.",
                errors={"payment": ["Already marked as PAID."]},
                status_code=400,
            )

        with transaction.atomic():
            payment.status = Payment.Status.PAID
            payment.verified_by = admin_user
            payment.verification_timestamp = timezone.now()
            if admin_notes:
                payment.admin_notes = admin_notes
            payment.save()

            # Mark associated pending proofs as ACCEPTED
            payment.proof_submissions.filter(status=PaymentProof.Status.PENDING).update(
                status=PaymentProof.Status.ACCEPTED,
                reviewed_by=admin_user,
                reviewed_at=timezone.now(),
            )

            # Advance Order status if still PENDING
            order = payment.order
            if order.status == "PENDING":
                order.status = "CONFIRMED"
                order.save(update_fields=["status", "updated_at"])

        return payment

    @classmethod
    def reject_payment(cls, payment: Payment, admin_user, rejection_reason: str, admin_notes: str = "") -> Payment:
        """
        Admin manual rejection of proof. Marks payment as FAILED.
        """
        with transaction.atomic():
            payment.status = Payment.Status.FAILED
            payment.rejection_reason = rejection_reason
            if admin_notes:
                payment.admin_notes = admin_notes
            payment.save()

            # Mark associated pending proofs as REJECTED
            payment.proof_submissions.filter(status=PaymentProof.Status.PENDING).update(
                status=PaymentProof.Status.REJECTED,
                reviewed_by=admin_user,
                reviewed_at=timezone.now(),
                review_notes=rejection_reason,
            )

        return payment
