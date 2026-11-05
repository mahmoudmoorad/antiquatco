import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import products from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isArabic } = useLanguage();

  const product = products.find(
    (item) => String(item.id) === String(id)
  );

  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <main className="product-not-found">
        <h1>
          {isArabic ? "المنتج غير موجود" : "Product Not Found"}
        </h1>

        <Link to="/shop" className="btn-primary">
          {isArabic ? "العودة إلى المجموعة" : "Back To Collection"}
        </Link>
      </main>
    );
  }

  const productName = isArabic
    ? product.nameAr || product.name
    : product.name;

  const productCategory = isArabic
    ? product.categoryAr || product.category
    : product.category;

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

  const currency = isArabic ? "جنيه" : "EGP";
  const numberLocale = isArabic ? "ar-EG" : "en-US";

  const formatPrice = (price) => {
    const formattedNum = Number(price).toLocaleString(numberLocale);
    return isArabic
      ? `${formattedNum} ${currency}`
      : `${currency} ${formattedNum}`;
  };

  const favorite = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate("/checkout");
  };

  return (
    <main className="product-details-page">
      <div className="product-details-layout">
        <div className="product-details-image">
          <img src={product.image} alt={productName} />

          {discount > 0 && (
            <span className="product-discount-badge">
              {isArabic ? `خصم ${discount}%` : `${discount}% OFF`}
            </span>
          )}
        </div>

        <div className="product-details-content">
          <span className="product-category">
            {productCategory}
          </span>

          <h1>{productName}</h1>

          <div className="product-details-pricing">
            <span className="product-current-price">
              {formatPrice(currentPrice)}
            </span>

            {discount > 0 && (
              <>
                <span className="product-original-price">
                  {formatPrice(originalPrice)}
                </span>

                <span className="product-discount-text">
                  {isArabic
                    ? `وفّر ${discount}%`
                    : `Save ${discount}%`}
                </span>
              </>
            )}
          </div>

          <p>
            {isArabic
              ? "قطعة مختارة بعناية من مجموعة ANTIKATKO. أضف لمسة من الأناقة الخالدة والطابع المميز إلى مساحتك."
              : "A carefully selected piece from the ANTIKATKO collection. Add a timeless touch and distinctive character to your space."}
          </p>

          <div className="quantity-controls">
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => Math.max(1, q - 1))
              }
              aria-label={
                isArabic ? "تقليل الكمية" : "Decrease quantity"
              }
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label={
                isArabic ? "زيادة الكمية" : "Increase quantity"
              }
            >
              +
            </button>
          </div>

          <div className="product-detail-actions">
            <button
              type="button"
              className="btn-buy-now"
              onClick={handleBuyNow}
            >
              {isArabic ? "اشترِ الآن" : "Buy Now"}
            </button>

            <button
              type="button"
              className="btn-add-cart"
              onClick={handleAddToCart}
            >
              {isArabic ? "أضف إلى السلة" : "Add To Cart"}
            </button>

            <button
              type="button"
              className="wishlist-detail-button"
              onClick={() => toggleWishlist(product)}
            >
              {favorite
                ? isArabic
                  ? "♥ تمت الإضافة للمفضلة"
                  : "♥ Added To Wishlist"
                : isArabic
                ? "♡ أضف إلى المفضلة"
                : "♡ Add To Wishlist"}
            </button>
          </div>

          <Link to="/shop" className="continue-shopping">
            {isArabic ? "العودة إلى المجموعة" : "Back to collection"}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;