from django.contrib import admin
from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name_en", "name_ar", "slug", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name_en", "name_ar", "slug"]
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name_en", "category", "price", "original_price", "stock", "is_active", "is_featured", "is_archived"]
    list_filter = ["is_active", "is_featured", "is_archived", "category"]
    search_fields = ["name_en", "name_ar", "slug"]
    prepopulated_fields = {"slug": ("name_en",)}
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ["product", "display_order", "created_at"]
    list_filter = ["product"]
