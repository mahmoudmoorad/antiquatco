import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";

import translations from "../data/translations";
import products from "../data/products";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-3.4 3.2-5.2 7-5.2s6.3 1.8 7 5.2" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartCount, openCart } = useCart();
  const { wishlistItems } = useWishlist();

  const { language, isArabic, toggleLanguage } = useLanguage();

  const t = translations[language];

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchResults = searchTerm.trim()
    ? products.filter((product) => {
        const query = searchTerm.trim().toLowerCase();

        return (
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      })
    : [];

  const formatPrice = (price) => {
    const locale = isArabic ? "ar-EG" : "en-US";

    return `${Number(price).toLocaleString(locale)} ${t.common.currency}`;
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) return;

    navigate(`/shop?search=${encodeURIComponent(query)}`);

    setSearchOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link
          to="/"
          className="logo"
          onClick={scrollToTop}
        >
          ANTIKATKO<span>.</span>
        </Link>

        {/* Main Navigation */}
        <nav
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
        </nav>

        {/* Navbar Actions */}
        <div className="nav-actions">

          {/* Language Toggle */}
          <button
            type="button"
            className="language-toggle"
            onClick={toggleLanguage}
            aria-label={isArabic ? "Switch to English" : "التغيير إلى العربية"}
            title={isArabic ? "English" : "العربية"}
          >
            {t.nav.language}
          </button>

          {/* Live Search */}
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

            {/* Live Search Results */}
            {searchOpen && searchTerm.trim() && (
              <div className="live-search-dropdown">

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
                          alt={product.name}
                        />

                        <div className="live-search-info">
                          <span className="live-search-name">
                            {product.name}
                          </span>

                          <span className="live-search-category">
                            {product.category}
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

          {/* Account */}
          <Link
            to="/login"
            className="nav-icon-link"
            aria-label={t.nav.account}
            title={t.nav.account}
            onClick={scrollToTop}
          >
            <AccountIcon />
          </Link>

          {/* Favorites */}
          <Link
            to="/wishlist"
            className="nav-icon-link nav-count-link"
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

          {/* Shopping Cart */}
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

          {/* Mobile Menu */}
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