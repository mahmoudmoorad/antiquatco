"""
Tests for Accounts and Authentication APIs.
"""
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import OTPVerification

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.me_url = reverse("accounts:current_user")
        self.change_password_url = reverse("accounts:change_password")
        self.reset_request_url = reverse("accounts:password_reset_request")
        self.reset_confirm_url = reverse("accounts:password_reset_confirm")

        self.customer_data = {
            "email": "customer@antikatko.com",
            "username": "customer1",
            "password": "StrongPassword123!",
            "first_name": "Antika",
            "last_name": "Collector",
            "phone_number": "+201012345678",
        }

    def test_customer_registration_success(self):
        """Verify successful customer registration and JWT issuance."""
        response = self.client.post(self.register_url, self.customer_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("tokens", response.data["data"])
        self.assertIn("access", response.data["data"]["tokens"])
        self.assertEqual(response.data["data"]["user"]["role"], User.Role.CUSTOMER)

    def test_registration_prevents_admin_privilege_escalation(self):
        """Ensure a public user cannot register themselves as ADMIN."""
        payload = self.customer_data.copy()
        payload["email"] = "hacker@antikatko.com"
        payload["username"] = "hacker"
        payload["role"] = "ADMIN"

        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="hacker@antikatko.com")
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertFalse(user.is_staff)

    def test_customer_login_success(self):
        """Verify customer login with email and password."""
        user = User.objects.create_user(
            email=self.customer_data["email"],
            username=self.customer_data["username"],
            password=self.customer_data["password"],
        )
        payload = {
            "email": self.customer_data["email"],
            "password": self.customer_data["password"],
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("tokens", response.data["data"])
        self.assertIn("access", response.data["data"]["tokens"])

    def test_login_invalid_credentials_returns_401(self):
        """Verify invalid credentials return HTTP 401."""
        payload = {
            "email": "nonexistent@antikatko.com",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])

    def test_current_user_profile_and_update(self):
        """Verify GET and PATCH /api/v1/auth/me/."""
        user = User.objects.create_user(
            email=self.customer_data["email"],
            username=self.customer_data["username"],
            password=self.customer_data["password"],
            first_name="Initial",
        )
        self.client.force_authenticate(user=user)

        # GET
        res_get = self.client.get(self.me_url)
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.data["data"]["email"], user.email)

        # PATCH
        patch_payload = {"first_name": "UpdatedName", "phone_number": "+201099999999"}
        res_patch = self.client.patch(self.me_url, patch_payload)
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.first_name, "UpdatedName")
        self.assertEqual(user.phone_number, "+201099999999")

    def test_password_change_success_and_failure(self):
        """Verify password change with valid and invalid old password."""
        user = User.objects.create_user(
            email=self.customer_data["email"],
            username=self.customer_data["username"],
            password="OldPassword123!",
        )
        self.client.force_authenticate(user=user)

        # Invalid old password
        res_fail = self.client.post(
            self.change_password_url,
            {"old_password": "WrongOldPassword", "new_password": "BrandNewPassword123!"},
        )
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid old password
        res_success = self.client.post(
            self.change_password_url,
            {"old_password": "OldPassword123!", "new_password": "BrandNewPassword123!"},
        )
        self.assertEqual(res_success.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("BrandNewPassword123!"))

    def test_password_reset_flow(self):
        """Verify request password reset and confirm with OTP."""
        user = User.objects.create_user(
            email=self.customer_data["email"],
            username=self.customer_data["username"],
            password="OriginalPassword123!",
        )
        # Request reset
        res_req = self.client.post(self.reset_request_url, {"email": user.email})
        self.assertEqual(res_req.status_code, status.HTTP_200_OK)

        # Retrieve OTP record
        record = OTPVerification.objects.filter(
            identifier=user.email,
            purpose=OTPVerification.Purpose.PASSWORD_RESET,
        ).first()
        self.assertIsNotNone(record)

        # Simulate generating a known OTP to test confirm
        raw_otp = OTPVerification.generate_otp(
            identifier=user.email,
            purpose=OTPVerification.Purpose.PASSWORD_RESET,
            user=user,
        )

        confirm_payload = {
            "email": user.email,
            "otp": raw_otp,
            "new_password": "ResetPassword123!",
        }
        res_confirm = self.client.post(self.reset_confirm_url, confirm_payload)
        self.assertEqual(res_confirm.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("ResetPassword123!"))
