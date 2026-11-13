"""
Filtering for Catalog Products using django-filter.
"""
from django.db import models
import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method="filter_category")
    category_id = django_filters.NumberFilter(field_name="category__id", lookup_expr="exact")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    is_featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["category", "category_id", "min_price", "max_price", "in_stock", "is_featured"]

    def filter_category(self, queryset, name, value):
        if not value or value.strip().lower() == "all":
            return queryset
        cleaned = value.strip()
        return queryset.filter(
            models.Q(category__slug__iexact=cleaned)
            | models.Q(category__name_en__iexact=cleaned)
            | models.Q(category__name_ar__iexact=cleaned)
        )

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock__gt=0)
        elif value is False:
            return queryset.filter(stock=0)
        return queryset
