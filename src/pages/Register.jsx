
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";

function Register() {
  const { register, verifyRegistration } = useAuth();
  const navigate = useNavigate();

  const { language } = useLanguage();
  const t = translations[language].auth;
  const isArabic = language === "ar";

  const text = {
    join: isArabic ? "انضم إلى عالمنا" : "JOIN OUR WORLD",
    brandTitle: isArabic
      ? "اكتشف قطعًا تتجاوز حدود الزمن."
      : "Discover Pieces Beyond Time.",
    brandDescription: isArabic
      ? "كن جزءًا من مجموعة تحكي فيها كل قطعة قصة، وتهتم فيها كل التفاصيل."
      : "Become part of a collection where every object has a story and every detail matters.",
    brandFooter: isArabic
      ? "حيث تحكي كل قطعة قصة."
      : "Where Every Piece Tells a Story.",
    createAccount: isArabic ? "إنشاء حساب جديد" : "CREATE YOUR ACCOUNT",
    joinTitle: isArabic ? "انضم إلى ANTIQUTCO" : "Join ANTIQUTCO",
    description: isArabic
      ? "أنشئ حسابك وابدأ استكشاف مجموعتنا."
      : "Create an account to start exploring our collection.",
    fullName: isArabic ? "الاسم بالكامل" : "Full Name",
    namePlaceholder: isArabic ? "اكتب اسمك بالكامل" : "Enter your full name",
    email: isArabic ? "البريد الإلكتروني" : "Email Address",
    emailPlaceholder: isArabic ? "اكتب بريدك الإلكتروني" : "Enter your email",
    password: isArabic ? "كلمة المرور" : "Password",
    passwordPlaceholder: isArabic ? "8 أحرف على الأقل" : "At least 8 characters",
    confirmPassword: isArabic ? "تأكيد كلمة المرور" : "Confirm Password",
    confirmPlaceholder: isArabic ? "أعد كتابة كلمة المرور" : "Re-enter your password",
    show: isArabic ? "إظهار" : "Show",
    hide: isArabic ? "إخفاء" : "Hide",
    create: isArabic ? "إنشاء الحساب" : "Create Account",
    creating: isArabic ? "جاري إرسال كود التحقق..." : "Sending verification code...",
    alreadyHave: isArabic ? "لديك حساب بالفعل؟" : "Already have an account?",
    signIn: isArabic ? "تسجيل الدخول" : "Sign In",
    required: isArabic
      ? "من فضلك أكمل جميع البيانات."
      : "Please complete all fields.",
    passwordLength: isArabic
      ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
      : "Password must contain at least 8 characters.",
    passwordMismatch: isArabic
      ? "كلمتا المرور غير متطابقتين."
      : "Your passwords do not match.",
    genericError: isArabic
      ? "تعذر إنشاء الحساب. حاول مرة أخرى."
      : "Unable to create your account. Please try again.",
    verifyTitle: isArabic ? "تأكيد البريد الإلكتروني" : "Verify Your Email",
    verifyDescription: isArabic
      ? "أرسلنا كود تحقق إلى بريدك الإلكتروني. أدخل الكود لإكمال إنشاء حسابك."
      : "We sent a verification code to your email. Enter it to complete your registration.",
    otpLabel: isArabic ? "كود التحقق (OTP)" : "Verification Code (OTP)",
    otpPlaceholder: isArabic ? "أدخل الكود المكون من 6 أرقام" : "Enter the 6-digit code",
    verify: isArabic ? "تأكيد البريد وإنشاء الحساب" : "Verify Email & Create Account",
    verifying: isArabic ? "جاري التحقق..." : "Verifying...",
    resend: isArabic ? "إعادة إرسال الكود" : "Resend Code",
    resending: isArabic ? "جاري إعادة الإرسال..." : "Resending...",
    resendSuccess: isArabic
      ? "تم إرسال كود جديد إلى بريدك الإلكتروني."
      : "A new verification code has been sent to your email.",
    back: isArabic ? "العودة إلى بيانات التسجيل" : "Back to Registration",
    otpRequired: isArabic
      ? "يرجى إدخال كود التحقق."
      : "Please enter the verification code.",
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const getErrorMessage = (err) => {
    const data = err?.response?.data || err?.data || err;

    if (data?.errors && typeof data.errors === "object") {
      const messages = Object.values(data.errors)
        .flat()
        .filter((item) => typeof item === "string");

      if (messages.length) {
        return messages.join(" ");
      }
    }

    return data?.message || err?.message || text.genericError;
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirm) {
      setError(text.required);
      return;
    }

    if (form.password.length < 8) {
      setError(text.passwordLength);
      return;
    }

    if (form.password !== form.confirm) {
      setError(text.passwordMismatch);
      return;
    }

    setSubmitting(true);

    try {
      await register(name, email, form.password);
      setStep(2);
      setOtp("");
      setSuccess(
        isArabic
          ? "تم إرسال كود التحقق إلى بريدك الإلكتروني."
          : "A verification code has been sent to your email."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitVerification = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError(text.otpRequired);
      return;
    }

    setSubmitting(true);

    try {
      await verifyRegistration(
        form.email.trim().toLowerCase(),
        otp.trim()
      );

      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password
      );

      setSuccess(text.resendSuccess);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand-panel">
          <div className="auth-brand-content">
            <Link to="/" className="auth-logo">
              ANTIQUTCO<span>.</span>
            </Link>

            <div>
              <span className="auth-eyebrow">{text.join}</span>
              <h2>{text.brandTitle}</h2>
              <p>{text.brandDescription}</p>
            </div>

            <span className="auth-brand-footer">
              {text.brandFooter}
            </span>
          </div>
        </section>

        <section className="auth-form-panel">
          <form
            className="auth-form"
            onSubmit={step === 1 ? submitRegistration : submitVerification}
          >
            <div className="auth-heading">
              <span className="auth-eyebrow">
                {step === 1 ? text.createAccount : text.verifyTitle}
              </span>

              <h1>
                {step === 1 ? text.joinTitle : text.verifyTitle}
              </h1>

              <p>
                {step === 1 ? text.description : text.verifyDescription}
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="auth-success" role="status">
                {success}
              </div>
            )}

            {step === 1 ? (
              <>
                <div className="auth-field">
                  <label htmlFor="register-name">{text.fullName}</label>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder={text.namePlaceholder}
                    value={form.name}
                    onChange={update}
                    autoComplete="name"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-email">{text.email}</label>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder={text.emailPlaceholder}
                    value={form.email}
                    onChange={update}
                    autoComplete="email"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-password">{text.password}</label>

                  <div className="auth-password-wrapper">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={text.passwordPlaceholder}
                      value={form.password}
                      onChange={update}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      disabled={submitting}
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? text.hide : text.show}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="register-confirm">
                    {text.confirmPassword}
                  </label>

                  <div className="auth-password-wrapper">
                    <input
                      id="register-confirm"
                      type={showConfirm ? "text" : "password"}
                      name="confirm"
                      placeholder={text.confirmPlaceholder}
                      value={form.confirm}
                      onChange={update}
                      autoComplete="new-password"
                      required
                      disabled={submitting}
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirm((value) => !value)}
                    >
                      {showConfirm ? text.hide : text.show}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={submitting}
                >
                  {submitting ? text.creating : text.create}
                </button>

                <div className="auth-switch">
                  <span>{text.alreadyHave}</span>
                  <Link to="/login">{text.signIn}</Link>
                </div>
              </>
            ) : (
              <>
                <div className="auth-field">
                  <label htmlFor="register-otp">{text.otpLabel}</label>
                  <input
                    id="register-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={text.otpPlaceholder}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    maxLength={6}
                    required
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={submitting}
                >
                  {submitting ? text.verifying : text.verify}
                </button>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={submitting}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-color, #8b5a2b)",
                      fontSize: "13px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {submitting ? text.resending : text.resend}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                      setSuccess("");
                      setOtp("");
                    }}
                    disabled={submitting}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-color, #333)",
                      fontSize: "13px",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {text.back}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export default Register;
