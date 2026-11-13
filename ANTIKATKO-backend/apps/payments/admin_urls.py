"""
Admin Payment Management URL routes.
"""
from django.urls import path
from .views import (
    AdminPaymentListView,
    AdminPaymentDetailView,
    AdminPaymentVerifyView,
    AdminPaymentRejectView,
)

urlpatterns = [
    path("", AdminPaymentListView.as_view(), name="admin_payment_list"),
    path("<int:pk>/", AdminPaymentDetailView.as_view(), name="admin_payment_detail"),
    path("<int:pk>/verify/", AdminPaymentVerifyView.as_view(), name="admin_payment_verify"),
    path("<int:pk>/reject/", AdminPaymentRejectView.as_view(), name="admin_payment_reject"),
]
