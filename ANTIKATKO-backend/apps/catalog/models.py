"""
Catalog models for ANTIKATKO: Categories, Products, and Product Images.
Supports bilingual content (Arabic / English) and enterprise preservation rules.
"""
from django.db import models
from django.utils.text import slugify
from common.utils import category_image_upload_path, product_image_upload_path, validate_image_file


class Category(models.Model):
    """
    Product categories with bilingual metadata.
    """
    name_en = models.CharField("English name", max_length=200)
    name_ar = models.CharField("Arabic name", max_length=200)
    slug = models.SlugField("slug", max_length=200, unique=True, db_index=True)
    description_en = models.TextField("English description", blank=True)
    description_ar = models.TextField("Arabic description", blank=True)
    image = models.ImageField(
        "category image",
        upload_to=category_image_upload_path,
        null=True,
        blank=True,
        validators=[validate_image_file],
    )
    is_active = models.BooleanField("is active", default=True, db_index=True)
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name_en"]

    def __str__(self):
        return f"{self.name_en} / {self.name_ar}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name_en) or "category"
            unique_slug = base_slug
            counter = 1
            while Category.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)


class Product(models.Model):
    """
    Catalog product with bilingual details, pricing, and stock tracking.
    Protected from unsafe deletion when referenced by orders.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    name_en = models.CharField("English name", max_length=255, db_index=True)
    name_ar = models.CharField("Arabic name", max_length=255, db_index=True)
    slug = models.SlugField("slug", max_length=255, unique=True, db_index=True)
    description_en = models.TextField("English description", blank=True)
    description_ar = models.TextField("Arabic description", blank=True)

    # Financials
    price = models.DecimalField("selling price (EGP)", max_digits=12, decimal_places=2, db_index=True)
    original_price = models.DecimalField(
        "original price (EGP)",
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Inventory & Status
    stock = models.PositiveIntegerField("stock quantity", default=0, db_index=True)
    main_image = models.ImageField(
        "main product image",
        upload_to=product_image_upload_path,
        validators=[validate_image_file],
    )
    is_active = models.BooleanField("is active", default=True, db_index=True)
    is_featured = models.BooleanField("is featured", default=False, db_index=True)
    is_archived = models.BooleanField("is archived", default=False, db_index=True)

    created_at = models.DateTimeField("created at", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(price__gte=0),
                name="product_price_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.name_en} ({self.price} EGP)"

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def is_discounted(self) -> bool:
        return bool(self.original_price and self.original_price > self.price)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name_en) or "antique-product"
            unique_slug = base_slug
            counter = 1
            while Product.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    """
    Additional gallery images for product presentation.
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(
        "gallery image",
        upload_to=product_image_upload_path,
        validators=[validate_image_file],
    )
    alt_text = models.CharField("alt text", max_length=255, blank=True)
    display_order = models.PositiveSmallIntegerField("display order", default=0)
    created_at = models.DateTimeField("created at", auto_now_add=True)

    class Meta:
        verbose_name = "Product Image"
        verbose_name_plural = "Product Images"
        ordering = ["display_order", "id"]

    def __str__(self):
        return f"Image for {self.product.name_en} (#{self.display_order})"
