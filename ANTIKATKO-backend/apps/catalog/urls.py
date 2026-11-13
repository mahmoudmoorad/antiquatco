"""
Catalog URL routes for Categories, Products, and Product Images.
"""
from django.urls import path
from .views import (
    CategoryListView,
    CategoryDetailView,
    AdminCategoryCreateView,
    AdminCategoryUpdateDeleteView,
    ProductListView,
    ProductDetailView,
    AdminProductCreateView,
    AdminProductUpdateDeleteView,
    AdminProductImageUploadView,
    AdminProductImageDeleteView,
)

app_name = "catalog"

urlpatterns = [
    # Public Category routes
    path("categories/", CategoryListView.as_view(), name="category_list"),
    path("categories/<slug:slug>/", CategoryDetailView.as_view(), name="category_detail"),

    # Admin Category routes
    path("admin/categories/", AdminCategoryCreateView.as_view(), name="admin_category_create"),
    path("admin/categories/<int:pk>/", AdminCategoryUpdateDeleteView.as_view(), name="admin_category_detail"),

    # Public Product routes
    path("products/", ProductListView.as_view(), name="product_list"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product_detail"),

    # Admin Product routes
    path("admin/products/", AdminProductCreateView.as_view(), name="admin_product_create"),
    path("admin/products/<int:pk>/", AdminProductUpdateDeleteView.as_view(), name="admin_product_detail"),
    path("admin/products/<int:pk>/images/", AdminProductImageUploadView.as_view(), name="admin_product_image_upload"),
    path("admin/products/images/<int:pk>/", AdminProductImageDeleteView.as_view(), name="admin_product_image_delete"),
]
