
"""
Serializers for Category, Product, and ProductImage models.
Provides compatibility between frontend and backend field contracts.
"""

import base64
import uuid

from django.core.files.base import ContentFile
from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(
        source="products.count",
        read_only=True,
    )
    value = serializers.CharField(source="slug", read_only=True)
    name = serializers.CharField(source="name_en", required=False)
    nameAr = serializers.CharField(source="name_ar", required=False)

    class Meta:
        model = Category
        fields = [
            "id",
            "value",
            "name",
            "nameAr",
            "name_en",
            "name_ar",
            "slug",
            "description_en",
            "description_ar",
            "image",
            "is_active",
            "products_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "value",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "name_en": {"required": False},
            "name_ar": {"required": False},
        }

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)

        if "name_en" not in ret and data.get("name"):
            ret["name_en"] = data["name"].strip()

        if "name_ar" not in ret and data.get("nameAr"):
            ret["name_ar"] = data["nameAr"].strip()

        if not ret.get("name_en") and ret.get("name_ar"):
            ret["name_en"] = ret["name_ar"]

        if not ret.get("name_ar") and ret.get("name_en"):
            ret["name_ar"] = ret["name_en"]

        return ret


class CategoryMinimalSerializer(serializers.ModelSerializer):
    value = serializers.CharField(source="slug", read_only=True)
    name = serializers.CharField(source="name_en", read_only=True)
    nameAr = serializers.CharField(source="name_ar", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "value",
            "name",
            "nameAr",
            "name_en",
            "name_ar",
            "slug",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "alt_text",
            "display_order",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_image(self, obj):
        if not obj.image:
            return ""

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.image.url)

        return obj.image.url


class ProductListSerializer(serializers.ModelSerializer):
    category_details = CategoryMinimalSerializer(
        source="category",
        read_only=True,
    )
    in_stock = serializers.BooleanField(read_only=True)
    is_discounted = serializers.BooleanField(read_only=True)

    name = serializers.CharField(source="name_en", read_only=True)
    nameAr = serializers.CharField(source="name_ar", read_only=True)

    category = serializers.SerializerMethodField()
    categoryAr = serializers.SerializerMethodField()

    originalPrice = serializers.DecimalField(
        source="original_price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "nameAr",
            "name_en",
            "name_ar",
            "slug",
            "category",
            "categoryAr",
            "category_details",
            "price",
            "original_price",
            "originalPrice",
            "is_discounted",
            "stock",
            "in_stock",
            "image",
            "main_image",
            "is_active",
            "is_featured",
            "created_at",
        ]

    def get_category(self, obj):
        if obj.category:
            return obj.category.name_en or obj.category.slug
        return ""

    def get_categoryAr(self, obj):
        if obj.category:
            return obj.category.name_ar
        return ""

    def get_image(self, obj):
        if not obj.main_image:
            return ""

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.main_image.url)

        return obj.main_image.url


