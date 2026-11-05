
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Cart() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
  } = useCart();

  const { language } = useLanguage();
  const t = translations[language].cart;
  const currency = translations[language].common.currency;
  const isArabic = language === "ar";

  const formatPrice = (price) => {
    return `${Number(price).toLocaleString(
      isArabic ? "ar-EG" : "en-US"
    )} ${currency}`;
  };

  return (
    <main className="cart-page">
      <section className="shop-header">
        <span>
          {isArabic ? "قطع اخترتها بعناية" : "YOUR SELECTED PIECES"}
        </span>

        <h1>{t.title}</h1>

        <p>
          {isArabic
            ? "راجع مجموعتك قبل إتمام عملية الشراء."
            : "Review your collection before checkout."}
        </p>
      </section>

      <section className="cart-container">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <h2>{t.emptyTitle}</h2>

            <p>{t.emptyDescription}</p>

            <Link to="/shop" className="btn-primary">
              {t.explore}
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => {
                const originalPrice = Number(
                  item.originalPrice || item.price
                );

                const currentPrice = Number(item.price);

                const discount =
                  originalPrice > currentPrice
                    ? Math.round(
                        ((originalPrice - currentPrice) /
                          originalPrice) *
                          100
                      )
                    : 0;

                const productName =
                  isArabic && item.nameAr
                    ? item.nameAr
                    : item.name;

                const productCategory =
                  isArabic && item.categoryAr
                    ? item.categoryAr
                    : item.category;

                return (
                  <div className="cart-item" key={item.id}>
                    <img
                      src={item.image}
                      alt={productName}
                    />

                    <div className="cart-item-info">
                      <span>{productCategory}</span>

                      <h3>{productName}</h3>

                      <div className="cart-item-pricing">
                        <strong>
                          {formatPrice(currentPrice)}
                        </strong>

                        {discount > 0 && (
                          <>
                            <del>
                              {formatPrice(originalPrice)}
                            </del>

                            <span>
                              {isArabic
                                ? `خصم ${discount}%`
                                : `${discount}% OFF`}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="quantity-controls">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          aria-label={t.decrease}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          aria-label={t.increase}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-item"
                      onClick={() => removeFromCart(item.id)}
                    >
                      {t.remove}
                    </button>
                  </div>
                );
              })}
            </div>

            <aside className="cart-summary">
              <h2>
                {isArabic ? "ملخص الطلب" : "Order Summary"}
              </h2>

              <div className="cart-total-row">
                <span>{t.subtotal}</span>

                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <p className="cart-shipping-note">
                {t.shipping}
              </p>

              <Link to="/checkout" className="btn-primary">
                {t.checkout}
              </Link>

              <button
                type="button"
                className="clear-cart"
                onClick={clearCart}
              >
                {isArabic ? "إفراغ السلة" : "Clear Cart"}
              </button>

              <Link
                to="/shop"
                className="continue-shopping"
              >
                {t.continue}
              </Link>
            </aside>
          </>
        )}
      </section>
    </main>
  );
}

export default Cart;
