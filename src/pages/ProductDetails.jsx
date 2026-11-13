import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProducts, refreshProductsFromBackend } from "../data/products";
import productService from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isArabic } = useLanguage();

  const [products, setProducts] = useState(getProducts);
  const [directProduct, setDirectProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    productService
      .getProductById(id)
      .then((p) => {
        if (isMounted && p) setDirectProduct(p);
      })
      .catch((e) => {
        console.warn("Direct product fetch failed:", e.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const updateProducts = () => {
      setProducts(getProducts());
    };

    window.addEventListener("productsUpdated", updateProducts);

    return () => {
      window.removeEventListener("productsUpdated", updateProducts);
    };
  }, []);

  useEffect(() => {
    setQuantity(1);
  }, [id]);

  const product =
    directProduct ||
    products.find(
      (item) => String(item.id) === String(id) || String(item.slug) === String(id)
    );

  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (loading && !product) {
    return (
      <main className="product-details-page" style={{ textAlign: "center", padding: "100px 20px" }}>
        <p style={{ fontSize: "18px", color: "#80632e" }}>
          {isArabic ? "جاري تحميل تفاصيل المنتج..." : "Loading product details..."}
        </p>
      </main>
    );
  }

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

  const productDescription = isArabic
    ? product.descriptionAr || product.description || "قطعة مختارة بعناية من مجموعة ANTIQUTCO. أضف لمسة من الأناقة الخالدة والطابع المميز إلى مساحتك."
    : product.description || "A carefully selected piece from the ANTIQUTCO collection. Add a timeless touch and distinctive character to your space.";

  const stockCount = product.stock !== undefined ? Number(product.stock) : 10;
  const isOutOfStock = stockCount === 0;

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
    if (isOutOfStock) return;
    addToCart(product, quantity);
    openCart();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
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

          {/* عرض حالة المخزون بوضوح في صفحة التفاصيل */}
          <div style={{ margin: "10px 0" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                padding: "4px 10px",
                borderRadius: "6px",
                background: isOutOfStock ? "#fae9e5" : stockCount <= 3 ? "#fef7e0" : "#e8f0fe",
                color: isOutOfStock ? "#a34435" : stockCount <= 3 ? "#b06000" : "#1967d2",
                display: "inline-block",
              }}
            >
              {isOutOfStock
                ? isArabic
                  ? "نفذت الكمية تماماً (Out of Stock)"
                  : "Out of Stock"
                : isArabic
                ? `المخزون المتاح: ${stockCount} قطعة`
                : `Available Stock: ${stockCount}`}
            </span>
          </div>

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

          <p className="product-description-text">
            {productDescription}
          </p>

          {!isOutOfStock && (
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
                onClick={() => setQuantity((q) => Math.min(stockCount, q + 1))}
                aria-label={
                  isArabic ? "زيادة الكمية" : "Increase quantity"
                }
              >
                +
              </button>
            </div>
          )}

          <div className="product-detail-actions">
            <button
              type="button"
              className="btn-buy-now"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              style={{ opacity: isOutOfStock ? 0.6 : 1, cursor: isOutOfStock ? "not-allowed" : "pointer" }}
            >
              {isArabic ? "اشترِ الآن" : "Buy Now"}
            </button>

            <button
              type="button"
              className="btn-add-cart"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{ opacity: isOutOfStock ? 0.6 : 1, cursor: isOutOfStock ? "not-allowed" : "pointer" }}
            >
              {isOutOfStock
                ? isArabic
                  ? "نفذت الكمية"
                  : "Out of Stock"
                : isArabic
                ? "أضف إلى السلة"
                : "Add To Cart"}
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