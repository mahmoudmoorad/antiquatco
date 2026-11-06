import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProducts,
  saveProducts,
  getCategories,
  saveCategories,
} from "../data/products";
import "./admin.css";

const ORDERS_KEY = "antikatko-orders";

const initialForm = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  category: "Decor",
  categoryAr: "ديكورات",
  price: "",
  originalPrice: "",
  image: "",
};

const orderStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const statusLabels = {
  Pending: "قيد الانتظار",
  Processing: "جاري التجهيز",
  Shipped: "تم الشحن",
  Delivered: "تم التسليم",
  Cancelled: "ملغي",
};

// Reusable SVG icons
function Icon({ name, size = 18 }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="11" width="7" height="10" rx="1" />
        <rect x="3" y="14" width="8" height="7" rx="1" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    orders: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18M16 14h2" />
        <path d="M3 5l3-2h12" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function getOrders() {
  try {
    const savedOrders = JSON.parse(
      localStorage.getItem(ORDERS_KEY) || "[]"
    );

    return Array.isArray(savedOrders) ? savedOrders : [];
  } catch (error) {
    console.error("Error loading orders:", error);
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("ordersUpdated"));
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("ar-EG");
}

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString("en-US")} EGP`;
}

function getCustomerKey(customer) {
  const email = (customer.email || "").trim().toLowerCase();
  const phone = (customer.phone || "").trim();

  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;

  const name = (customer.name || "").trim().toLowerCase();
  const city = (customer.city || "").trim().toLowerCase();

  if (!name && !city) return null;

  return `name:${name}|city:${city}`;
}

function AdminApp() {
  const [products, setProducts] = useState(getProducts);
  const [orders, setOrders] = useState(getOrders);
  const [categories, setCategories] = useState(getCategories);

  const [search, setSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const [form, setForm] = useState(initialForm);

  // Category management states
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameAr, setNewCatNameAr] = useState("");
  const [editingCatValue, setEditingCatValue] = useState(null);
  const [editCatForm, setEditCatForm] = useState({ name: "", nameAr: "" });

  useEffect(() => {
    document.title = "ANTIKATKO | Admin Dashboard";

    const updateProducts = () => {
      setProducts(getProducts());
    };

    const updateOrders = () => {
      setOrders(getOrders());
    };

    const updateCategories = () => {
      setCategories(getCategories());
    };

    const handleStorageChange = (event) => {
      if (event.key === "antikatko-products") {
        updateProducts();
      }
      if (event.key === ORDERS_KEY) {
        updateOrders();
      }
      if (event.key === "antikatko-categories") {
        updateCategories();
      }
    };

    window.addEventListener("productsUpdated", updateProducts);
    window.addEventListener("ordersUpdated", updateOrders);
    window.addEventListener("categoriesUpdated", updateCategories);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("productsUpdated", updateProducts);
      window.removeEventListener("ordersUpdated", updateOrders);
      window.removeEventListener("categoriesUpdated", updateCategories);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      `${product.name || ""} ${product.nameAr || ""} ${product.category || ""} ${product.categoryAr || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customer = order.customer || {};

      const searchText = [
        order.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.city,
        order.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(orderSearch.toLowerCase());
    });
  }, [orders, orderSearch]);

  const customers = useMemo(() => {
    const customerMap = new Map();

    orders.forEach((order) => {
      const customer = order.customer || {};
      const key = getCustomerKey(customer);

      if (!key) return;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          key,
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          city: customer.city || "",
          address: customer.address || "",
          ordersCount: 0,
          totalSpent: 0,
          orders: [],
          lastOrder: order.createdAt || null,
        });
      }

      const existing = customerMap.get(key);

      existing.ordersCount += 1;
      existing.orders.push(order);

      if (order.status !== "Cancelled") {
        existing.totalSpent += Number(order.total || 0);
      }

      if (
        order.createdAt &&
        (!existing.lastOrder ||
          new Date(order.createdAt) > new Date(existing.lastOrder))
      ) {
        existing.lastOrder = order.createdAt;
      }

      ["name", "email", "phone", "city", "address"].forEach((field) => {
        if (!existing[field] && customer[field]) {
          existing[field] = customer[field];
        }
      });
    });

    return Array.from(customerMap.values()).sort(
      (a, b) =>
        new Date(b.lastOrder || 0) - new Date(a.lastOrder || 0)
    );
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
        customer.city,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, customerSearch]);

  const categoryProductCounts = useMemo(() => {
    const counts = {};
    categories.forEach((cat) => {
      counts[cat.value] = 0;
    });
    products.forEach((product) => {
      if (product.category && counts[product.category] !== undefined) {
        counts[product.category] += 1;
      }
    });
    return counts;
  }, [categories, products]);

  const updateField = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "category") {
        const foundCat = categories.find((c) => c.value === value);
        if (foundCat) {
          updated.categoryAr = foundCat.nameAr;
        }
      }
      return updated;
    });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    const defaultCat = categories[0] || { value: "Decor", nameAr: "ديكورات" };
    setForm({
      ...initialForm,
      category: defaultCat.value,
      categoryAr: defaultCat.nameAr,
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      nameAr: product.nameAr || "",
      description: product.description || "",
      descriptionAr: product.descriptionAr || "",
      category: product.category || categories[0]?.value || "Decor",
      categoryAr: product.categoryAr || categories[0]?.nameAr || "",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      image: product.image || "",
    });

    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    const price = Number(form.price);
    const originalPrice =
      form.originalPrice && String(form.originalPrice).trim()
        ? Number(form.originalPrice)
        : null;

    if (!Number.isFinite(price) || price < 0) {
      window.alert("من فضلك أدخل سعرًا صحيحًا.");
      return;
    }

    if (
      originalPrice !== null &&
      (!Number.isFinite(originalPrice) || originalPrice < price)
    ) {
      window.alert(
        "السعر قبل الخصم يجب أن يكون أكبر من أو يساوي السعر الحالي."
      );
      return;
    }

    const selectedCat = categories.find((c) => c.value === form.category);

    const productData = {
      ...form,
      categoryAr: selectedCat ? selectedCat.nameAr : form.categoryAr,
      id:
        editingId !== null
          ? editingId
          : Math.max(0, ...products.map((p) => Number(p.id) || 0)) + 1,
      price,
      originalPrice,
    };

    let updatedProducts;

    if (editingId !== null) {
      updatedProducts = products.map((product) =>
        String(product.id) === String(editingId)
          ? productData
          : product
      );
    } else {
      updatedProducts = [productData, ...products];
    }

    saveProducts(updatedProducts);
    setProducts(updatedProducts);
    closeModal();
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا المنتج؟"
    );

    if (!confirmed) return;

    const updatedProducts = products.filter(
      (product) => String(product.id) !== String(id)
    );

    saveProducts(updatedProducts);
    setProducts(updatedProducts);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      String(order.id) === String(orderId)
        ? { ...order, status: newStatus }
        : order
    );

    saveOrders(updatedOrders);
    setOrders(updatedOrders);
  };

  const deleteOrder = (orderId) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الطلب؟"
    );

    if (!confirmed) return;

    const updatedOrders = orders.filter(
      (order) => String(order.id) !== String(orderId)
    );

    saveOrders(updatedOrders);
    setOrders(updatedOrders);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    const nameAr = newCatNameAr.trim();

    if (!name || !nameAr) {
      window.alert("من فضلك أدخل اسم التصنيف بالإنجليزية والعربية.");
      return;
    }

    const value = name
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    if (!value) {
      window.alert("اسم التصنيف بالإنجليزية يجب أن يحتوي على حروف صالحة.");
      return;
    }

    if (categories.some((c) => c.value.toLowerCase() === value)) {
      window.alert("هذا التصنيف موجود بالفعل.");
      return;
    }

    const updated = [...categories, { value, name, nameAr }];
    saveCategories(updated);
    setCategories(updated);
    setNewCatName("");
    setNewCatNameAr("");
  };

  const startEditCategory = (cat) => {
    setEditingCatValue(cat.value);
    setEditCatForm({ name: cat.name, nameAr: cat.nameAr });
  };

  const handleSaveCategoryEdit = (catValue) => {
    const name = editCatForm.name.trim();
    const nameAr = editCatForm.nameAr.trim();

    if (!name || !nameAr) {
      window.alert("من فضلك أدخل أسماء صحيحة للتصنيف.");
      return;
    }

    const updated = categories.map((c) =>
      c.value === catValue ? { ...c, name, nameAr } : c
    );

    saveCategories(updated);
    setCategories(updated);
    setEditingCatValue(null);
  };

  const handleDeleteCategory = (catValue) => {
    const count = categoryProductCounts[catValue] || 0;
    if (count > 0) {
      window.alert(
        `لا يمكن حذف هذا التصنيف لأنه مرتبط بـ ${count} منتج. قم بنقل المنتجات لتصنيف آخر أولاً.`
      );
      return;
    }

    const confirmed = window.confirm("هل أنت متأكد من حذف هذا التصنيف؟");
    if (!confirmed) return;

    const updated = categories.filter((c) => c.value !== catValue);
    saveCategories(updated);
    setCategories(updated);
  };

  const totalValue = products.reduce(
    (total, product) => total + Number(product.price || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const totalOrdersValue = orders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  );

  const totalCustomers = customers.length;

  const totalCustomerRevenue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0
  );

  return (
    <div className="admin-dashboard" dir="rtl">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>ANTIKATKO</h2>
          <span>ADMIN PANEL</span>
        </div>

        <div className="admin-nav-label">القائمة الرئيسية</div>

        <a href="#dashboard" className="admin-nav-item active">
          <Icon name="dashboard" />
          لوحة التحكم
        </a>

        <a href="#products" className="admin-nav-item">
          <Icon name="package" />
          المنتجات
        </a>

        <a href="#categories" className="admin-nav-item">
          <Icon name="grid" />
          التصنيفات
        </a>

        <a href="#orders" className="admin-nav-item">
          <Icon name="orders" />
          الطلبات
        </a>

        <a href="#customers" className="admin-nav-item">
          <Icon name="users" />
          العملاء
        </a>

        <Link to="/" className="admin-nav-item">
          <Icon name="external" />
          العودة للمتجر
        </Link>

        <div className="admin-sidebar-footer">
          <span className="admin-status-dot"></span>
          Local Admin Mode
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header" id="dashboard">
          <div>
            <span className="admin-eyebrow">STORE MANAGEMENT</span>
            <h1>لوحة التحكم</h1>
            <p>مرحبًا بك في إدارة متجر ANTIKATKO</p>
          </div>

          <button
            className="admin-add-button"
            onClick={openAddModal}
          >
            <Icon name="plus" />
            إضافة منتج
          </button>
        </header>

        {/* Dashboard Stats */}
        <section className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name="package" size={22} />
            </span>
            <p>إجمالي المنتجات</p>
            <h2>{products.length}</h2>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name="wallet" size={22} />
            </span>
            <p>قيمة المنتجات</p>
            <h2>{formatPrice(totalValue)}</h2>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name="grid" size={22} />
            </span>
            <p>التصنيفات</p>
            <h2>{categories.length}</h2>
          </div>

          {/* كارد إجمالي مشتريات العملاء الجديد */}
          <div className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name="wallet" size={22} />
            </span>
            <p>إجمالي مشتريات العملاء</p>
            <h2>{formatPrice(totalCustomerRevenue)}</h2>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name="orders" size={22} />
            </span>
            <p>إجمالي الطلبات</p>
            <h2>{orders.length}</h2>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-icon">
              <Icon name="clock" size={22} />
            </span>
            <p>طلبات قيد الانتظار</p>
            <h2>{pendingOrders}</h2>
          </div>
        </section>

        {/* Products */}
        <section className="admin-products-section" id="products">
          <div className="admin-section-header">
            <div>
              <h2>إدارة المنتجات</h2>
              <p>إضافة وتعديل وحذف منتجات المتجر</p>
            </div>

            <input
              type="search"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search"
            />
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>التصنيف</th>
                  <th>السعر</th>
                  <th>السعر القديم</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-info">
                        <img
                          src={product.image}
                          alt={product.name}
                        />

                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.nameAr}</small>
                        </div>
                      </div>
                    </td>

                    <td>{product.categoryAr || product.category}</td>

                    <td>{formatPrice(product.price)}</td>

                    <td>
                      {product.originalPrice
                        ? formatPrice(product.originalPrice)
                        : "—"}
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => openEditModal(product)}
                          className="admin-edit-button"
                          aria-label="تعديل المنتج"
                          title="تعديل"
                        >
                          <Icon name="edit" />
                          تعديل
                        </button>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="admin-delete-button"
                          aria-label="حذف المنتج"
                          title="حذف"
                        >
                          <Icon name="trash" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="admin-empty">
                      لا توجد منتجات مطابقة للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Categories Management Section */}
        <section
          className="admin-products-section"
          id="categories"
          style={{ marginTop: "35px" }}
        >
          <div className="admin-section-header">
            <div>
              <h2>إدارة التصنيفات</h2>
              <p>إضافة وتعديل التصنيفات الديناميكية للمتجر</p>
            </div>
          </div>

          {/* Add Category Form */}
          <form
            onSubmit={handleAddCategory}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: "15px",
              marginBottom: "20px",
              background: "#faf7f1",
              padding: "20px",
              borderRadius: "8px",
              alignItems: "flex-end",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              اسم التصنيف (بالإنجليزية)
              <input
                type="text"
                placeholder="e.g. Decor"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d8cbb7" }}
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              اسم التصنيف (بالعربية)
              <input
                type="text"
                placeholder="مثال: ديكورات"
                value={newCatNameAr}
                onChange={(e) => setNewCatNameAr(e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d8cbb7" }}
                required
              />
            </label>

            <button
              type="submit"
              className="admin-add-button"
              style={{ height: "42px" }}
            >
              <Icon name="plus" />
              إضافة تصنيف
            </button>
          </form>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>القيمة (Value)</th>
                  <th>الاسم (EN)</th>
                  <th>الاسم (AR)</th>
                  <th>عدد المنتجات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const isEditing = editingCatValue === cat.value;
                  const count = categoryProductCounts[cat.value] || 0;

                  return (
                    <tr key={cat.value}>
                      <td>
                        <code>{cat.value}</code>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCatForm.name}
                            onChange={(e) =>
                              setEditCatForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                          />
                        ) : (
                          <strong>{cat.name}</strong>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCatForm.nameAr}
                            onChange={(e) =>
                              setEditCatForm((prev) => ({
                                ...prev,
                                nameAr: e.target.value,
                              }))
                            }
                            style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                          />
                        ) : (
                          <span>{cat.nameAr}</span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: "#e8f0fe", color: "#1967d2" }}>
                          {count} منتج
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {isEditing ? (
                            <>
                              <button
                                className="admin-save-button"
                                onClick={() => handleSaveCategoryEdit(cat.value)}
                                style={{ padding: "6px 12px" }}
                              >
                                حفظ
                              </button>
                              <button
                                className="admin-cancel-button"
                                onClick={() => setEditingCatValue(null)}
                                style={{ padding: "6px 12px" }}
                              >
                                إلغاء
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="admin-edit-button"
                                onClick={() => startEditCategory(cat)}
                              >
                                <Icon name="edit" />
                                تعديل
                              </button>
                              <button
                                className="admin-delete-button"
                                onClick={() => handleDeleteCategory(cat.value)}
                                title={count > 0 ? "لا يمكن الحذف لوجود منتجات مرتبطة" : "حذف"}
                              >
                                <Icon name="trash" />
                                حذف
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Orders */}
        <section
          className="admin-products-section"
          id="orders"
          style={{ marginTop: "35px" }}
        >
          <div className="admin-section-header">
            <div>
              <h2>إدارة الطلبات</h2>
              <p>متابعة طلبات العملاء وتحديث حالة كل طلب</p>
            </div>

            <input
              type="search"
              placeholder="ابحث برقم الطلب أو اسم العميل..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="admin-search"
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <strong>إجمالي قيمة الطلبات: </strong>
            <span>{formatPrice(totalOrdersValue)}</span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>التاريخ</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const customer = order.customer || {};
                  const isExpanded =
                    String(expandedOrder) === String(order.id);

                  return (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td>
                          <strong>{order.id}</strong>
                        </td>

                        <td>
                          <div>
                            <strong>{customer.name || "—"}</strong>
                            <small style={{ display: "block" }}>
                              {customer.email || ""}
                            </small>
                          </div>
                        </td>

                        <td>{customer.phone || "—"}</td>

                        <td>{formatDate(order.createdAt)}</td>

                        <td>
                          <strong>{formatPrice(order.total)}</strong>
                        </td>

                        <td>
                          <select
                            value={
                              orderStatuses.includes(order.status)
                                ? order.status
                                : "Pending"
                            }
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value)
                            }
                            aria-label="حالة الطلب"
                            style={{
                              padding: "8px",
                              borderRadius: "6px",
                              border: "1px solid #d8cbb7",
                              background: "#fff",
                              color: "#493728",
                              maxWidth: "145px",
                            }}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-edit-button"
                              onClick={() =>
                                setExpandedOrder(
                                  isExpanded ? null : order.id
                                )
                              }
                            >
                              <Icon name="eye" />
                              {isExpanded ? "إخفاء" : "التفاصيل"}
                            </button>

                            <button
                              className="admin-delete-button"
                              onClick={() => deleteOrder(order.id)}
                            >
                              <Icon name="trash" />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="7">
                            <div
                              style={{
                                padding: "15px",
                                background: "#faf7f1",
                                borderRadius: "8px",
                                lineHeight: "2",
                              }}
                            >
                              <h3>تفاصيل الطلب</h3>

                              <p>
                                <strong>العنوان: </strong>
                                {customer.address || "—"}
                              </p>

                              <p>
                                <strong>المدينة: </strong>
                                {customer.city || "—"}
                              </p>

                              <p>
                                <strong>ملاحظات: </strong>
                                {customer.notes || "لا توجد ملاحظات"}
                              </p>

                              <h4>المنتجات:</h4>

                              {Array.isArray(order.items) &&
                              order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                  <div key={`${item.id}-${index}`}>
                                    {item.nameAr || item.name || "منتج"} ×{" "}
                                    {item.quantity || 1}
                                    {" — "}
                                    {formatPrice(
                                      Number(item.price || 0) *
                                        Number(item.quantity || 1)
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p>لا توجد تفاصيل للمنتجات.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="admin-empty">
                      {orders.length === 0
                        ? "لا توجد طلبات حتى الآن."
                        : "لا توجد طلبات مطابقة للبحث."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Customers */}
        <section
          className="admin-products-section"
          id="customers"
          style={{ marginTop: "35px" }}
        >
          <div className="admin-section-header">
            <div>
              <h2>إدارة العملاء</h2>
              <p>عرض العملاء وملخص مشترياتهم من المتجر</p>
            </div>

            <input
              type="search"
              placeholder="ابحث بالاسم أو البريد أو الهاتف..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="admin-search"
            />
          </div>

          <div className="admin-customer-summary">
            <div>
              <span className="admin-stat-icon">
                <Icon name="users" size={22} />
              </span>
              <div>
                <p>إجمالي العملاء</p>
                <h3>{totalCustomers}</h3>
              </div>
            </div>

            <div>
              <span className="admin-stat-icon">
                <Icon name="wallet" size={22} />
              </span>
              <div>
                <p>إجمالي مشتريات العملاء</p>
                <h3>{formatPrice(totalCustomerRevenue)}</h3>
              </div>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>البريد الإلكتروني</th>
                  <th>الهاتف</th>
                  <th>المدينة</th>
                  <th>عدد الطلبات</th>
                  <th>إجمالي المشتريات</th>
                  <th>آخر طلب</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => {
                  const isExpanded =
                    expandedCustomer === customer.key;

                  return (
                    <React.Fragment key={customer.key}>
                      <tr>
                        <td>
                          <strong>{customer.name || "عميل بدون اسم"}</strong>
                        </td>

                        <td>{customer.email || "—"}</td>
                        <td>{customer.phone || "—"}</td>
                        <td>{customer.city || "—"}</td>
                        <td>{customer.ordersCount}</td>

                        <td>
                          <strong>
                            {formatPrice(customer.totalSpent)}
                          </strong>
                        </td>

                        <td>{formatDate(customer.lastOrder)}</td>

                        <td>
                          <button
                            className="admin-edit-button"
                            onClick={() =>
                              setExpandedCustomer(
                                isExpanded ? null : customer.key
                              )
                            }
                          >
                            <Icon name="eye" />
                            {isExpanded ? "إخفاء" : "الطلبات"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="8">
                            <div className="admin-customer-details">
                              <h3>طلبات العميل</h3>

                              <p>
                                <strong>العنوان: </strong>
                                {customer.address || "—"}
                              </p>

                              <div className="admin-customer-order-list">
                                {customer.orders.map((order) => (
                                  <div
                                    className="admin-customer-order"
                                    key={order.id}
                                  >
                                    <div>
                                      <strong>{order.id}</strong>
                                      <small>
                                        {formatDate(order.createdAt)}
                                      </small>
                                    </div>

                                    <div>
                                      <strong>
                                        {formatPrice(order.total)}
                                      </strong>
                                      <small>
                                        {statusLabels[order.status] ||
                                          order.status ||
                                          "قيد الانتظار"}
                                      </small>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="8" className="admin-empty">
                      {customers.length === 0
                        ? "لا يوجد عملاء حتى الآن. سيظهر العملاء تلقائيًا بعد تسجيل الطلبات."
                        : "لا توجد نتائج مطابقة للبحث."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Product Modal */}
        {showModal && (
          <div
            className="admin-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <form className="admin-modal" onSubmit={handleSave}>
              <div className="admin-modal-header">
                <h2>
                  {editingId !== null
                    ? "تعديل المنتج"
                    : "إضافة منتج جديد"}
                </h2>

                <button type="button" onClick={closeModal}>
                  <Icon name="close" />
                </button>
              </div>

              <div className="admin-form-grid">
                <label>
                  اسم المنتج بالإنجليزية
                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  اسم المنتج بالعربية
                  <input
                    value={form.nameAr}
                    onChange={(e) =>
                      updateField("nameAr", e.target.value)
                    }
                    required
                  />
                </label>

                <label className="admin-full-width">
                  وصف المنتج بالإنجليزية
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    placeholder="Enter product description..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #e5dccf",
                      fontFamily: "inherit",
                    }}
                  />
                </label>

                <label className="admin-full-width">
                  وصف المنتج بالعربية
                  <textarea
                    rows="2"
                    value={form.descriptionAr}
                    onChange={(e) =>
                      updateField("descriptionAr", e.target.value)
                    }
                    placeholder="اكتب وصف المنتج بالعربية..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #e5dccf",
                      fontFamily: "inherit",
                    }}
                  />
                </label>

                <label>
                  التصنيف
                  <select
                    value={form.category}
                    onChange={(e) =>
                      updateField("category", e.target.value)
                    }
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.nameAr} ({cat.name})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  التصنيف بالعربية (تلقائي)
                  <input
                    value={form.categoryAr}
                    readOnly
                    style={{ background: "#f5f2eb", cursor: "not-allowed" }}
                  />
                </label>

                <label>
                  السعر الحالي
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      updateField("price", e.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  السعر قبل الخصم
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(e) =>
                      updateField("originalPrice", e.target.value)
                    }
                  />
                </label>

                <label className="admin-full-width">
                  رفع صورة المنتج (من جهازك)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ padding: "8px", border: "1px solid #e5dccf", borderRadius: "6px", background: "#fff" }}
                  />
                </label>

                {form.image && form.image.trim() && (
                  <div className="admin-full-width">
                    <p>معاينة الصورة:</p>
                    <img
                      src={form.image}
                      alt="معاينة المنتج"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={closeModal}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="admin-save-button"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminApp;