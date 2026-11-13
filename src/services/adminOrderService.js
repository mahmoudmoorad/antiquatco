// Admin Order Service for ANTIKATKO
import api from "./api";

function normalize(o) {
  if (!o) return null;
  return {
    ...o,
    id: o.id,
    order_number: o.order_number || String(o.id),
    // Backend returns UPPERCASE status
    status: o.status || "PENDING",
    // paymentStatus: normalize to UPPERCASE for consistency with paymentStatuses dropdown
    paymentStatus: (o.paymentStatus || o.payment_status || "PENDING").toUpperCase(),
    paymentMethod: o.payment_method || "",
    customer: o.customer || {
      name: o.customer_name || "",
      email: o.customer_email || "",
      phone: o.customer_phone || "",
      city: o.shipping_city || "",
      address: o.shipping_street_address || "",
    },
    items: Array.isArray(o.items) ? o.items : [],
    total: o.total || o.finalTotal || 0,
    finalTotal: o.finalTotal || o.total || 0,
    shippingCost: o.shippingCost || o.shipping_fee || 100,
    subtotal: o.subtotal || 0,
    createdAt: o.createdAt || o.created_at || "",
  };
}

const adminOrderService = {
  async list(params = {}) {
    const response = await api.get("/api/v1/admin/orders/", params);
    const data = response?.data || response;
    const results = Array.isArray(data) ? data : (data?.results || []);
    return results.map(normalize);
  },

  async get(id) {
    const response = await api.get(`/api/v1/admin/orders/${id}/`);
    const data = response?.data || response;
    return normalize(data?.data || data);
  },

  /** Update order status and optionally payment_status */
  async updateStatus(id, payload) {
    const response = await api.patch(`/api/v1/admin/orders/${id}/status/`, payload);
    return response?.data || response;
  },

  async delete(id) {
    return api.delete(`/api/v1/admin/orders/${id}/`);
  },
};

export default adminOrderService;
