
/**
 * Orders and Checkout Service for ANTIKATKO.
 * Handles customer orders, guest checkout, cancellation,
 * and admin order management.
 */

import api, { setGuestToken, getGuestToken } from "./api";

/**
 * Extract data from the standard API response wrapper.
 */
function unwrapResponse(response) {
  return response?.data ?? response;
}

/**
 * Extract list results from paginated or non-paginated responses.
 */
function extractResults(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function normalizeOrder(order) {
  if (!order) return null;

  const rawPaymentStatus = String(
    order.payment_status || order.paymentStatus || ""
  ).toUpperCase();

  let paymentStatus = "Pending";

  if (rawPaymentStatus === "UNPAID") paymentStatus = "Unpaid";
  else if (rawPaymentStatus === "PAID") paymentStatus = "Paid";
  else if (rawPaymentStatus === "FAILED") paymentStatus = "Failed";

  const rawOrderStatus = String(order.status || "").toUpperCase();

  let status = "Pending";

  if (rawOrderStatus === "CONFIRMED") status = "Confirmed";
  else if (rawOrderStatus === "PROCESSING") status = "Processing";
  else if (rawOrderStatus === "SHIPPED") status = "Shipped";
  else if (rawOrderStatus === "DELIVERED") status = "Delivered";
  else if (rawOrderStatus === "CANCELLED") status = "Cancelled";

  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        id: item.id || item.product_id_snapshot,
        name: item.name || item.product_name_en || "",
        nameAr: item.nameAr || item.product_name_ar || "",
        price: Number(item.price || item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        lineSubtotal: Number(item.line_subtotal || 0),
      }))
    : [];

  const subtotal = Number(order.subtotal || 0);

  const shippingCost = Number(
    order.shipping_fee ?? order.shippingCost ?? 100
  );

  const total = Number(
    order.total ?? order.finalTotal ?? subtotal + shippingCost
  );

  return {
    ...order,

    id: order.order_number || order.id,
    orderId: order.order_number || order.id,
    order_number: order.order_number,
    pk: order.id,

    createdAt: order.created_at || order.createdAt,

    customer: order.customer || {
      name: order.customer_name || "",
      email: order.customer_email || "",
      phone: order.customer_phone || "",
      city: order.shipping_city || "",
      address: order.shipping_street_address || "",
      notes: order.shipping_notes || "",
    },

    items,
    subtotal,
    shippingCost,
    total,
    finalTotal: total,

    paymentMethod: order.payment_method,
    paymentStatus,
    status,

    guestAccessToken: order.guest_access_token,
  };
}

export const orderService = {
  /**
   * Submit an order for an authenticated customer or guest.
   */
  async checkout(checkoutPayload) {
    const response = await api.post(
      "/api/v1/orders/checkout/",
      checkoutPayload
    );

    const data = unwrapResponse(response);
    const normalized = normalizeOrder(data);

    if (normalized?.guestAccessToken) {
      setGuestToken(normalized.guestAccessToken);
    }

    return normalized;
  },

  /**
   * Retrieve order details.
   */
  async getOrderDetails(orderNumber, token) {
    const guestToken = token || getGuestToken();

    const response = await api.get(
      `/api/v1/orders/${orderNumber}/`,
      {},
      { guestToken }
    );

    return normalizeOrder(unwrapResponse(response));
  },

  /**
   * Customer: list own past orders.
   */
  async getMyOrders(params = {}) {
    const response = await api.get(
      "/api/v1/orders/my-orders/",
      params
    );

    return extractResults(response).map(normalizeOrder);
  },

  /**
   * Cancel order and restore stock.
   */
  async cancelOrder(
    orderNumber,
    reason = "Cancelled by user",
    token
  ) {
    const guestToken = token || getGuestToken();

    const response = await api.post(
      `/api/v1/orders/${orderNumber}/cancel/`,
      { reason },
      { guestToken }
    );

    return normalizeOrder(unwrapResponse(response));
  },

  /**
   * Admin: list all sales orders.
   */
  async adminGetOrders(params = {}) {
    const response = await api.get(
      "/api/v1/admin/orders/",
      params
    );

    return extractResults(response).map(normalizeOrder);
  },

  /**
   * Admin: retrieve single order.
   */
  async adminGetOrder(id) {
    const response = await api.get(
      `/api/v1/admin/orders/${id}/`
    );

    return normalizeOrder(unwrapResponse(response));
  },

  /**
   * Admin: update order status.
   */
  async adminUpdateOrderStatus(
    id,
    status,
    admin_notes = "",
    payment_status = ""
  ) {
    const payload = {
      status: status.toUpperCase(),
      ...(admin_notes ? { admin_notes } : {}),
      ...(payment_status
        ? { payment_status: payment_status.toUpperCase() }
        : {}),
    };

    const response = await api.patch(
      `/api/v1/admin/orders/${id}/status/`,
      payload
    );

    return normalizeOrder(unwrapResponse(response));
  },

  /**
   * Admin: update payment status.
   */
  async adminUpdatePaymentStatus(
    paymentIdOrOrderPk,
    paymentStatus,
    admin_notes = ""
  ) {
    const payload = {
      status: paymentStatus.toUpperCase(),
      ...(admin_notes ? { admin_notes } : {}),
    };

    const response = await api.patch(
      `/api/v1/admin/payments/${paymentIdOrOrderPk}/`,
      payload
    );

    return unwrapResponse(response);
  },

  /**
   * Admin: delete order.
   */
  async adminDeleteOrder(id) {
    return api.delete(`/api/v1/admin/orders/${id}/`);
  },
};

export default orderService;
