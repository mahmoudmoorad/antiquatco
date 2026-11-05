
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const t = translations[language].auth;
  const isArabic = language === "ar";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const update = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirm) {
      setError(
        isArabic
          ? "من فضلك أكمل جميع البيانات."
          : "Please complete all fields."
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        isArabic
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
          : "Password must contain at least 8 characters."
      );
      return;
    }

    if (form.password !== form.confirm) {
      setError(
        isArabic
          ? "كلمتا المرور غير متطابقتين."
          : "Your passwords do not match."
      );
      return;
    }

    try {
      register(name, email);
      navigate("/", { replace: true });
    } catch {
      setError(
        isArabic
          ? "تعذر إنشاء الحساب. حاول مرة أخرى."
          : "Unable to create your account. Please try again."
      );
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">

        {/* Brand Side */}
        <section className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              ANTIKATKO<span>.</span>
            </Link>

            <div>
              <span className="auth-eyebrow">
                {isArabic ? "انضم إلى عالمنا" : "JOIN OUR WORLD"}
              </span>

              <h2>
                {isArabic
                  ? "اكتشف قطعًا تتجاوز حدود الزمن."
                  : "Discover Pieces Beyond Time."}
              </h2>

              <p>
                {isArabic
                  ? "كن جزءًا من مجموعة تحكي فيها كل قطعة قصة، وتهتم فيها كل التفاصيل."
                  : "Become part of a collection where every object has a story and every detail matters."}
              </p>
            </div>

            <span className="auth-brand-footer">
              {isArabic
                ? "حيث تحكي كل قطعة قصة."
                : "Where Every Piece Tells a Story."}
            </span>
          </div>
        </section>

        {/* Register Form */}
        <section className="auth-form-panel">
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-heading">
              <span className="auth-eyebrow">
                {isArabic ? "إنشاء حساب جديد" : "CREATE YOUR ACCOUNT"}
              </span>

              <h1>
                {isArabic ? "انضم إلى ANTIKATKO" : "Join ANTIKATKO"}
              </h1>

              <p>
                {isArabic
                  ? "أنشئ حسابك وابدأ استكشاف مجموعتنا."
                  : "Create an account to start exploring our collection."}
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="register-name">
                {isArabic ? "الاسم بالكامل" : "Full Name"}
              </label>

              <input
                id="register-name"
                type="text"
                name="name"
                placeholder={
                  isArabic ? "اكتب اسمك بالكامل" : "Enter your full name"
                }
                value={form.name}
                onChange={update}
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">
                {isArabic ? "البريد الإلكتروني" : "Email Address"}
              </label>

              <input
                id="register-email"
                type="email"
                name="email"
                placeholder={
                  isArabic ? "اكتب بريدك الإلكتروني" : "Enter your email"
                }
                value={form.email}
                onChange={update}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">
                {isArabic ? "كلمة المرور" : "Password"}
              </label>

              <div className="auth-password-wrapper">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={
                    isArabic
                      ? "8 أحرف على الأقل"
                      : "At least 8 characters"
                  }
                  value={form.password}
                  onChange={update}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword
                    ? isArabic ? "إخفاء" : "Hide"
                    : isArabic ? "إظهار" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm">
                {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>

              <div className="auth-password-wrapper">
                <input
                  id="register-confirm"
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder={
                    isArabic
                      ? "أعد كتابة كلمة المرور"
                      : "Re-enter your password"
                  }
                  value={form.confirm}
                  onChange={update}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  {showConfirm
                    ? isArabic ? "إخفاء" : "Hide"
                    : isArabic ? "إظهار" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-button">
              {isArabic ? "إنشاء الحساب" : "Create Account"}
            </button>

            <div className="auth-switch">
              <span>
                {isArabic
                  ? "لديك حساب بالفعل؟"
                  : "Already have an account?"}
              </span>

              <Link to="/login">
                {isArabic ? "تسجيل الدخول" : "Sign In"}
              </Link>
            </div>

            <p className="auth-demo-note">
              {isArabic
                ? "التسجيل تجريبي حاليًا. سيتم تفعيل إنشاء الحسابات بشكل آمن بعد ربط Django."
                : "Demo registration. Secure account creation will be handled by Django after backend integration."}
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Register;
