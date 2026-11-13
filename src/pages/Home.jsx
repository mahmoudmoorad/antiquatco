import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, refreshProductsFromBackend } from "../data/products";
import ProductCard from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";
import heroImage from "../assets/WhatsApp Image 2026-11-06 at 2.20.47 PM.jpeg";

function Home() {
  const { language, isArabic } = useLanguage();
  const t = translations[language].home;

  const [products, setProducts] = useState(getProducts);

  useEffect(() => {
    refreshProductsFromBackend();

    const updateProducts = () => {
      setProducts(getProducts());
    };

    window.addEventListener("productsUpdated", updateProducts);

    return () => {
      window.removeEventListener("productsUpdated", updateProducts);
    };
  }, []);

  return (
    <main>
      {/* 1. Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span>{t.heroTag}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroDescription}</p>

          <Link to="/shop" className="btn-primary">
            {t.explore}
          </Link>
        </div>

        <div className="hero-image">
          <img
            src={heroImage}
            alt={isArabic ? "ديكور داخلي كلاسيكي" : "Vintage interior"}
          />
        </div>
      </section>

      {/* 2. Categories */}
      {/* <section className="categories">
        <div className="section-heading">
          <span>{t.categoriesTag}</span>
          <h2>{t.categoriesTitle}</h2>
        </div>

        <div className="category-grid">
          <Link to="/shop" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600"
              alt={t.antiques}
            />
            <h3>{t.antiques}</h3>
          </Link>

          <Link to="/shop" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600"
              alt={t.decor}
            />
            <h3>{t.decor}</h3>
          </Link>

          <Link to="/shop" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600"
              alt={t.collectibles}
            />
            <h3>{t.collectibles}</h3>
          </Link>

          <Link to="/shop" className="category-card">
            <img
              src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600"
              alt={t.art}
            />
            <h3>{t.art}</h3>
          </Link>
        </div>
      </section> */}

      {/* 3. Best Sellers / Featured */}
      <section className="products-section">
        <div className="section-heading">
          <span>{t.featuredTag}</span>
          <h2>{isArabic ? "الأكثر مبيعاً" : "Best Sellers"}</h2>
          <p>{t.featuredDescription}</p>
        </div>

        <div className="product-grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Full Collection */}
      <section className="products-section full-collection-section">
        <div className="section-heading">
          <span>{isArabic ? "المجموعة الكاملة" : "FULL COLLECTION"}</span>
          <h2>{isArabic ? "تصفح كل القطع" : "Explore All Products"}</h2>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="section-button">
          <Link to="/shop" className="btn-outline">
            {t.viewAll}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;