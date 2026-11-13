"""
Report generation and export services for Excel and PDF.
"""
import io
from decimal import Decimal
from django.utils import timezone
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from apps.orders.models import Order
from apps.catalog.models import Product


class ReportService:
    @staticmethod
    def generate_sales_excel(orders) -> io.BytesIO:
        wb = Workbook()
        ws = wb.active
        ws.title = "Sales Report"

        # Headers
        headers = ["Order #", "Date", "Customer Name", "Email", "Phone", "Status", "Payment Method", "Payment Status", "Subtotal (EGP)", "Shipping (EGP)", "Total (EGP)"]
        ws.append(headers)

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for order in orders:
            pay_status = order.payment.status if hasattr(order, "payment") else "N/A"
            ws.append([
                order.order_number,
                order.created_at.strftime("%Y-%m-%d %H:%M"),
                order.customer_name,
                order.customer_email,
                order.customer_phone,
                order.get_status_display(),
                order.get_payment_method_display(),
                pay_status,
                float(order.subtotal),
                float(order.shipping_fee),
                float(order.total),
            ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    @staticmethod
    def generate_inventory_excel() -> io.BytesIO:
        wb = Workbook()
        ws = wb.active
        ws.title = "Inventory Report"

        headers = ["Product ID", "English Name", "Arabic Name", "Category", "Price (EGP)", "Stock", "Status", "Active", "Archived"]
        ws.append(headers)

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="047857", end_color="047857", fill_type="solid")
        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        products = Product.objects.select_related("category").order_by("category__name_en", "name_en")
        for p in products:
            status_label = "Out of Stock" if p.stock == 0 else ("Low Stock" if p.stock <= 3 else "In Stock")
            ws.append([
                p.id,
                p.name_en,
                p.name_ar,
                p.category.name_en,
                float(p.price),
                p.stock,
                status_label,
                "Yes" if p.is_active else "No",
                "Yes" if p.is_archived else "No",
            ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    @staticmethod
    def generate_sales_pdf(orders) -> io.BytesIO:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setTitle("ANTIKATKO — Sales Summary Report")

        # Header
        p.setFont("Helvetica-Bold", 18)
        p.drawString(50, 750, "ANTIKATKO — Sales Summary Report")
        p.setFont("Helvetica", 10)
        p.drawString(50, 735, f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        p.line(50, 725, 560, 725)

        # Totals
        total_orders = orders.count()
        total_revenue = sum(o.total for o in orders if hasattr(o, "payment") and o.payment.status == "PAID")

        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, 700, f"Total Orders in Period: {total_orders}")
        p.drawString(300, 700, f"Total Paid Revenue: {total_revenue:,.2f} EGP")

        # Table header
        y = 660
        p.setFont("Helvetica-Bold", 9)
        p.drawString(50, y, "Order #")
        p.drawString(180, y, "Customer")
        p.drawString(320, y, "Status")
        p.drawString(420, y, "Payment")
        p.drawString(500, y, "Total (EGP)")
        p.line(50, y - 5, 560, y - 5)

        y -= 20
        p.setFont("Helvetica", 8)
        for order in orders[:35]:  # First page rows
            pay_status = order.payment.status if hasattr(order, "payment") else "N/A"
            p.drawString(50, y, order.order_number)
            p.drawString(180, y, order.customer_name[:20])
            p.drawString(320, y, order.get_status_display())
            p.drawString(420, y, pay_status)
            p.drawRightString(550, y, f"{order.total:,.2f}")
            y -= 15
            if y < 50:
                p.showPage()
                y = 750

        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer
