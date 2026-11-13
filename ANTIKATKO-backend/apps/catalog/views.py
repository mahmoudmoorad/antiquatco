"""
Catalog views for Categories, Products, and Product Images.
"""
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q

from common.responses import success_response
from common.permissions import IsAdminUserRole
from common.pagination import StandardResultsSetPagination
from common.exceptions import BusinessLogicError
from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductImageSerializer,
)
from .filters import ProductFilter


# ==========================================
# CATEGORY VIEWS
# ==========================================

class CategoryListView(generics.ListAPIView):
    """Public list of active categories."""
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True).order_by("name_en")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class CategoryDetailView(APIView):
    """Public category detail by slug or id."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        lookup = Q(pk=slug) if str(slug).isdigit() else Q(slug=slug)
        category = get_object_or_404(Category, lookup, is_active=True)
        serializer = CategorySerializer(category)
        return success_response(data=serializer.data)


class AdminCategoryCreateView(APIView):
    """Admin endpoint to list all or create a new category."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        categories = Category.objects.all().order_by("name_en")
        serializer = CategorySerializer(categories, many=True)
        return success_response(data=serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(
            data=CategorySerializer(category).data,
            message="Category created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminCategoryUpdateDeleteView(APIView):
    """Admin endpoint to retrieve, update, or safely delete a category."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        return success_response(data=CategorySerializer(category).data)

    def patch(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(
            data=CategorySerializer(category).data,
            message="Category updated successfully.",
        )

    def delete(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        # Prevent deletion if active products are associated
        if category.products.filter(is_archived=False).exists():
            raise BusinessLogicError(
                message="Cannot delete category containing active products.",
                errors={"category": ["Please reassign or archive existing products before deleting this category."]},
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==========================================
# PRODUCT VIEWS
# ==========================================

class ProductListView(generics.ListAPIView):
    """
    Public paginated list of catalog products with multi-criteria filtering,
    search, and ordering.
    """
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name_en", "name_ar", "description_en", "description_ar"]
    ordering_fields = ["price", "created_at", "name_en", "stock"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(is_active=True, is_archived=False).select_related("category")


class ProductDetailView(APIView):
    """Public product detail by slug or primary key."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        lookup = Q(pk=slug) if str(slug).isdigit() else Q(slug=slug)
        product = get_object_or_404(
            Product.objects.select_related("category").prefetch_related("images"),
            lookup,
            is_active=True,
            is_archived=False,
        )
        serializer = ProductDetailSerializer(product, context={"request": request})
        return success_response(data=serializer.data)


class AdminProductCreateView(APIView):
    """Admin endpoint to list all products or create a new product."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        queryset = Product.objects.filter(is_archived=False).select_related("category").order_by("-created_at")
        search = request.query_params.get("search")
        if search:
            s = search.strip()
            queryset = queryset.filter(
                Q(name_en__icontains=s)
                | Q(name_ar__icontains=s)
                | Q(category__name_en__icontains=s)
                | Q(category__name_ar__icontains=s)
            )
        serializer = ProductListSerializer(queryset, many=True, context={"request": request})
        return success_response(data=serializer.data)

    def post(self, request):
        serializer = ProductCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return success_response(
            data=ProductDetailSerializer(product, context={"request": request}).data,
            message="Product created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminProductUpdateDeleteView(APIView):
    """Admin endpoint to view, update, or safe-delete/archive a product."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        return success_response(data=ProductDetailSerializer(product, context={"request": request}).data)

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductCreateUpdateSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return success_response(
            data=ProductDetailSerializer(product, context={"request": request}).data,
            message="Product updated successfully.",
        )

    def delete(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        # Check if product is referenced in order items
        has_orders = any(f.name == "order_items" for f in Product._meta.get_fields())
        if has_orders and product.order_items.exists():
            # Soft archive to preserve historical order records
            product.is_active = False
            product.is_archived = True
            product.save(update_fields=["is_active", "is_archived"])
            return success_response(
                data={},
                message="Product has order history; safely archived instead of deleted.",
                status_code=status.HTTP_200_OK,
            )
        else:
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductImageUploadView(APIView):
    """Admin endpoint to upload an additional gallery image."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        image_file = request.FILES.get("image")
        if not image_file:
            raise BusinessLogicError(
                message="Image file is required.",
                errors={"image": ["This field is required."]},
            )

        alt_text = request.data.get("alt_text", "")
        display_order = request.data.get("display_order", 0)

        product_image = ProductImage.objects.create(
            product=product,
            image=image_file,
            alt_text=alt_text,
            display_order=display_order,
        )
        return success_response(
            data=ProductImageSerializer(product_image).data,
            message="Image uploaded successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminProductImageDeleteView(APIView):
    """Admin endpoint to delete a gallery image."""
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def delete(self, request, pk):
        image = get_object_or_404(ProductImage, pk=pk)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
