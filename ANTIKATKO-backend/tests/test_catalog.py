"""
Tests for Catalog APIs (Categories, Products, Images, Filtering).
"""
from decimal import Decimal
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from apps.catalog.models import Category, Product, ProductImage

User = get_user_model()


class CatalogApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="admin@antikatko.com",
            username="admin",
            password="AdminPassword123!",
        )
        self.customer = User.objects.create_user(
            email="cust@antikatko.com",
            username="cust",
            password="Password123!",
            role=User.Role.CUSTOMER,
        )

        self.category = Category.objects.create(
            name_en="Vintage Chairs",
            name_ar="كراسي أنتيك",
            slug="vintage-chairs",
            description_en="Handmade classic chairs",
            description_ar="كراسي كلاسيكية مصنوعة يدوياً",
        )

        # 1x1 GIF dummy image
        tiny_gif = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
            b"\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
            b"\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
        )
        self.dummy_image = SimpleUploadedFile("chair.jpg", tiny_gif, content_type="image/jpeg")

        self.product1 = Product.objects.create(
            category=self.category,
            name_en="Victorian Armchair",
            name_ar="كرسي فكتوري",
            slug="victorian-armchair",
            price=Decimal("4500.00"),
            original_price=Decimal("5000.00"),
            stock=2,
            main_image=self.dummy_image,
            is_active=True,
            is_featured=True,
        )

        self.product2 = Product.objects.create(
            category=self.category,
            name_en="French Baroque Stool",
            name_ar="مقعد باروك فرنسي",
            slug="french-baroque-stool",
            price=Decimal("1800.00"),
            stock=0,  # Out of stock
            main_image=self.dummy_image,
            is_active=True,
        )

    def test_public_category_list_and_detail(self):
        """Anyone can list active categories and get detail by slug."""
        # List
        res_list = self.client.get("/api/v1/categories/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertTrue(res_list.data["success"])
        self.assertEqual(len(res_list.data["data"]), 1)

        # Detail
        res_detail = self.client.get(f"/api/v1/categories/{self.category.slug}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data["data"]["name_en"], "Vintage Chairs")

    def test_public_product_list_and_filtering(self):
        """Test public product filtering by in_stock and price."""
        # All active products
        res_all = self.client.get("/api/v1/products/")
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertEqual(res_all.data["data"]["count"], 2)

        # In stock only
        res_stock = self.client.get("/api/v1/products/?in_stock=true")
        self.assertEqual(res_stock.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stock.data["data"]["count"], 1)
        self.assertEqual(res_stock.data["data"]["results"][0]["slug"], "victorian-armchair")

        # Price filter: max_price=2000
        res_price = self.client.get("/api/v1/products/?max_price=2000")
        self.assertEqual(res_price.status_code, status.HTTP_200_OK)
        self.assertEqual(res_price.data["data"]["count"], 1)
        self.assertEqual(res_price.data["data"]["results"][0]["slug"], "french-baroque-stool")

    def test_admin_category_creation_and_safe_delete(self):
        """Admin can create category; cannot delete category with active products."""
        self.client.force_authenticate(user=self.admin_user)
        # Create
        create_payload = {
            "name_en": "Antique Clocks",
            "name_ar": "ساعات أنتيك",
            "slug": "antique-clocks",
        }
        res_create = self.client.post("/api/v1/admin/categories/", create_payload)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)

        # Attempt to delete category with active products -> 400
        res_del_fail = self.client.delete(f"/api/v1/admin/categories/{self.category.pk}/")
        self.assertEqual(res_del_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res_del_fail.data["success"])

    def test_customer_cannot_access_admin_catalog_apis(self):
        """Ordinary customer receives 403 when hitting admin endpoints."""
        self.client.force_authenticate(user=self.customer)
        res = self.client.post("/api/v1/admin/categories/", {"name_en": "Test", "name_ar": "تيست"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
