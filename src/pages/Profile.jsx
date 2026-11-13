
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import orderService from "../services/orderService";

import "./Profile.css";

function Profile() {
  const { user, logout } = useAuth();

  const {
    cartItems = [],
    cartCount = 0,
    cartTotal = 0,
    updateQuantity,
    removeFromCart,
  } = useCart() || {};

  const { wishlistItems = [], removeFromWishlist } = useWishlist() || {};
  const { language } = useLanguage();

  const navigate = useNavigate();
  const isArabic = language === "ar";

  const [loggingOut, setLoggingOut] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState([]);

  const ordersRequestInProgress = useRef(false);
  const isMountedRef = useRef(true);

  const t = {
    title: isArabic ? "حسابي" : "My Account",
    subtitle: isArabic
      ? "إدارة حسابك ومتابعة اختياراتك"
      : "Manage your account and keep track of your selections",
    accountInfo: isArabic ? "بيانات الحساب" : "Account Information",
    fullName: isArabic ? "الاسم" : "Full Name",
    email: isArabic ? "البريد الإلكتروني" : "Email Address",
    phone: isArabic ? "رقم الهاتف" : "Phone Number",
    notAvailable: isArabic ? "غير متوفر" : "Not provided",
    favorites: isArabic ? "منتجاتي المفضلة" : "My Wishlist",
    cart: isArabic ? "سلة التسوق" : "Shopping Cart",
    orders: isArabic ? "طلباتي" : "My Orders",
    orderId: isArabic ? "رقم الطلب" : "Order ID",
    orderStatus: isArabic ? "حالة الطلب" : "Order Status",
    paymentStatus: isArabic ? "حالة الدفع" : "Payment Status",
    orderTotal: isArabic ? "الإجمالي" : "Total",
    orderItems: isArabic ? "منتجات الطلب" : "Order Items",
    quantity: isArabic ? "الكمية" : "Quantity",
    emptyOrders: isArabic
      ? "ليس لديك أي طلبات مسجلة بهذا الحساب حتى الآن."
      : "You haven't placed any orders with this account yet.",
    favoriteCount: isArabic ? "منتج في المفضلة" : "saved items",
    cartCount: isArabic ? "منتج في السلة" : "items in cart",
    viewProduct: isArabic ? "عرض المنتج" : "View Product",
    remove: isArabic ? "إزالة" : "Remove",
    emptyWishlist: isArabic
      ? "لم تضف أي منتجات إلى المفضلة حتى الآن."
      : "You haven't added any products to your wishlist yet.",
    emptyCart: isArabic
      ? "سلة التسوق فارغة حالياً."
      : "Your shopping cart is currently empty.",
    browse: isArabic ? "تصفح المتجر" : "Explore Store",
    subtotal: isArabic ? "إجمالي المنتجات" : "Subtotal",
    checkout: isArabic ? "إتمام الشراء" : "Proceed to Checkout",
    logout: isArabic ? "تسجيل الخروج" : "Log Out",
    loggingOut: isArabic ? "جارٍ تسجيل الخروج..." : "Logging out...",
    decrease: isArabic ? "تقليل الكمية" : "Decrease quantity",
    increase: isArabic ? "زيادة الكمية" : "Increase quantity",
    welcome: isArabic ? "مرحباً،" : "Welcome,",
    currency: isArabic ? "جنيه" : "EGP",
    pending: isArabic ? "قيد الانتظار" : "Pending",
    confirmed: isArabic ? "تم التأكيد" : "Confirmed",
    processing: isArabic ? "قيد التجهيز" : "Processing",
    shipped: isArabic ? "تم الشحن" : "Shipped",
    delivered: isArabic ? "تم التسليم" : "Delivered",
    cancelled: isArabic ? "ملغي" : "Cancelled",
    paid: isArabic ? "مدفوع" : "Paid",
    unpaid: isArabic ? "غير مدفوع" : "Unpaid",
    failed: isArabic ? "فشل الدفع" : "Payment Failed",
    refunded: isArabic ? "تم رد المبلغ" : "Refunded",
    unknown: isArabic ? "غير محدد" : "Not specified",
    loading: isArabic ? "جارٍ تحميل الطلبات..." : "Loading orders...",
    loadError: isArabic
      ? "تعذر تحميل الطلبات. حاول مرة أخرى."
      : "Couldn't load your orders. Please try again.",
    retry: isArabic ? "إعادة المحاولة" : "Try Again",
    refresh: isArabic ? "تحديث الطلبات" : "Refresh Orders",
    refreshing: isArabic ? "جارٍ التحديث..." : "Refreshing...",
    lastUpdated: isArabic
      ? "يتم تحديث الطلبات تلقائيًا"
      : "Orders refresh automatically",
    showDetails: isArabic ? "عرض التفاصيل" : "View Details",
    hideDetails: isArabic ? "إخفاء التفاصيل" : "Hide Details",
    noItems: isArabic
      ? "لا توجد تفاصيل للمنتجات"
      : "No item details available",
    leaving: isArabic ? "هل تريد تسجيل الخروج؟" : "Leaving so soon?",
    logoutDescription: isArabic
      ? "يمكنك العودة إلى حسابك في أي وقت."
      : "You can sign back into your account anytime.",
  };

  // Format prices according to the selected language.
  const formatPrice = (price) => {
    const amount = Number(price) || 0;

    return `${new Intl.NumberFormat(
      isArabic ? "ar-EG" : "en-EG"
    ).format(amount)} ${t.currency}`;
  };

  // Format order dates safely.
  const formatDate = (date) => {
    if (!date) return t.notAvailable;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return t.notAvailable;
    }

    return parsedDate.toLocaleDateString(
      isArabic ? "ar-EG" : "en-EG",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const getProductName = (product) => {
    if (!product) return isArabic ? "منتج" : "Product";

    return isArabic
      ? product.nameAr || product.name_ar || product.name || "منتج"
      : product.name || product.name_en || product.nameAr || "Product";
  };

  const getProductImage = (product) => {
    if (!product) return "";

    return (
      product.image ||
      product.image_url ||
      product.imageUrl ||
      product.main_image ||
      ""
    );
  };

  const getUserName = () => {
    if (!user) {
      return isArabic ? "عميل ANTIQUTCO" : "ANTIQUTCO Customer";
    }

    return (
      user.name ||
      user.full_name ||
      user.username ||
      (user.email ? user.email.split("@")[0] : null) ||
      (isArabic ? "عميل ANTIQUTCO" : "ANTIQUTCO Customer")
    );
  };

  const getInitials = () => {
    return getUserName()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  const normalizeStatus = (status) => {
    return String(status || "PENDING")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");
  };

  const getOrderStatusLabel = (status) => {
    const normalizedStatus = normalizeStatus(status);

    const statusLabels = {
      PENDING: t.pending,
      CONFIRMED: t.confirmed,
      PROCESSING: t.processing,
      SHIPPED: t.shipped,
      DELIVERED: t.delivered,
      CANCELLED: t.cancelled,
    };

    return statusLabels[normalizedStatus] || status || t.pending;
  };

  const getPaymentStatusLabel = (status) => {
    const normalizedStatus = normalizeStatus(status);

    const statusLabels = {
      PAID: t.paid,
      COMPLETED: t.paid,
      SUCCESS: t.paid,
      UNPAID: t.unpaid,
      PENDING: t.pending,
      FAILED: t.failed,
      REFUNDED: t.refunded,
      CANCELLED: t.cancelled,
    };

    return statusLabels[normalizedStatus] || status || t.unknown;
  };

  const getStatusClass = (status) => {
    return normalizeStatus(status)
      .toLowerCase()
      .replace(/_/g, "-");
  };

  // Fetch orders with protection against overlapping requests.
  const fetchUserOrders = useCallback(async (showLoader = false) => {
    if (
      ordersRequestInProgress.current ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    ordersRequestInProgress.current = true;

    if (showLoader && isMountedRef.current) {
      setRefreshingOrders(true);
    }

    try {
      const ordersList = await orderService.getMyOrders();

      if (isMountedRef.current) {
        setOrders(Array.isArray(ordersList) ? ordersList : []);
        setOrdersError("");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);

      if (isMountedRef.current) {
        setOrdersError(t.loadError);
      }
    } finally {
      ordersRequestInProgress.current = false;

      if (isMountedRef.current) {
        setLoadingOrders(false);
        setRefreshingOrders(false);
      }
    }
  }, [t.loadError]);

  // Automatically refresh orders every 10 seconds.
  useEffect(() => {
    isMountedRef.current = true;

    fetchUserOrders();

    const intervalId = setInterval(() => {
      fetchUserOrders();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUserOrders();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [fetchUserOrders]);

  const handleRefreshOrders = () => {
    fetchUserOrders(true);
  };

  const toggleOrderDetails = (orderKey) => {
    setExpandedOrders((current) =>
      current.includes(orderKey)
        ? current.filter((key) => key !== orderKey)
        : [...current, orderKey]
    );
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleQuantityChange = (item, amount) => {
    if (!item) return;

    const newQuantity = Number(item.quantity || 1) + amount;

    if (newQuantity < 1) {
      removeFromCart(item.id);
      return;
    }

    updateQuantity(item.id, newQuantity);
  };

  // Render products belonging to an order.
  const renderOrderItems = (order) => {
    const items = order.items || order.order_items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return <p className="profile-order-no-items">{t.noItems}</p>;
    }

    return (
      <div className="profile-order-items">
        {items.map((item, index) => {
          const product = item.product_details || item.product || item;
          const itemKey = item.id || item.pk || `${order.id}-${index}`;
          const quantity = item.quantity || 1;

          const itemPrice =
            item.price ??
            item.unit_price ??
            product.price ??
            0;

          return (
            <div className="profile-order-item" key={itemKey}>
              <div className="profile-order-item-image">
                {getProductImage(product) ? (
                  <img
                    src={getProductImage(product)}
                    alt={getProductName(product)}
                  />
                ) : (
                  <div className="profile-image-placeholder">
                    ANTIQUTCO
                  </div>
                )}
              </div>

              <div className="profile-order-item-info">
                <strong>{getProductName(product)}</strong>
                <span>
                  {t.quantity}: {quantity}
                </span>
              </div>

              <strong className="profile-order-item-price">
                {formatPrice(Number(itemPrice) * Number(quantity))}
              </strong>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="profile-page" dir={isArabic ? "rtl" : "ltr"}>
      <div className="profile-container">

        {/* Page Header */}
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">ANTIQUTCO</span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <Link className="profile-shop-link" to="/shop">
            {t.browse}
          </Link>
        </div>

        {/* Account Overview */}
        <section className="profile-overview">
          <div className="profile-user-card">
            <div className="profile-avatar">{getInitials()}</div>

            <div className="profile-user-details">
              <span>{t.welcome}</span>
              <h2>{getUserName()}</h2>
              <p>{user?.email || t.notAvailable}</p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-number">{orders.length}</span>
              <span className="profile-stat-label">{t.orders}</span>
            </div>

            <div className="profile-stat">
              <span className="profile-stat-number">
                {Array.isArray(wishlistItems) ? wishlistItems.length : 0}
              </span>
              <span className="profile-stat-label">{t.favorites}</span>
            </div>

            <div className="profile-stat">
              <span className="profile-stat-number">{cartCount}</span>
              <span className="profile-stat-label">{t.cart}</span>
            </div>
          </div>
        </section>

        {/* Account Information */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span className="profile-section-label">
                {isArabic ? "معلوماتك الشخصية" : "PERSONAL DETAILS"}
              </span>
              <h2>{t.accountInfo}</h2>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span>{t.fullName}</span>
              <strong>{getUserName()}</strong>
            </div>

            <div className="profile-info-item">
              <span>{t.email}</span>
              <strong dir="ltr">{user?.email || t.notAvailable}</strong>
            </div>

            <div className="profile-info-item">
              <span>{t.phone}</span>
              <strong dir="ltr">
                {user?.phone ||
                  user?.phone_number ||
                  user?.mobile ||
                  user?.profile?.phone ||
                  orders[0]?.customer?.phone ||
                  orders[0]?.customer_phone ||
                  t.notAvailable}
              </strong>
            </div>
          </div>
        </section>

        {/* My Orders */}
        <section className="profile-section">
          <div className="profile-section-heading profile-orders-heading">
            <div>
              <span className="profile-section-label">
                {isArabic ? "مشترياتك السابقة" : "PURCHASE HISTORY"}
              </span>
              <h2>{t.orders}</h2>
              <p>{t.lastUpdated}</p>
            </div>

            <button
              type="button"
              className="profile-refresh-button"
              onClick={handleRefreshOrders}
              disabled={refreshingOrders}
            >
              <span
                className={
                  refreshingOrders
                    ? "profile-refresh-icon spinning"
                    : "profile-refresh-icon"
                }
              >
                ↻
              </span>
              {refreshingOrders ? t.refreshing : t.refresh}
            </button>
          </div>

          {loadingOrders ? (
            <div className="profile-empty">
              <span className="profile-loading-spinner" />
              <p>{t.loading}</p>
            </div>
          ) : ordersError && orders.length === 0 ? (
            <div className="profile-empty profile-orders-error">
              <p>{ordersError}</p>
              <button
                type="button"
                className="profile-primary-button"
                onClick={handleRefreshOrders}
                disabled={refreshingOrders}
              >
                {t.retry}
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="profile-empty">
              <p>{t.emptyOrders}</p>
              <Link className="profile-primary-button" to="/shop">
                {t.browse}
              </Link>
            </div>
          ) : (
            <>
              {ordersError && (
                <div className="profile-orders-warning">
                  {ordersError}
                </div>
              )}

              <div className="profile-orders-list">
                {orders.map((order, index) => {
                  if (!order) return null;

                  const orderKey =
                    order.pk ||
                    order.id ||
                    order.order_number ||
                    `order-${index}`;

                  const orderDate =
                    order.createdAt ||
                    order.created_at ||
                    order.date;

                  const orderTotal =
                    order.total ??
                    order.finalTotal ??
                    order.total_price ??
                    order.total_amount ??
                    0;

                  const orderStatus = order.status || "Pending";

                  const paymentStatus =
                    order.paymentStatus ||
                    order.payment_status ||
                    order.payment?.status ||
                    "";

                  const isExpanded = expandedOrders.includes(orderKey);

                  return (
                    <article className="profile-order-card" key={orderKey}>
                      <div className="profile-order-header">
                        <div className="profile-order-number">
                          <span className="profile-order-id-label">
                            {t.orderId}:
                          </span>

                          <strong>
                            #{order.order_number || order.orderId || order.id}
                          </strong>
                        </div>

                        <div className="profile-order-date">
                          {formatDate(orderDate)}
                        </div>
                      </div>

                      <div className="profile-order-body">
                        <div className="profile-order-status-group">
                          <span className="profile-order-field-label">
                            {t.orderStatus}
                          </span>

                          <span
                            className={`order-status-badge ${getStatusClass(orderStatus)}`}
                          >
                            {getOrderStatusLabel(orderStatus)}
                          </span>
                        </div>

                        <div className="profile-order-status-group">
                          <span className="profile-order-field-label">
                            {t.paymentStatus}
                          </span>

                          <span
                            className={`order-status-badge payment-${getStatusClass(paymentStatus || "unknown")}`}
                          >
                            {getPaymentStatusLabel(paymentStatus)}
                          </span>
                        </div>

                        <div className="profile-order-total">
                          <span className="profile-order-field-label">
                            {t.orderTotal}
                          </span>

                          <strong>{formatPrice(orderTotal)}</strong>
                        </div>
                      </div>

                      <div className="profile-order-footer">
                        <button
                          type="button"
                          className="profile-order-details-button"
                          onClick={() => toggleOrderDetails(orderKey)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? t.hideDetails : t.showDetails}
                          <span>{isExpanded ? "−" : "+"}</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="profile-order-details">
                          <h3>{t.orderItems}</h3>
                          {renderOrderItems(order)}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Wishlist */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span className="profile-section-label">
                {isArabic ? "اختياراتك" : "YOUR COLLECTION"}
              </span>

              <h2>{t.favorites}</h2>

              <p>
                {wishlistItems.length} {t.favoriteCount}
              </p>
            </div>

            <Link className="profile-view-all" to="/wishlist">
              {isArabic ? "عرض الكل" : "View All"}
            </Link>
          </div>

          {!Array.isArray(wishlistItems) || wishlistItems.length === 0 ? (
            <div className="profile-empty">
              <p>{t.emptyWishlist}</p>

              <Link className="profile-primary-button" to="/shop">
                {t.browse}
              </Link>
            </div>
          ) : (
            <div className="profile-products-grid">
              {wishlistItems.map((item) => {
                if (!item) return null;

                return (
                  <article className="profile-product-card" key={item.id}>
                    <Link
                      className="profile-product-image"
                      to={`/product/${item.id}`}
                    >
                      {getProductImage(item) ? (
                        <img
                          src={getProductImage(item)}
                          alt={getProductName(item)}
                        />
                      ) : (
                        <div className="profile-image-placeholder">
                          ANTIQUTCO
                        </div>
                      )}
                    </Link>

                    <div className="profile-product-details">
                      <Link
                        className="profile-product-name"
                        to={`/product/${item.id}`}
                      >
                        {getProductName(item)}
                      </Link>

                      <strong className="profile-product-price">
                        {formatPrice(item.price)}
                      </strong>

                      <div className="profile-product-actions">
                        <Link
                          className="profile-product-view"
                          to={`/product/${item.id}`}
                        >
                          {t.viewProduct}
                        </Link>

                        <button
                          type="button"
                          className="profile-remove-button"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Cart */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <span className="profile-section-label">
                {isArabic ? "مشترياتك" : "YOUR PURCHASES"}
              </span>

              <h2>{t.cart}</h2>

              <p>
                {cartCount} {t.cartCount}
              </p>
            </div>

            <Link className="profile-view-all" to="/cart">
              {isArabic ? "عرض السلة" : "View Cart"}
            </Link>
          </div>

          {!Array.isArray(cartItems) || cartItems.length === 0 ? (
            <div className="profile-empty">
              <p>{t.emptyCart}</p>

              <Link className="profile-primary-button" to="/shop">
                {t.browse}
              </Link>
            </div>
          ) : (
            <>
              <div className="profile-cart-list">
                {cartItems.map((item) => {
                  if (!item) return null;

                  return (
                    <article className="profile-cart-item" key={item.id}>
                      <Link
                        className="profile-cart-image"
                        to={`/product/${item.id}`}
                      >
                        {getProductImage(item) ? (
                          <img
                            src={getProductImage(item)}
                            alt={getProductName(item)}
                          />
                        ) : (
                          <div className="profile-image-placeholder">
                            ANTIQUTCO
                          </div>
                        )}
                      </Link>

                      <div className="profile-cart-details">
                        <Link
                          className="profile-product-name"
                          to={`/product/${item.id}`}
                        >
                          {getProductName(item)}
                        </Link>

                        <strong className="profile-product-price">
                          {formatPrice(item.price)}
                        </strong>

                        <div className="profile-quantity-control">
                          <button
                            type="button"
                            aria-label={t.decrease}
                            onClick={() => handleQuantityChange(item, -1)}
                          >
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            type="button"
                            aria-label={t.increase}
                            disabled={
                              Number(item.quantity || 1) >=
                              Number(item.stock || 0)
                            }
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="profile-cart-end">
                        <strong>
                          {formatPrice(
                            Number(item.price || 0) *
                              Number(item.quantity || 0)
                          )}
                        </strong>

                        <button
                          type="button"
                          className="profile-remove-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="profile-cart-summary">
                <div className="profile-cart-total">
                  <span>{t.subtotal}</span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>

                <Link className="profile-primary-button" to="/checkout">
                  {t.checkout}
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Account Actions */}
        <section className="profile-logout-section">
          <div>
            <h3>{t.leaving}</h3>
            <p>{t.logoutDescription}</p>
          </div>

          <button
            type="button"
            className="profile-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? t.loggingOut : t.logout}
          </button>
        </section>

      </div>
    </main>
  );
}

export default Profile;
