
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLogin.css";

function AdminLogin() {
  const { login, logout, user, loading, isAdmin } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from?.startsWith("/admin")
    ? location.state.from
    : "/admin";

  if (loading) {
    return (
      <div className="admin-login-loading">
        Verifying session...
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(email.trim(), password);

      if (!loggedInUser?.isAdmin) {
        // لا نسمح للعميل العادي بالاحتفاظ بجلسة من صفحة الأدمن.
        await logout();

        setError(
          "هذا الحساب غير مصرح له بالدخول إلى لوحة التحكم."
        );

        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "تعذر تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-decoration admin-login-decoration-one" />
      <div className="admin-login-decoration admin-login-decoration-two" />

      <section className="admin-login-card">
        <Link to="/" className="admin-login-brand">
          <span className="admin-login-brand-name">ANTIKATKO</span>
          <span className="admin-login-brand-line" />
          <span className="admin-login-brand-tagline">
            WHERE EVERY PIECE TELLS A STORY
          </span>
        </Link>

        <div className="admin-login-heading">
          <span className="admin-login-eyebrow">
            ADMINISTRATION
          </span>

          <h1>Admin Login</h1>

          <p>
            Sign in to access the administration dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-email">Email Address</label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your admin email"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>

            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={submitting}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/">
            Back to Store
          </Link>

          <span>Secure Administration Access</span>
        </div>
      </section>

      <p className="admin-login-copyright">
        © {new Date().getFullYear()} ANTIQUTCO All rights reserved.
      </p>
    </main>
  );
}

export default AdminLogin;