class ProductDetailSerializer(serializers.ModelSerializer):
    category_details = CategoryMinimalSerializer(
        source="category",
        read_only=True,
    )
    images = ProductImageSerializer(many=True, read_only=True)

    in_stock = serializers.BooleanField(read_only=True)
    is_discounted = serializers.BooleanField(read_only=True)

    name = serializers.CharField(source="name_en", read_only=True)
    nameAr = serializers.CharField(source="name_ar", read_only=True)

    description = serializers.CharField(
        source="description_en",
        read_only=True,
    )
    descriptionAr = serializers.CharField(
        source="description_ar",
        read_only=True,
    )

    category = serializers.SerializerMethodField()
    categoryAr = serializers.SerializerMethodField()

    originalPrice = serializers.DecimalField(
        source="original_price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "nameAr",
            "name_en",
            "name_ar",
            "slug",
            "description",
            "descriptionAr",
            "description_en",
            "description_ar",
            "category",
            "categoryAr",
            "category_details",
            "price",
            "original_price",
            "originalPrice",
            "is_discounted",
            "stock",
            "in_stock",
            "image",
            "main_image",
            "images",
            "is_active",
            "is_featured",
            "is_archived",
            "created_at",
            "updated_at",
        ]

    def get_category(self, obj):
        if obj.category:
            return obj.category.name_en or obj.category.slug
        return ""

    def get_categoryAr(self, obj):
        if obj.category:
            return obj.category.name_ar
        return ""

    def get_image(self, obj):
        if not obj.main_image:
            return ""

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.main_image.url)

        return obj.main_image.url


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    # Frontend compatibility fields.
    name = serializers.CharField(
        required=False,
        write_only=True,
    )
    nameAr = serializers.CharField(
        required=False,
        write_only=True,
    )
    description = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=True,
    )
    descriptionAr = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=True,
    )
    originalPrice = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        write_only=True,
        allow_null=True,
    )
    image = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "nameAr",
            "description",
            "descriptionAr",
            "originalPrice",
            "image",
            "name_en",
            "name_ar",
            "slug",
            "description_en",
            "description_ar",
            "price",
            "original_price",
            "stock",
            "main_image",
            "is_active",
            "is_featured",
            "is_archived",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "slug": {"required": False},
            "name_en": {"required": False},
            "name_ar": {"required": False},
            "main_image": {"required": False},
        }

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)

        # Resolve category from ID, slug, English name, or Arabic name.
        category_raw = data.get("category")

        if category_raw is not None:
            if isinstance(category_raw, str) and not category_raw.isdigit():
                category = (
                    Category.objects.filter(
                        slug__iexact=category_raw
                    ).first()
                    or Category.objects.filter(
                        name_en__iexact=category_raw
                    ).first()
                    or Category.objects.filter(
                        name_ar__iexact=category_raw
                    ).first()
                )

                if category:
                    data["category"] = category.id

        # Map frontend fields to actual model fields.
        aliases = {
            "name": "name_en",
            "nameAr": "name_ar",
            "description": "description_en",
            "descriptionAr": "description_ar",
            "originalPrice": "original_price",
        }

        for frontend_field, model_field in aliases.items():
            if model_field not in data and frontend_field in data:
                data[model_field] = data[frontend_field]

        # Handle image uploaded through the frontend "image" field.
        raw_image = data.get("image")

        if raw_image is not None:
            if hasattr(raw_image, "read"):
                data["main_image"] = raw_image

            elif (
                isinstance(raw_image, str)
                and raw_image.startswith("data:image/")
            ):
                try:
                    format_info, image_data = raw_image.split(
                        ";base64,",
                        1,
                    )

                    ext = format_info.split("/")[-1].split("+")[0]

                    if ext == "jpeg":
                        ext = "jpg"

                    filename = (
                        f"product_{uuid.uuid4().hex[:8]}.{ext}"
                    )

                    decoded_image = base64.b64decode(
                        image_data,
                        validate=True,
                    )

                    data["main_image"] = ContentFile(
                        decoded_image,
                        name=filename,
                    )

                except Exception:
                    raise serializers.ValidationError({
                        "image": "Invalid base64 image data."
                    })

        # Remove frontend-only fields before ModelSerializer validation.
        for frontend_field in (*aliases.keys(), "image"):
            data.pop(frontend_field, None)

        # A URL is not an uploaded file.
        # On update, keep the existing image if a URL was sent.
        main_image = data.get("main_image")

        if isinstance(main_image, str) and (
            main_image.startswith("http://")
            or main_image.startswith("https://")
            or main_image.startswith("/media/")
        ):
            data.pop("main_image", None)

        ret = super().to_internal_value(data)

        # Keep both language fields populated.
        if not ret.get("name_en") and ret.get("name_ar"):
            ret["name_en"] = ret["name_ar"]

        if not ret.get("name_ar") and ret.get("name_en"):
            ret["name_ar"] = ret["name_en"]

        return ret

    def validate(self, attrs):
        price = attrs.get("price")
        original_price = attrs.get("original_price")

        if price is not None and price < 0:
            raise serializers.ValidationError({
                "price": "Price cannot be negative."
            })

        if original_price is not None and original_price < 0:
            raise serializers.ValidationError({
                "original_price": "Original price cannot be negative."
            })

        # A new product must have an actual image.
        if not self.instance and not attrs.get("main_image"):
            raise serializers.ValidationError({
                "main_image": "A product image is required."
            })

        return attrs
