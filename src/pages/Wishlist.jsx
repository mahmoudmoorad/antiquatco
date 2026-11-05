
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Wishlist() {
  const { wishlistItems } = useWishlist();
  const { language } = useLanguage();

  const t = translations[language].wishlist;
  const isArabic = language === "ar";

  return (
    <main className="shop-page">
      <section className="shop-header">
        <span>
          {isArabic ? "كنوزك المحفوظة" : "YOUR SAVED TREASURES"}
        </span>

        <h1>{t.title}</h1>

        <p>{t.description}</p>
      </section>

      <section className="shop-container">
        {wishlistItems.length > 0 ? (
          <div className="product-grid">
            {wishlistItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="empty-cart">
            <h2>{t.emptyTitle}</h2>

            <p>{t.emptyDescription}</p>

            <Link to="/shop" className="btn-primary">
              {t.explore}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default Wishlist;
