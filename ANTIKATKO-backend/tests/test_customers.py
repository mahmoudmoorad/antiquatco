"""
Tests for Customer Profiles and Address management APIs.
"""
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.customers.models import CustomerAddress

User = get_user_model()


class CustomersApiTests(APITestCase):
    def setUp(self):
        self.customer1 = User.objects.create_user(
            email="cust1@antikatko.com",
            username="cust1",
            password="Password123!",
            role=User.Role.CUSTOMER,
        )
        self.customer2 = User.objects.create_user(
            email="cust2@antikatko.com",
            username="cust2",
            password="Password123!",
            role=User.Role.CUSTOMER,
        )
        self.admin_user = User.objects.create_superuser(
            email="admin@antikatko.com",
            username="adminuser",
            password="AdminPassword123!",
        )

        self.address_list_url = reverse("customers:address_list_create")
        self.profile_url = reverse("customers:profile")

    def test_customer_address_creation_and_auto_default(self):
        """First created address should automatically become the default address."""
        self.client.force_authenticate(user=self.customer1)
        addr_payload = {
            "title": "Home",
            "recipient_name": "Seif Taher",
            "phone_number": "+201012345678",
            "governorate": "Cairo",
            "city": "Nasr City",
            "street_address": "15 Abbas El Akkad St",
        }
        res = self.client.post(self.address_list_url, addr_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["data"]["is_default"])

    def test_single_default_address_enforcement(self):
        """Creating a new default address unsets default on earlier addresses."""
        self.client.force_authenticate(user=self.customer1)
        addr1 = CustomerAddress.objects.create(
            user=self.customer1,
            title="Home",
            recipient_name="Seif",
            phone_number="+20101",
            governorate="Cairo",
            city="Zamalek",
            street_address="Street 1",
            is_default=True,
        )

        addr2_payload = {
            "title": "Office",
            "recipient_name": "Seif Work",
            "phone_number": "+20102",
            "governorate": "Giza",
            "city": "Dokki",
            "street_address": "Street 2",
            "is_default": True,
        }
        res = self.client.post(self.address_list_url, addr2_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["data"]["is_default"])

        addr1.refresh_from_db()
        self.assertFalse(addr1.is_default)

    def test_customer_data_isolation(self):
        """A customer cannot access or delete another customer's address."""
        addr1 = CustomerAddress.objects.create(
            user=self.customer1,
            title="Private House",
            recipient_name="Cust 1",
            phone_number="+20101",
            governorate="Cairo",
            city="Maadi",
            street_address="Private St",
        )

        self.client.force_authenticate(user=self.customer2)
        detail_url = reverse("customers:address_detail", kwargs={"pk": addr1.pk})

        # Try GET
        res_get = self.client.get(detail_url)
        self.assertEqual(res_get.status_code, status.HTTP_404_NOT_FOUND)

        # Try DELETE
        res_del = self.client.delete(detail_url)
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(CustomerAddress.objects.filter(pk=addr1.pk).exists())

    def test_admin_customer_management_access(self):
        """Admin can list customers, ordinary customer receives 403."""
        admin_customers_url = "/api/v1/admin/customers/"

        # Customer access rejected
        self.client.force_authenticate(user=self.customer1)
        res_cust = self.client.get(admin_customers_url)
        self.assertEqual(res_cust.status_code, status.HTTP_403_FORBIDDEN)

        # Admin access accepted
        self.client.force_authenticate(user=self.admin_user)
        res_admin = self.client.get(admin_customers_url)
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertTrue(res_admin.data["success"])
        self.assertEqual(res_admin.data["data"]["count"], 2)  # cust1 and cust2
