"""
Tests for Cart and Wishlist APIs.
"""
from decimal import Decimal
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from apps.catalog.models import Category, Product
from apps.cart.models import Cart, CartItem
from apps.wishlist.models import WishlistItem

User = get_user_model()


class CartWishlistApiTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="cust@antikatko.com",
            username="cust",
            password="Password123!",
            role=User.Role.CUSTOMER,
        )
        self.other_customer = User.objects.create_user(
            email="other@antikatko.com",
            username="other",
            password="Password123!",
            role=User.Role.CUSTOMER,
        )

        self.category = Category.objects.create(
            name_en="Mirrors",
            name_ar="مرايا",
            slug="mirrors",
        )

        tiny_gif = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
            b"\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
            b"\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
        )
        self.dummy_image = SimpleUploadedFile("mirror.jpg", tiny_gif, content_type="image/jpeg")

        self.product = Product.objects.create(
            category=self.category,
            name_en="Gold Leaf Vintage Mirror",
            name_ar="مرآة أنتيك ذهبية",
            slug="gold-leaf-vintage-mirror",
            price=Decimal("3200.00"),
            stock=3,
            main_image=self.dummy_image,
            is_active=True,
        )

    def test_cart_workflow(self):
        """Test adding item, updating quantity, server-calculated totals, and clear cart."""
        self.client.force_authenticate(user=self.customer)

        # 1. Cart is initially empty
        res_get = self.client.get("/api/v1/cart/")
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.data["data"]["items_count"], 0)
        self.assertEqual(Decimal(str(res_get.data["data"]["subtotal"])), Decimal("0.00"))

        # 2. Add product to cart
        add_payload = {"product_id": self.product.id, "quantity": 2}
        res_add = self.client.post("/api/v1/cart/items/", add_payload)
        self.assertEqual(res_add.status_code, status.HTTP_201_CREATED)

        # 3. Check updated cart total: 2 * 3200 = 6400
        res_cart = self.client.get("/api/v1/cart/")
        self.assertEqual(res_cart.data["data"]["items_count"], 2)
        self.assertEqual(Decimal(str(res_cart.data["data"]["subtotal"])), Decimal("6400.00"))

        # 4. Over-stock validation: try adding 2 more (total 4 > stock 3) -> 400
        res_over = self.client.post("/api/v1/cart/items/", {"product_id": self.product.id, "quantity": 2})
        self.assertEqual(res_over.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res_over.data["success"])

        # 5. Clear cart
        res_clear = self.client.post("/api/v1/cart/clear/")
        self.assertEqual(res_clear.status_code, status.HTTP_200_OK)
        res_after = self.client.get("/api/v1/cart/")
        self.assertEqual(res_after.data["data"]["items_count"], 0)

    def test_cart_item_isolation(self):
        """Customer cannot alter another customer's cart items."""
        cart1 = Cart.objects.create(user=self.customer)
        item1 = CartItem.objects.create(cart=cart1, product=self.product, quantity=1)

        self.client.force_authenticate(user=self.other_customer)
        # Try PATCH
        res_patch = self.client.patch(f"/api/v1/cart/items/{item1.id}/", {"quantity": 2})
        self.assertEqual(res_patch.status_code, status.HTTP_404_NOT_FOUND)

        # Try DELETE
        res_del = self.client.delete(f"/api/v1/cart/items/{item1.id}/")
        self.assertEqual(res_del.status_code, status.HTTP_404_NOT_FOUND)

    def test_wishlist_workflow(self):
        """Test adding item, duplicate handling, and removing from wishlist."""
        self.client.force_authenticate(user=self.customer)

        # Add to wishlist
        res_add = self.client.post("/api/v1/wishlist/", {"product_id": self.product.id})
        self.assertEqual(res_add.status_code, status.HTTP_201_CREATED)
        self.assertTrue(WishlistItem.objects.filter(user=self.customer, product=self.product).exists())

        # Duplicate addition handled gracefully
        res_dup = self.client.post("/api/v1/wishlist/", {"product_id": self.product.id})
        self.assertEqual(res_dup.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.filter(user=self.customer, product=self.product).count(), 1)

        # List wishlist
        res_list = self.client.get("/api/v1/wishlist/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data["data"]), 1)

        # Remove from wishlist
        res_del = self.client.delete(f"/api/v1/wishlist/{self.product.id}/")
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WishlistItem.objects.filter(user=self.customer, product=self.product).exists())
