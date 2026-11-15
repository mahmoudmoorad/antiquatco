import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";
import orderService from "../services/orderService";
const SHIPPING_COST = 100;

function Checkout() {
  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  const { user } = useAuth();
  const { language } = useLanguage();

  const t = translations[language].checkout;
  const currency = translations[language].common.currency;
  const isArabic = language === "ar";

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    notes: "",
    paymentMethod: "cash_on_delivery",
  });

  const update = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const formatPrice = (price) => {
    return `${Number(price).toLocaleString(
      isArabic ? "ar-EG" : "en-US"
    )} ${currency}`;
  };

  const subtotal = cartTotal;
  const finalTotal = subtotal > 0 ? subtotal + SHIPPING_COST : 0;


const submitOrder = async (event) => {
  event.preventDefault();

  if (isSubmitting || !cartItems.length) return;

  setIsSubmitting(true);

  try {
    const checkoutPayload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      governorate: form.city,
      notes: form.notes,
      payment_method: form.paymentMethod,
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity),
      })),
    };

    // Django validates stock, creates the order, and deducts stock.
    const createdOrder = await orderService.checkout(checkoutPayload);

    if (!createdOrder) {
      throw new Error("Invalid order response");
    }

    clearCart();

    navigate(
      `/order-confirmation/${createdOrder.order_number || createdOrder.id}`,
      { state: { order: createdOrder } }
    );
  } catch (error) {
    console.error("Order creation failed:", error);

    const errorMessage =
      error?.data?.message ||
      error?.message ||
      (isArabic
        ? "حدث خطأ أثناء إنشاء الطلب. تأكد من توفر المخزون وحاول مرة أخرى."
        : "An error occurred while creating your order. Please check stock and try again.");

    window.alert(errorMessage);
    setIsSubmitting(false);
  }
};


  if (!cartItems.length) {
    return (
      <main className="empty-cart">
        <h2>{t.emptyCart}</h2>

        <Link to="/shop" className="btn-primary">
          {t.continueShopping}
        </Link>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="shop-header">
        <span>
          {isArabic
            ? "أصبحت القطعة قريبة منك"
            : "ALMOST YOURS"}
        </span>

        <h1>{t.title}</h1>

        <p>{t.description}</p>
      </section>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={submitOrder}
        >
          <h2>{t.contactInformation}</h2>

          <label>
            {t.fullName}

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={update}
              placeholder={t.fullName}
              required
            />
          </label>

          <label>
            {t.email}

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder={t.email}
              required
            />
          </label>

          <label>
            {t.phone}

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={update}
              placeholder={t.phone}
              required
            />
          </label>

          <h2>{t.shippingAddress}</h2>

          <label>
            {t.address}

            <textarea
              name="address"
              value={form.address}
              onChange={update}
              placeholder={t.address}
              required
              rows="3"
            />
          </label>

          <label>
            {t.city}

            <input
              type="text"
              name="city"
              value={form.city}
              onChange={update}
              placeholder={t.city}
              required
            />
          </label>

          {/* Payment Methods */}
          <h2>
            {isArabic ? "طريقة الدفع" : "Payment Method"}
          </h2>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 15px",
                background: "#faf7f1",
                borderRadius: "8px",
                border: "1px solid #e8dfd1",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={
                  form.paymentMethod === "cash_on_delivery"
                }
                onChange={update}
              />

              <div>
                <strong>
                  {isArabic
                    ? "الدفع عند الاستلام"
                    : "Cash on Delivery"}
                </strong>

                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    color: "#827365",
                  }}
                >
                  {isArabic
                    ? "ادفع نقداً عند استلام طلبك"
                    : "Pay with cash upon delivery"}
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 15px",
                background: "#faf7f1",
                borderRadius: "8px",
                border: "1px solid #e8dfd1",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="vodafone_cash"
                checked={
                  form.paymentMethod === "vodafone_cash"
                }
                onChange={update}
              />

              <div>
                <strong>
                  {isArabic ? "فودافون كاش" : "Vodafone Cash"}
                </strong>

                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    color: "#827365",
                  }}
                >
                  {isArabic
                    ? "تحويل رقمي يتم مراجعته وتأكيده من الإدارة"
                    : "Digital transfer verified by admin"}
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 15px",
                background: "#faf7f1",
                borderRadius: "8px",
                border: "1px solid #e8dfd1",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="instapay"
                checked={form.paymentMethod === "instapay"}
                onChange={update}
              />

              <div>
                <strong>
                  {isArabic
                    ? "انستاباي (InstaPay)"
                    : "InstaPay"}
                </strong>

                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
                    color: "#827365",
                  }}
                >
                  {isArabic
                    ? "تحويل فوري يتم مراجعته وتأكيده من الإدارة"
                    : "Instant transfer verified by admin"}
                </p>
              </div>
            </label>
          </div>

          <label>
            {isArabic
              ? "ملاحظات الطلب (اختياري)"
              : "Order Notes (Optional)"}

            <textarea
              name="notes"
              value={form.notes}
              onChange={update}
              placeholder={
                isArabic
                  ? "هل لديك أي تعليمات إضافية؟"
                  : "Any additional instructions?"
              }
              rows="2"
            />
          </label>

          <button
            className="btn-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isArabic
                ? "جاري إنشاء الطلب..."
                : "Placing Order..."
              : t.placeOrder}
          </button>

          <p className="checkout-disclaimer">
            {isArabic
              ? "يتم حفظ الطلب عبر خوادم ANTIQUTCO الآمنة وتحديث المخزون فوراً."
              : "Your order is securely processed and stock is updated instantly."}
          </p>
        </form>

        <aside className="cart-summary">
          <h2>{t.orderSummary}</h2>

          {cartItems.map((item) => {
            const productName =
              isArabic && item.nameAr
                ? item.nameAr
                : item.name;

            return (
              <div
                className="checkout-line"
                key={item.id}
              >
                <span>
                  {productName} × {item.quantity}
                </span>

                <strong>
                  {formatPrice(
                    Number(item.price) * item.quantity
                  )}
                </strong>
              </div>
            );
          })}

          <div className="cart-total-row">
            <span>{t.subtotal}</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <div className="cart-total-row">
            <span>{t.shipping}</span>
            <strong>{formatPrice(SHIPPING_COST)}</strong>
          </div>

          <div className="cart-total-row">
            <span>{t.total}</span>
            <strong>{formatPrice(finalTotal)}</strong>
          </div>

          <Link
            to="/shop"
            className="continue-shopping"
          >
            {t.continueShopping}
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;
