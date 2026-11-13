
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

import translations from "../data/translations";
import { getProducts } from "../data/products";

/* ==========================================
   NAVBAR ICONS
   ========================================== */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
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

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
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

function AccountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-3.4 3.2-5.2 7-5.2s6.3 1.8 7 5.2" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      width="23"
      height="23"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width="23"
      height="23"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/* ==========================================
   NAVBAR COMPONENT
   ========================================== */

function Navbar() {
  const navigate = useNavigate();

  const { cartCount, openCart } = useCart();
  const { wishlistItems } = useWishlist();
  const { language, isArabic, toggleLanguage } = useLanguage();
  const { user } = useAuth();

  const t = translations[language];

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navProducts, setNavProducts] = useState(getProducts);

  /* Update products when admin changes them */

  useEffect(() => {
    const update = () => setNavProducts(getProducts());

    window.addEventListener("productsUpdated", update);

    return () => {
      window.removeEventListener("productsUpdated", update);
    };
  }, []);

  /* Search Results */

  const searchResults = searchTerm.trim()
    ? navProducts.filter((product) => {
        const query = searchTerm.trim().toLowerCase();

        return (
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.nameAr && product.nameAr.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query)) ||
          (product.categoryAr && product.categoryAr.toLowerCase().includes(query))
        );
      })
    : [];

  /* Format Product Price */

  const formatPrice = (price) => {
    const locale = isArabic ? "ar-EG" : "en-US";

    return `${Number(price).toLocaleString(locale)} ${t.common.currency}`;
  };

  /* Search Handler */

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) return;

    navigate(`/shop?search=${encodeURIComponent(query)}`);

    setSearchOpen(false);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const accountLink = user ? "/profile" : "/login";

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* LOGO */}

        <Link to="/" className="logo" onClick={scrollToTop}>
          ANTIQUTCO<span></span>
        </Link>

        {/* MAIN NAVIGATION */}

        <nav
          dir={isArabic ? "rtl" : "ltr"}
          className={`nav-links ${mobileMenuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <NavLink to="/" end onClick={scrollToTop}>
            {t.nav.home}
          </NavLink>

          <NavLink to="/shop" onClick={scrollToTop}>
            {t.nav.collection}
          </NavLink>

          <NavLink to="/contact" onClick={scrollToTop}>
            {t.nav.contact}
          </NavLink>

          {/* MOBILE FAVORITES */}

          <Link
            to="/wishlist"
            className="mobile-menu-favorites"
            onClick={scrollToTop}
          >
            <span className="mobile-menu-item-content">
              <HeartIcon />
              <span>{t.nav.favorites}</span>
            </span>

            {wishlistItems.length > 0 && (
              <span className="mobile-wishlist-count">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* MOBILE FOOTER */}

          <div className="mobile-menu-footer">

            {/* ACCOUNT */}

            <Link
              to={accountLink}
              className="mobile-account-link"
              onClick={scrollToTop}
              aria-label={t.nav.account}
            >
              <AccountIcon />
              <span>{t.nav.account}</span>
            </Link>

            {/* LANGUAGE */}

            <button
              type="button"
              className="mobile-language-toggle"
              onClick={toggleLanguage}
              aria-label={isArabic ? "Switch to English" : "التغيير إلى العربية"}
            >
              {t.nav.language}
            </button>

          </div>
        </nav>

        {/* NAVBAR ACTIONS */}

        <div className="nav-actions">

          {/* DESKTOP LANGUAGE */}

          <button
            type="button"
            className="language-toggle"
            onClick={toggleLanguage}
            aria-label={isArabic ? "Switch to English" : "التغيير إلى العربية"}
          >
            {t.nav.language}
          </button>

          {/* SEARCH */}

          <div className={`nav-search ${searchOpen ? "is-open" : ""}`}>

            {searchOpen && (
              <form
                className="nav-search-form"
                onSubmit={handleSearch}
              >
                <input
                  type="search"
                  placeholder={t.search.placeholder}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoFocus
                  aria-label={t.search.label}
                />
              </form>
            )}

            <button
              type="button"
              className="nav-icon-button"
              aria-label={searchOpen ? t.nav.closeSearch : t.nav.openSearch}
              onClick={() => {
                if (searchOpen) {
                  closeSearch();
                } else {
                  setSearchOpen(true);
                }
              }}
            >
              {searchOpen ? (
                <span className="nav-close-search">×</span>
              ) : (
                <SearchIcon />
              )}
            </button>

            {/* LIVE SEARCH RESULTS */}

            {searchOpen && searchTerm.trim() && (
              <div
                className="live-search-dropdown"
                dir={isArabic ? "rtl" : "ltr"}
              >
                {searchResults.length > 0 ? (
                  <>
                    <div className="live-search-heading">
                      {t.search.results} ({searchResults.length})
                    </div>

                    {searchResults.slice(0, 5).map((product) => (
                      <Link
                        to={`/product/${product.id}`}
                        className="live-search-item"
                        key={product.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchTerm("");
                          scrollToTop();
                        }}
                      >
                        <img
                          src={product.image}
                          alt={isArabic ? product.nameAr || product.name : product.name}
                        />

                        <div className="live-search-info">
                          <span className="live-search-name">
                            {isArabic
                              ? product.nameAr || product.name
                              : product.name}
                          </span>

                          <span className="live-search-category">
                            {isArabic
                              ? product.categoryAr || product.category
                              : product.category}
                          </span>

                          <span className="live-search-price">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}

                    {searchResults.length > 5 && (
                      <div className="live-search-more">
                        +{searchResults.length - 5} {t.search.more}
                      </div>
                    )}

                    <button
                      type="button"
                      className="live-search-view-all"
                      onClick={handleSearch}
                    >
                      {t.search.viewAll}
                    </button>
                  </>
                ) : (
                  <div className="live-search-empty">
                    <strong>{t.search.noProducts}</strong>
                    <span>{t.search.tryAnother}</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* DESKTOP ACCOUNT */}

          <Link
            to={accountLink}
            className="nav-icon-link desktop-account-link"
            aria-label={t.nav.account}
            title={t.nav.account}
            onClick={scrollToTop}
          >
            <AccountIcon />
          </Link>

          {/* DESKTOP FAVORITES */}

          <Link
            to="/wishlist"
            className="nav-icon-link nav-count-link desktop-favorites-link"
            aria-label={`${t.nav.favorites}, ${wishlistItems.length}`}
            title={t.nav.favorites}
            onClick={scrollToTop}
          >
            <HeartIcon />

            {wishlistItems.length > 0 && (
              <span className="nav-icon-badge">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* SHOPPING CART */}

          <button
            type="button"
            className="nav-icon-link nav-cart-button"
            aria-label={`${t.nav.shoppingBag}, ${cartCount}`}
            title={t.nav.shoppingBag}
            onClick={openCart}
          >
            <BagIcon />

            {cartCount > 0 && (
              <span className="nav-icon-badge">
                {cartCount}
              </span>
            )}
          </button>

          {/* MOBILE MENU TOGGLE */}

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
