import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";

function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function ProductCard({ product }) {
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isArabic } = useLanguage();

  const favorite = isInWishlist(product.id);

  const currentPrice = Number(product.price);
  const originalPrice = Number(
    product.originalPrice || product.price
  );

  const discount =
    originalPrice > currentPrice
      ? Math.round(
          ((originalPrice - currentPrice) / originalPrice) * 100
        )
      : 0;

  const productName = isArabic
    ? product.nameAr || product.name
    : product.name;

  const productCategory = isArabic
    ? product.categoryAr || product.category
    : product.category;

  const currency = isArabic ? "جنيه" : "EGP";
  const numberLocale = isArabic ? "ar-EG" : "en-US";

  const formatPrice = (price) =>
    price.toLocaleString(numberLocale);

  const handleAddToCart = () => {
    addToCart(product);
    openCart();
  };

  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${product.id}`}>
          <img src={product.image} alt={productName} />
        </Link>

        {discount > 0 && (
          <span className="product-discount-badge">
            {isArabic ? `خصم ${discount}%` : `${discount}% OFF`}
          </span>
        )}

        <button
          type="button"
          className={`wishlist-toggle ${favorite ? "is-active" : ""}`}
          aria-label={
            favorite
              ? isArabic
                ? "إزالة من المفضلة"
                : "Remove from wishlist"
              : isArabic
              ? "إضافة إلى المفضلة"
              : "Add to wishlist"
          }
          aria-pressed={favorite}
          onClick={() => toggleWishlist(product)}
        >
          <HeartIcon filled={favorite} />
        </button>
      </div>

      <div className="product-details">
        <p className="product-category">
          {productCategory}
        </p>

        <h3>
          <Link to={`/product/${product.id}`}>
            {productName}
          </Link>
        </h3>

        <div className="product-card-pricing">
          <span className="product-card-current-price">
            {isArabic ? `${formatPrice(currentPrice)} ${currency}` : `${currency} ${formatPrice(currentPrice)}`}
          </span>

          {discount > 0 && (
            <span className="product-card-original-price">
              {isArabic ? `${formatPrice(originalPrice)} ${currency}` : `${currency} ${formatPrice(originalPrice)}`}
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-primary product-add-button"
          onClick={handleAddToCart}
        >
          <CartIcon />
          <span>{isArabic ? "أضف إلى السلة" : "Add to Cart"}</span>
        </button>
      </div>
    </article>
  );
}

export default ProductCard;