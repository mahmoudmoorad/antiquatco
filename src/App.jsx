
import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  Link,
} from "react-router-dom";

import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";

import AdminApp from "./admin/AdminApp";
import AdminLogin from "./pages/admin/AdminLogin";

import "./App.css";
import "./commerce.css";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

// Protect Admin Dashboard
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-route-loading">
        Verifying access...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied" dir="rtl">
        <h2>غير مصرح بالدخول</h2>

        <p>
          ليس لديك صلاحية الوصول إلى هذه الصفحة.
        </p>

        <Link to="/">
          العودة إلى المتجر
        </Link>
      </div>
    );
  }

  return children;
}

// Protect Customer Profile
function ProfileRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        جاري التحقق من الحساب...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Profile />;
}

function Storefront() {
  return (
    <>
      <Navbar />
      <CartDrawer />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/order-confirmation/:orderId"
          element={<OrderConfirmation />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/profile" element={<ProfileRoute />} />
      </Routes>

      <Footer />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <ScrollToTop />

              <Routes>
                {/* Public Admin Login */}
                <Route
                  path="/admin/login"
                  element={<AdminLogin />}
                />

                {/* Protected Admin Dashboard */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminApp />
                    </AdminRoute>
                  }
                />

                {/* Customer Storefront */}
                <Route path="/*" element={<Storefront />} />
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
