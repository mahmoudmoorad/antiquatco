import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext(null);
const LANGUAGE_KEY = "antikatko-language";

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) || "ar";
    } catch {
      return "ar";
    }
  });

  const isArabic = language === "ar";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";

    document.body.classList.toggle("arabic-mode", isArabic);
    document.body.classList.toggle("english-mode", !isArabic);

    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Continue without localStorage.
    }
  }, [language, isArabic]);

  const toggleLanguage = () => {
    setLanguage((current) => (current === "ar" ? "en" : "ar"));
  };

  return (
    <LanguageContext.Provider
      value={{ language, isArabic, setLanguage, toggleLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}