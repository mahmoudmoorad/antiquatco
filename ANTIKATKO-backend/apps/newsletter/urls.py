"""
Newsletter URL routes.
"""
from django.urls import path
from .views import NewsletterSubscribeView, AdminNewsletterListView

app_name = "newsletter"

urlpatterns = [
    path("subscribe/", NewsletterSubscribeView.as_view(), name="newsletter_subscribe"),
    path("admin/", AdminNewsletterListView.as_view(), name="admin_newsletter_list"),
]
