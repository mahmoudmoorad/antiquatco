import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Footer() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const t = translations[language].footer || {};
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (sectionName) => {
    setOpenSection((prev) => (prev === sectionName ? null : sectionName));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() !== "") {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="footer-section" dir={isArabic ? "rtl" : "ltr"}>
      <div className="footer-container">
        
        {/* معلومات البراند + أيقونات التواصل الظاهرة دائماً */}
        <div className="footer-col footer-brand-col">
          <h2>ANTIQUTCO</h2>
          <p className="footer-brand-desc">
            {isArabic 
              ? "مصنع متخصص في التحف وقطع الديكور المصنوعة يدوياً بحرفية وتحت إشراف هندسي دقيق." 
              : "A specialized factory for handcrafted antiques and decor under expert engineering supervision."
            }
          </p>
          <p className="footer-contact-info"> info@antikatko.com | +201097215878</p>

          {/* أيقونات وسوشيال ميديا التواصل (ظاهرة دائماً بدون فتح أقسام) */}
          <div className="footer-social-links">
            <a href="https://www.facebook.com/share/18gckR3ZBo/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://wa.me/201009148544" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>

        {/* روابط سريعة */}
        <div className={`footer-col footer-accordion ${openSection === "links" ? "is-open" : ""}`}>
          <h3 onClick={() => toggleSection("links")}>
            <span>{t.quickLinks || (isArabic ? "روابط سريعة" : "Quick Links")}</span>
            <span className="accordion-arrow">⌄</span>
          </h3>
          <ul>
            <li><Link to="/" onClick={scrollToTop}>{t.home || (isArabic ? "الرئيسية" : "Home")}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{t.collection || (isArabic ? "المجموعة" : "Collection")}</Link></li>
            <li><Link to="/contact" onClick={scrollToTop}>{t.contact || (isArabic ? "تواصل معنا" : "Contact Us")}</Link></li>
          </ul>
        </div>

        {/* سياسات المتجر */}
        <div className={`footer-col footer-accordion ${openSection === "policy" ? "is-open" : ""}`}>
          <h3 onClick={() => toggleSection("policy")}>
            <span>{isArabic ? "سياسات المتجر" : "Store Policy"}</span>
            <span className="accordion-arrow">⌄</span>
          </h3>
          <ul>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "شروط الخدمة" : "Terms of Service"}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "سياسة الاسترجاع" : "Return Policy"}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "سياسة الشحن" : "Shipping Policy"}</Link></li>
          </ul>
        </div>

        {/* النشرة البريدية */}
        <div className={`footer-col footer-accordion footer-newsletter-col ${openSection === "newsletter" ? "is-open" : ""}`}>
          <h3 onClick={() => toggleSection("newsletter")}>
            <span>{isArabic ? "انضم إلى عائلة ANTIQUTCO" : "Join The ANTIQUTCO Family"}</span>
            <span className="accordion-arrow">⌄</span>
          </h3>
          <div className="footer-accordion-body">
            <p>{t.newsletterDescription || (isArabic ? "كن أول من يعرف أحدث القطع والمجموعات المصنوعة يدوياً." : "Be the first to know about our latest handmade pieces.")}</p>
            
            {subscribed ? (
              <div className="success-message" style={{ color: "#d4af37", fontWeight: "600", marginTop: "8px" }}>
                {isArabic ? "تم اشتراكك بنجاح! شكراً لك." : "Successfully subscribed! Thank you."}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="footer-input-group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder || (isArabic ? "أدخل بريدك الإلكتروني" : "Enter your email address")} 
                  required
                />
                <button type="submit">{t.subscribe || (isArabic ? "اشتراك" : "Subscribe")}</button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* حقوق النشر و Powered by */}
      <div className="footer-bottom">
        <p>© {currentYear} ANTIQUTCO {t.copyright || (isArabic ? "جميع الحقوق محفوظة." : "All Rights Reserved.")}</p>
        <p className="footer-powered-by">
          {isArabic ? "تطوير وتشغيل " : "Powered by "}
          <strong>MS SOLUTIONS</strong>
        </p>
      </div>
    </footer>
  );
}

export default Footer;