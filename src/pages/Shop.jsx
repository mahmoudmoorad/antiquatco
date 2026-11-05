
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import products from "../data/products";
import ProductCard from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { language, isArabic } = useLanguage();
  const t = translations[language].shop;

  const urlSearch = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    { value: "All", label: t.all },
    { value: "Decor", label: t.decor },
    { value: "Collectibles", label: t.collectibles },
    { value: "Lighting", label: t.lighting },
    { value: "Antiques", label: t.antiques },
  ];

  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  const filteredProducts = products.filter((product) => {
    const searchValue = searchTerm.trim().toLowerCase();

    const searchableValues = [
      product.name,
      product.nameAr,
      product.category,
      product.categoryAr,
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    const matchesSearch =
      !searchValue ||
      searchableValues.some((value) =>
        value.includes(searchValue)
      );

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSearchParams({});
  };

  return (
    <main className="shop-page">
      <section className="shop-header">
        <span>{t.headerTag}</span>
        <h1>{t.title}</h1>
        <p>{t.description}</p>
      </section>

      <section className="shop-container">
        <div className="shop-controls">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label={t.searchPlaceholder}
          />

          <div className="shop-categories">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                className={
                  selectedCategory === category.value
                    ? "category-filter active"
                    : "category-filter"
                }
                onClick={() =>
                  setSelectedCategory(category.value)
                }
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <p className="shop-results">
          {isArabic
            ? `${t.showing}: ${filteredProducts.length}`
            : `${t.showing} ${filteredProducts.length}`}
        </p>

        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h2>{t.noProducts}</h2>
            <p>{t.tryAnother}</p>

            <button
              type="button"
              className="btn-primary"
              onClick={clearFilters}
            >
              {t.clearFilters}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Shop;
