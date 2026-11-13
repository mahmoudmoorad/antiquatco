from django.urls import path
from .views import AdminCustomerListView, AdminCustomerDetailView

urlpatterns = [
    path("", AdminCustomerListView.as_view(), name="admin_customer_list"),
    path("<int:pk>/", AdminCustomerDetailView.as_view(), name="admin_customer_detail"),
]
