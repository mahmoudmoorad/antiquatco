
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import translations from "../data/translations";
import authService from "../services/authService";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { language } = useLanguage();
  const t = translations[language].auth;
  const isArabic = language === "ar";

  const text = {
    recovery: isArabic ? "استعادة الحساب" : "Account Recovery",
    forgotPassword: isArabic ? "نسيت كلمة المرور" : "Forgot Password",
    recoveryDescription: isArabic
      ? "أدخل بريدك الإلكتروني لتلقي رمز الاستعادة."
      : "Enter your email to receive a recovery code.",
    emailRequired: isArabic
      ? "يرجى إدخال البريد الإلكتروني."
      : "Please enter your email.",
    passwordRequired: isArabic
      ? "يرجى إدخال كلمة المرور."
      : "Please enter your password.",
    otpRequired: isArabic
      ? "يرجى إدخال كود التحقق وكلمة المرور الجديدة."
      : "Please enter the verification code and your new password.",
    recoverySent: isArabic
      ? "إذا كان البريد الإلكتروني مسجلاً لدينا، فقد تم إرسال كود التحقق إلى بريدك."
      : "If an account exists with this email, a verification code has been sent.",
    passwordUpdated: isArabic
      ? "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
      : "Password reset successfully. You can now log in.",
    processing: isArabic ? "جاري التنفيذ..." : "Processing...",
    sendRecoveryCode: isArabic ? "إرسال كود الاستعادة" : "Send Recovery Code",
    updatePassword: isArabic ? "تحديث كلمة المرور" : "Update Password",
    otp: isArabic ? "كود التحقق (OTP)" : "Verification Code (OTP)",
    otpPlaceholder: isArabic ? "أدخل أحدث كود وصلك" : "Enter the latest code received",
    latestCode: isArabic
      ? "استخدم أحدث كود تم إرساله."
      : "Use the most recent code sent.",
    resendCode: isArabic ? "إعادة إرسال الكود؟" : "Resend code?",
    newPassword: isArabic ? "كلمة المرور الجديدة" : "New Password",
    newPasswordPlaceholder: isArabic
      ? "أدخل كلمة مرور قوية جديدة"
      : "Enter a strong new password",
    passwordHint: isArabic
      ? "يجب أن تحتوي كلمة المرور على حروف وأرقام ورموز."
      : "Your password should contain letters, numbers, and symbols.",
    resendSuccess: isArabic
      ? "تم إرسال كود جديد. يرجى التحقق من أحدث رسالة."
      : "A new code has been sent. Please check your latest message.",
    resendError: isArabic
      ? "فشل إعادة إرسال الكود. يرجى المحاولة مرة أخرى."
      : "Failed to resend the code. Please try again.",
    backToLogin: isArabic ? "العودة لتسجيل الدخول" : "Back to Login",
    genericError: isArabic
      ? "حدث خطأ، يرجى المحاولة مرة أخرى."
      : "An error occurred. Please try again.",
    brandEyebrow: isArabic ? "جمال لا يتأثر بالزمن" : "TIMELESS BEAUTY",
    brandHeading: isArabic
      ? "مرحبًا بعودتك إلى عالم من الحكايات."
      : "Welcome Back To A World Of Stories.",
    brandDescription: isArabic
      ? "اكتشف القطع الفريدة والكنوز الخالدة والمقتنيات التي تضيف طابعًا مميزًا لكل مساحة."
      : "Discover unique pieces, timeless treasures, and objects that make every space special.",
    brandFooter: isArabic
      ? "كل قطعة تحمل حكاية."
      : "Where Every Piece Tells a Story.",
    forgotPasswordLink: isArabic ? "نسيت كلمة المرور؟" : "Forgot Password?",
    show: isArabic ? "إظهار" : "Show",
    hide: isArabic ? "إخفاء" : "Hide",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const getErrorMessage = (err) => {
    const errorData = err?.response?.data || err;

    if (errorData?.errors) {
      return Object.values(errorData.errors)
        .flat()
        .map((item) => typeof item === "string" ? item : "")
        .filter(Boolean)
        .join(" ") || text.genericError;
    }

    return errorData?.message || err?.message || text.genericError;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(text.emailRequired);
      return;
    }

    if (isForgotPassword && resetStep === 2 && (!resetOtp.trim() || !newPassword)) {
      setError(text.otpRequired);
      return;
    }

    if (!isForgotPassword && !password) {
      setError(text.passwordRequired);
      return;
    }

    setSubmitting(true);

    try {
      if (isForgotPassword) {
        if (resetStep === 1) {
          await authService.requestPasswordReset(cleanEmail);
          setResetStep(2);
          setSuccessMsg(text.recoverySent);
        } else {
          await authService.confirmPasswordReset(
            cleanEmail,
            resetOtp.trim(),
            newPassword
          );

          setSuccessMsg(text.passwordUpdated);
          setIsForgotPassword(false);
          setResetStep(1);
          setResetOtp("");
          setNewPassword("");
          setPassword("");
        }
      } else {
        const loggedUser = await login(cleanEmail, password);

        let target = location.state?.from || "/";

        if (loggedUser?.isAdmin && target === "/") {
          target = "/admin";
        }

        navigate(target, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccessMsg("");
    setResending(true);

    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setSuccessMsg(text.resendSuccess);
    } catch (err) {
      setError(getErrorMessage(err) || text.resendError);
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setResetStep(1);
    setError("");
    setSuccessMsg("");
    setResetOtp("");
    setNewPassword("");
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
              <span className="auth-eyebrow">
                {text.brandEyebrow}
              </span>

              <h2>{text.brandHeading}</h2>

              <p>{text.brandDescription}</p>
            </div>

            <span className="auth-brand-footer">
              {text.brandFooter}
            </span>
          </div>
        </section>

        <section className="auth-form-panel">
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-heading">
              <span className="auth-eyebrow">
                {isForgotPassword ? text.recovery : t.welcomeBack}
              </span>

              <h1>
                {isForgotPassword ? text.forgotPassword : t.login}
              </h1>

              <p>
                {isForgotPassword
                  ? text.recoveryDescription
                  : t.loginDescription}
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {successMsg && (
              <div
                className="auth-success"
                role="status"
              >
                {successMsg}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="login-email">{t.email}</label>

              <input
                id="login-email"
                type="email"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
              />
            </div>

            {!isForgotPassword && (
              <div className="auth-field">
                <label htmlFor="login-password">{t.password}</label>

                <div className="auth-password-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={submitting}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? text.hide : text.show}
                  >
                    {showPassword ? text.hide : text.show}
                  </button>
                </div>

                <div style={{ textAlign: "end", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setResetStep(1);
                      setError("");
                      setSuccessMsg("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-color, #8b5a2b)",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    {text.forgotPasswordLink}
                  </button>
                </div>
              </div>
            )}

            {isForgotPassword && resetStep === 2 && (
              <>
                <div className="auth-field">
                  <label htmlFor="reset-otp">{text.otp}</label>

                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={text.otpPlaceholder}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    required
                    disabled={submitting}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "4px",
                    }}
                  >
                    <small style={{ color: "#666", fontSize: "11px" }}>
                      {text.latestCode}
                    </small>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resending || submitting}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary-color, #8b5a2b)",
                        fontSize: "11px",
                        cursor: resending ? "not-allowed" : "pointer",
                        padding: 0,
                        textDecoration: "underline",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {resending ? text.processing : text.resendCode}
                    </button>
                  </div>
                </div>

                <div className="auth-field" style={{ marginTop: "12px" }}>
                  <label htmlFor="new-password">{text.newPassword}</label>

                  <input
                    id="new-password"
                    type="password"
                    placeholder={text.newPasswordPlaceholder}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={submitting}
                  />

                  <small
                    style={{
                      color: "#666",
                      fontSize: "11px",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    {text.passwordHint}
                  </small>
                </div>
              </>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={submitting || resending}
            >
              {submitting
                ? text.processing
                : isForgotPassword
                  ? resetStep === 1
                    ? text.sendRecoveryCode
                    : text.updatePassword
                  : t.login}
            </button>

            {isForgotPassword && (
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-color, #333)",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {text.backToLogin}
                </button>
              </div>
            )}

            {!isForgotPassword && (
              <div className="auth-switch">
                <span>{t.noAccount}</span>
                <Link to="/register">{t.registerNow}</Link>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export default Login;
