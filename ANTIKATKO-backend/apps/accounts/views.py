
"""
Authentication and account API views for ANTIKATKO.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from common.responses import success_response
from common.permissions import IsCustomerUserRole

from .serializers import (
    UserSerializer,
    RegistrationSerializer,
    RegistrationVerifySerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    OTPSendSerializer,
    OTPVerifySerializer,
    LinkGuestOrdersSerializer,
)

from .services import AuthenticationService


class RegisterView(APIView):
    """Start registration by sending an email verification OTP."""

    permission_classes = [AllowAny]

    @extend_schema(
        request=RegistrationSerializer,
        responses={200: OpenApiResponse(description="Verification code sent")},
    )
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.request_registration(
            serializer.validated_data
        )

        return success_response(
            data={"email": serializer.validated_data["email"]},
            message="Verification code sent to your email.",
            status_code=status.HTTP_200_OK,
        )


class RegistrationVerifyView(APIView):
    """Verify registration OTP and create the customer account."""

    permission_classes = [AllowAny]

    @extend_schema(
        request=RegistrationVerifySerializer,
        responses={201: OpenApiResponse(description="Account created")},
    )
    def post(self, request):
        serializer = RegistrationVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthenticationService.verify_registration(
            email=serializer.validated_data["email"],
            otp=serializer.validated_data["otp"],
        )

        data = {
            "user": UserSerializer(result["user"]).data,
            "tokens": result["tokens"],
        }

        return success_response(
            data=data,
            message="Email verified and account created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Authenticate customer or admin user using email and password."""

    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: OpenApiResponse(description="Login successful")},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthenticationService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        data = {
            "user": UserSerializer(result["user"]).data,
            "tokens": result["tokens"],
        }

        return success_response(
            data=data,
            message="Logged in successfully.",
            status_code=status.HTTP_200_OK,
        )


class CustomTokenRefreshView(TokenRefreshView):
    """Refresh JWT access token."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            return success_response(
                data=response.data,
                message="Token refreshed successfully.",
            )

        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        AuthenticationService.logout(request.data.get("refresh"))

        return success_response(
            data={},
            message="Logged out successfully.",
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        return success_response(
            data=UserSerializer(request.user).data
        )

    @extend_schema(request=ProfileUpdateSerializer)
    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return success_response(
            data=UserSerializer(request.user).data,
            message="Profile updated successfully.",
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
        )

        return success_response(
            data={},
            message="Password changed successfully.",
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=PasswordResetRequestSerializer)
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.request_password_reset(
            serializer.validated_data["email"]
        )

        return success_response(
            data={},
            message="Verification code sent.",
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=PasswordResetConfirmSerializer)
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.confirm_password_reset(
            email=serializer.validated_data["email"],
            otp=serializer.validated_data["otp"],
            new_password=serializer.validated_data["new_password"],
        )

        return success_response(
            data={},
            message="Password has been reset successfully.",
        )


class OTPSendView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=OTPSendSerializer)
    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None

        AuthenticationService.send_otp(
            identifier=serializer.validated_data["identifier"],
            purpose=serializer.validated_data["purpose"],
            user=user,
        )

        return success_response(
            data={},
            message="Verification code sent successfully.",
        )


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=OTPVerifySerializer)
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.verify_otp(
            identifier=serializer.validated_data["identifier"],
            purpose=serializer.validated_data["purpose"],
            otp=serializer.validated_data["otp"],
        )

        return success_response(
            data={"verified": True},
            message="Verification code validated successfully.",
        )


class LinkGuestOrdersView(APIView):
    permission_classes = [IsAuthenticated, IsCustomerUserRole]

    @extend_schema(request=LinkGuestOrdersSerializer)
    def post(self, request):
        serializer = LinkGuestOrdersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        count = AuthenticationService.link_guest_orders(
            customer_user=request.user,
            verified_email=serializer.validated_data["verified_email"],
            otp=serializer.validated_data["otp"],
        )

        return success_response(
            data={"linked_orders_count": count},
            message=f"Successfully linked {count} past orders to your account.",
        )
