"""
Wishlist URL routes.
"""
from django.urls import path
from .views import WishlistListCreateView, WishlistDeleteView

app_name = "wishlist"

urlpatterns = [
    path("", WishlistListCreateView.as_view(), name="wishlist_list_create"),
    path("<int:product_id>/", WishlistDeleteView.as_view(), name="wishlist_delete"),
]
