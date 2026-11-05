import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Footer() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const t = translations[language].footer || {};
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  // حالات لحفظ البريد الإلكتروني ورسالة النجاح
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const whatsappNumber = "+201000000000";
  const whatsappMessage = isArabic 
    ? "مرحباً، أهتم بالاستفسار عن منتجات وقطع مصنع ANTIKATKO." 
    : "Hello, I am interested in inquiring about ANTIKATKO factory products.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // دالة التعامل مع الضغط على زر الاشتراك
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() !== "") {
      setSubscribed(true);
      setEmail(""); // مسح الحقل بعد الإرسال
    }
  };

  return (
    <footer className="footer-section" dir={isArabic ? "rtl" : "ltr"}>
      <div className="footer-container">
        
        {/* العمود الأول: النشرة البريدية والتواصل */}
        <div className="footer-col footer-newsletter-col">
          <h3>{isArabic ? "انضم إلى عائلة ANTIKATKO" : "Join The ANTIKATKO Family"}</h3>
          <p>{t.newsletterDescription || (isArabic ? "كن أول من يعرف أحدث القطع والمجموعات المصنوعة يدوياً." : "Be the first to know about our latest handmade pieces.")}</p>
          
          {subscribed ? (
            <div className="success-message" style={{ color: "#d4af37", fontWeight: "600", marginTop: "10px" }}>
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

          <div className="footer-social-links">
            <a href="https://www.facebook.com/share/18gckR3ZBo/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://wa.me/201009148544" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>

        {/* العمود الثاني: سياسات المتجر */}
        <div className="footer-col">
          <h3>{isArabic ? "سياسات المتجر" : "Store Policy"}</h3>
          <ul>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "شروط الخدمة" : "Terms of Service"}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "سياسة الاسترجاع" : "Return Policy"}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{isArabic ? "سياسة الشحن" : "Shipping Policy"}</Link></li>
          </ul>
        </div>

        {/* العمود الثالث: روابط سريعة */}
        <div className="footer-col">
          <h3>{t.quickLinks || (isArabic ? "روابط سريعة" : "Quick Links")}</h3>
          <ul>
            <li><Link to="/" onClick={scrollToTop}>{t.home || (isArabic ? "الرئيسية" : "Home")}</Link></li>
            <li><Link to="/shop" onClick={scrollToTop}>{t.collection || (isArabic ? "المجموعة" : "Collection")}</Link></li>
            <li><Link to="/contact" onClick={scrollToTop}>{t.contact || (isArabic ? "تواصل معنا" : "Contact Us")}</Link></li>
          </ul>
        </div>

        {/* العمود الرابع: معلومات البراند والمصنع */}
        <div className="footer-col footer-brand-col">
          <h2>ANTIKATKO.</h2>
          <p className="footer-brand-desc">
            {isArabic 
              ? "مصنع متخصص في التحف وقطع الديكور المصنوعة يدوياً بحرفية وتحت إشراف هندسي دقيق." 
              : "A specialized factory for handcrafted antiques and decor under expert engineering supervision."
            }
          </p>
          <p className="footer-contact-info">info@antikatko.com</p>
          <p className="footer-contact-info">01097215878</p>
        </div>

      </div>

      {/* شريط حقوق النشر السفلي */}
      <div className="footer-bottom">
        <p>© {currentYear} ANTIKATKO. {t.copyright || (isArabic ? "جميع الحقوق محفوظة." : "All Rights Reserved.")}</p>
      </div>
    </footer>
  );
}

export default Footer;