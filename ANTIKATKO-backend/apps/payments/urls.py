"""
Customer Payment URL routes.
"""
from django.urls import path
from .views import PaymentDetailView, PaymentProofUploadView

app_name = "payments"

urlpatterns = [
    path("<str:order_number>/", PaymentDetailView.as_view(), name="payment_detail"),
    path("<str:order_number>/proof/", PaymentProofUploadView.as_view(), name="payment_proof_upload"),
]
