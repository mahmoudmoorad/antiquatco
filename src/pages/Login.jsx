
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { language } = useLanguage();
  const t = translations[language].auth;
  const isArabic = language === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(
        isArabic
          ? "يرجى إدخال البريد الإلكتروني وكلمة المرور."
          : "Please enter your email and password."
      );
      return;
    }

    try {
      login(cleanEmail);
      navigate(location.state?.from || "/", { replace: true });
    } catch {
      setError(t.loginError);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              ANTIKATKO<span>.</span>
            </Link>

            <div>
              <span className="auth-eyebrow">
                {isArabic ? "جمال لا يتأثر بالزمن" : "TIMELESS BEAUTY"}
              </span>

              <h2>
                {isArabic
                  ? "مرحبًا بعودتك إلى عالم من الحكايات."
                  : "Welcome Back To A World Of Stories."}
              </h2>

              <p>
                {isArabic
                  ? "اكتشف القطع الفريدة والكنوز الخالدة والمقتنيات التي تضيف طابعًا مميزًا لكل مساحة."
                  : "Discover unique pieces, timeless treasures, and objects that make every space special."}
              </p>
            </div>

            <span className="auth-brand-footer">
              {isArabic
                ? "كل قطعة تحمل حكاية."
                : "Where Every Piece Tells a Story."}
            </span>
          </div>
        </section>

        <section className="auth-form-panel">
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-heading">
              <span className="auth-eyebrow">
                {t.welcomeBack}
              </span>

              <h1>{t.login}</h1>

              <p>{t.loginDescription}</p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="login-email">
                {t.email}
              </label>

              <input
                id="login-email"
                type="email"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">
                {t.password}
              </label>

              <div className="auth-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? t.hidePassword
                      : t.showPassword
                  }
                >
                  {showPassword
                    ? isArabic
                      ? "إخفاء"
                      : "Hide"
                    : isArabic
                      ? "إظهار"
                      : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-button">
              {t.login}
            </button>

            <div className="auth-switch">
              <span>{t.noAccount}</span>
              <Link to="/register">{t.registerNow}</Link>
            </div>

            <p className="auth-demo-note">
              {t.demoNotice}
              {" "}
              {isArabic
                ? "سيتم تفعيل التحقق الحقيقي من الحسابات بعد ربط Django."
                : "Real account verification will be available after connecting the Django backend."}
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Login;
