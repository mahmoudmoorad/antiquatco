
import { Link, useLocation, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();

  const { language } = useLanguage();
  const isArabic = language === "ar";

  const t = translations[language].checkout;
  const currency = translations[language].common.currency;

  let order = location.state?.order;

  if (!order) {
    try {
      const orders = JSON.parse(
        localStorage.getItem("antikatko-orders") || "[]"
      );

      order = Array.isArray(orders)
        ? orders.find((item) => item.id === orderId)
        : null;
    } catch {
      order = null;
    }
  }

  const formatPrice = (price) => {
    return `${Number(price || 0).toLocaleString(
      isArabic ? "ar-EG" : "en-US"
    )} ${currency}`;
  };

  const paymentMethods = {
    vodafone_cash: isArabic ? "فودافون كاش" : "Vodafone Cash",
    instapay: "InstaPay",
    cash_on_delivery: isArabic ? "الدفع عند الاستلام" : "Cash on Delivery",
  };

  const paymentStatuses = {
    Pending: isArabic ? "في انتظار تأكيد الدفع" : "Awaiting Payment Confirmation",
    Unpaid: isArabic ? "غير مدفوع" : "Unpaid",
    Paid: isArabic ? "تم الدفع" : "Paid",
    Failed: isArabic ? "فشل الدفع" : "Payment Failed",
  };

  const orderStatuses = {
    Pending: isArabic ? "قيد الانتظار" : "Pending",
    Confirmed: isArabic ? "تم تأكيد الطلب" : "Confirmed",
    Processing: isArabic ? "جاري التجهيز" : "Processing",
    Shipped: isArabic ? "تم الشحن" : "Shipped",
    Delivered: isArabic ? "تم التسليم" : "Delivered",
    Cancelled: isArabic ? "ملغي" : "Cancelled",
  };

  return (
    <main className="order-confirmation">
      <span>ANTIKATKO</span>

      <div className="confirmation-icon">
        <svg
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1>
        {isArabic ? "شكرًا لطلبك!" : "Thank You For Your Order"}
      </h1>

      {order ? (
        <>
          <p>
            {isArabic
              ? "تم تسجيل طلبك بنجاح. شكرًا لاختيارك ANTIQUTCO."
              : "Your order has been recorded successfully. Thank you for choosing ANTIQUTCO."}
          </p>

          <div className="confirmation-details">
            <p>
              <strong>
                {isArabic ? "رقم الطلب:" : "Order Number:"}
              </strong>{" "}
              {order.id}
            </p>

            <p>
              <strong>
                {isArabic ? "حالة الطلب:" : "Order Status:"}
              </strong>{" "}
              {orderStatuses[order.status] || order.status}
            </p>

            <p>
              <strong>
                {isArabic ? "طريقة الدفع:" : "Payment Method:"}
              </strong>{" "}
              {paymentMethods[order.paymentMethod] ||
                (isArabic ? "غير محددة" : "Not specified")}
            </p>

            <p>
              <strong>
                {isArabic ? "حالة الدفع:" : "Payment Status:"}
              </strong>{" "}
              {paymentStatuses[order.paymentStatus] ||
                order.paymentStatus ||
                (isArabic ? "غير محددة" : "Not specified")}
            </p>

            <div className="confirmation-price-breakdown">
              <p>
                <strong>
                  {isArabic ? "قيمة المنتجات:" : "Subtotal:"}
                </strong>{" "}
                {formatPrice(
                  order.subtotal ?? order.total
                )}
              </p>

              <p>
                <strong>
                  {isArabic ? "تكلفة الشحن:" : "Shipping:"}
                </strong>{" "}
                {formatPrice(order.shippingCost ?? 0)}
              </p>

              <p className="confirmation-total">
                <strong>
                  {isArabic ? "الإجمالي النهائي:" : "Final Total:"}
                </strong>{" "}
                {formatPrice(order.total)}
              </p>
            </div>
          </div>

          {order.paymentMethod === "cash_on_delivery" && (
            <p>
              {isArabic
                ? "سيتم تحصيل قيمة الطلب عند استلامه."
                : "Your order amount will be collected upon delivery."}
            </p>
          )}

          {(order.paymentMethod === "vodafone_cash" ||
            order.paymentMethod === "instapay") && (
            <p>
              {isArabic
                ? "يرجى إتمام التحويل، وسيتم مراجعة الدفع قبل تأكيد الطلب."
                : "Please complete the transfer. Your payment will be reviewed before the order is confirmed."}
            </p>
          )}
        </>
      ) : (
        <p>
          {isArabic
            ? "عذرًا، لم نتمكن من العثور على تفاصيل الطلب في هذا المتصفح."
            : "We couldn't find the order details in this browser."}
        </p>
      )}

      <Link to="/shop" className="btn-primary">
        {t.continueShopping}
      </Link>
    </main>
  );
}

export default OrderConfirmation;
