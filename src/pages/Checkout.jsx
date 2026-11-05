
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { language } = useLanguage();

  const t = translations[language].checkout;
  const currency = translations[language].common.currency;
  const isArabic = language === "ar";

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    notes: "",
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

  const submitOrder = (event) => {
    event.preventDefault();

    if (!cartItems.length) return;

    const order = {
      id: `ANT-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer: form,
      items: cartItems,
      total: cartTotal,
      status: "Pending",
    };

    let previousOrders = [];

    try {
      previousOrders = JSON.parse(
        localStorage.getItem("antikatko-orders") || "[]"
      );

      if (!Array.isArray(previousOrders)) {
        previousOrders = [];
      }
    } catch {
      previousOrders = [];
    }

    localStorage.setItem(
      "antikatko-orders",
      JSON.stringify([order, ...previousOrders])
    );

    clearCart();

    navigate(`/order-confirmation/${order.id}`, {
      state: { order },
    });
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
          {isArabic ? "أصبحت القطعة قريبة منك" : "ALMOST YOURS"}
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

          <label>
            {isArabic ? "ملاحظات الطلب (اختياري)" : "Order Notes (Optional)"}

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

          <button className="btn-primary" type="submit">
            {t.placeOrder}
          </button>

          <p className="checkout-disclaimer">
            {isArabic
              ? "هذه نسخة تجريبية؛ يتم حفظ الطلب في هذا المتصفح فقط، ولا تتم معالجة أي مدفوعات إلكترونية."
              : "Demo checkout: your order is saved in this browser only. No payment is processed."}
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
              <div className="checkout-line" key={item.id}>
                <span>
                  {productName} × {item.quantity}
                </span>

                <strong>
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </div>
            );
          })}

          <div className="cart-total-row">
            <span>{t.subtotal}</span>

            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          <div className="cart-total-row">
            <span>{t.shipping}</span>

            <strong>
              {isArabic ? "يحدد لاحقًا" : "To be confirmed"}
            </strong>
          </div>

          <div className="cart-total-row">
            <span>{t.total}</span>

            <strong>{formatPrice(cartTotal)}</strong>
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
