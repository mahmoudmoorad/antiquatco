
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

      order = orders.find((item) => item.id === orderId);
    } catch {
      order = null;
    }
  }

  const formatPrice = (price) => {
    return `${Number(price).toLocaleString(
      isArabic ? "ar-EG" : "en-US"
    )} ${currency}`;
  };

  return (
    <main className="order-confirmation">
      <span>ANTIKATKO</span>

      <div className="confirmation-icon">
        ✓
      </div>

      <h1>
        {isArabic
          ? "شكرًا لطلبك!"
          : "Thank You For Your Order"}
      </h1>

      {order ? (
        <>
          <p>
            {isArabic
              ? "تم تسجيل طلبك بنجاح. شكرًا لاختيارك ANTIKATKO."
              : "Your order has been recorded successfully. Thank you for choosing ANTIKATKO."}
          </p>

          <p>
            <strong>
              {isArabic ? "رقم الطلب:" : "Order Number:"}
            </strong>{" "}
            {order.id}
          </p>

          <p>
            <strong>
              {isArabic ? "الإجمالي:" : "Total:"}
            </strong>{" "}
            {formatPrice(order.total)}
          </p>

          <p>
            <strong>
              {isArabic ? "حالة الطلب:" : "Order Status:"}
            </strong>{" "}
            {isArabic ? "قيد الانتظار" : order.status}
          </p>
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
