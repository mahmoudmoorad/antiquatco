
"""Authentication URL routes."""

from django.urls import path

from .views import (
    RegisterView,
    RegistrationVerifyView,
    LoginView,
    CustomTokenRefreshView,
    LogoutView,
    CurrentUserView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    OTPSendView,
    OTPVerifyView,
    LinkGuestOrdersView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path(
        "register/verify/",
        RegistrationVerifyView.as_view(),
        name="register_verify",
    ),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("otp/send/", OTPSendView.as_view(), name="otp_send"),
    path("otp/verify/", OTPVerifyView.as_view(), name="otp_verify"),
    path("link-guest-orders/", LinkGuestOrdersView.as_view(), name="link_guest_orders"),
]
