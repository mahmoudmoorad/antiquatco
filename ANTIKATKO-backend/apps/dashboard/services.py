"""
Dashboard analytics and aggregation services for ANTIKATKO Admin.
"""
from decimal import Decimal
from django.db.models import Sum, Count, F, Q
from apps.catalog.models import Product, Category
from apps.accounts.models import User
from apps.orders.models import Order, OrderItem


class DashboardService:
    @staticmethod
    def get_overview_metrics() -> dict:
        total_products = Product.objects.filter(is_archived=False).count()
        total_categories = Category.objects.filter(is_active=True).count()
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()

        # Inventory value: sum(price * stock)
        inv_val = Product.objects.filter(is_archived=False).aggregate(
            total_val=Sum(F("price") * F("stock"))
        )["total_val"] or Decimal("0.00")

        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status=Order.Status.PENDING).count()
        unpaid_orders = Order.objects.filter(payment__status="UNPAID").count()

        # Revenue excludes pending/unpaid/failed payments and cancelled orders
        revenue = Order.objects.filter(
            payment__status="PAID"
        ).exclude(
            status=Order.Status.CANCELLED
        ).aggregate(total_revenue=Sum("total"))["total_revenue"] or Decimal("0.00")

        low_stock_count = Product.objects.filter(is_archived=False, stock__lte=3, stock__gt=0).count()
        out_of_stock_count = Product.objects.filter(is_archived=False, stock=0).count()

        return {
            "total_products": total_products,
            "total_categories": total_categories,
            "total_customers": total_customers,
            "total_inventory_value": float(inv_val),
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "unpaid_orders": unpaid_orders,
            "collected_revenue": float(revenue),
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
        }

    @staticmethod
    def get_top_products(limit: int = 5) -> list:
        top_items = OrderItem.objects.filter(
            order__payment__status="PAID"
        ).values(
            "product_id_snapshot",
            "product_name_en",
            "product_name_ar",
            "unit_price",
        ).annotate(
            total_sold=Sum("quantity"),
            total_revenue=Sum("line_subtotal"),
        ).order_by("-total_sold")[:limit]

        return list(top_items)

    @staticmethod
    def get_sales_trends() -> dict:
        orders_by_status = dict(
            Order.objects.values("status").annotate(count=Count("id")).values_list("status", "count")
        )
        return {
            "orders_by_status": orders_by_status,
        }
