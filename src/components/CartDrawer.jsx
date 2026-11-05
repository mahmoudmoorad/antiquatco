import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function CartDrawer() {
  const navigate = useNavigate();

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    closeCart,
    isCartOpen,
  } = useCart();

  const { language } = useLanguage();
  const isArabic = language === "ar";

  const t = translations[language].cart;
  const common = translations[language].common;

  const locale = isArabic ? "ar-EG" : "en-US";

  const formatPrice = (price) => {
    const formattedNum = Number(price).toLocaleString(locale);
    return isArabic
      ? `${formattedNum} ${common.currency}`
      : `${common.currency} ${formattedNum}`;
  };

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <div
      className="cart-drawer-overlay"
      onClick={closeCart}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <aside
        className="cart-drawer"
        onClick={(event) => event.stopPropagation()}
        aria-label={t.title}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="cart-drawer-header">
          <div>
            <span>ANTIKATKO</span>
            <h2>{t.title}</h2>
            <p>
              {cartItems.length} {t.pieces}
            </p>
          </div>

          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label={t.close}
          >
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-drawer-empty">
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyDescription}</p>

            <button
              type="button"
              onClick={() => {
                closeCart();
                navigate("/shop");
              }}
            >
              {t.explore}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {cartItems.map((item) => {
                const itemName = isArabic
                  ? item.nameAr || item.name
                  : item.name;

                const itemCategory = isArabic
                  ? item.categoryAr || item.category
                  : item.category;

                return (
                  <div className="cart-drawer-item" key={item.id}>
                    <img src={item.image} alt={itemName} />

                    <div className="cart-drawer-item-info">
                      <span>{itemCategory}</span>
                      <h3>{itemName}</h3>

                      <strong>{formatPrice(item.price)}</strong>

                      <div className="cart-drawer-quantity">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label={`${t.decrease} ${itemName}`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label={`${t.increase} ${itemName}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cart-drawer-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      {t.remove}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-drawer-total">
                <span>{t.subtotal}</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <p>{t.shipping}</p>

              <button
                type="button"
                className="cart-drawer-checkout"
                onClick={handleCheckout}
              >
                {t.checkout}
              </button>

              <button
                type="button"
                className="cart-drawer-continue"
                onClick={closeCart}
              >
                {t.continue}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;