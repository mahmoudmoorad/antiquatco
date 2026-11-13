// Admin Product Service for ANTIKATKO
// Provides CRUD operations for products via backend admin API.
// Image uploads use multipart/form-data to send actual File objects.

import api from "./api";

/**
 * Build a FormData payload from a product object.
 * If product.image is a File, it is sent as main_image.
 * If it is a string URL/path, skip it on update (backend keeps existing).
 */
function buildFormData(product) {
  const form = new FormData();

  if (product.category !== undefined) form.append("category", product.category);
  if (product.name) form.append("name", product.name);
  if (product.nameAr) form.append("nameAr", product.nameAr);
  if (product.description !== undefined) form.append("description", product.description || "");
  if (product.descriptionAr !== undefined) form.append("descriptionAr", product.descriptionAr || "");
  if (product.price !== undefined) form.append("price", product.price);
  if (product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== "")
    form.append("originalPrice", product.originalPrice);
  if (product.stock !== undefined) form.append("stock", product.stock);

  // Image: only send File objects; skip string URLs (backend keeps existing image)
  if (product.image instanceof File) {
    form.append("main_image", product.image);
  }

  if (product.is_active !== undefined) form.append("is_active", product.is_active);
  if (product.is_featured !== undefined) form.append("is_featured", product.is_featured);
  if (product.is_archived !== undefined) form.append("is_archived", product.is_archived);

  return form;
}

/**
 * Normalize a backend product response to match what AdminApp.jsx expects.
 */
function normalize(p) {
  if (!p) return null;
  return {
    ...p,
    id: p.id,
    name: p.name || p.name_en || "",
    nameAr: p.nameAr || p.name_ar || "",
    category: p.category || (p.category_details ? p.category_details.name : "") || "",
    categoryAr: p.categoryAr || (p.category_details ? p.category_details.nameAr : "") || "",
    price: Number(p.price || 0),
    originalPrice: p.originalPrice || p.original_price ? Number(p.originalPrice || p.original_price) : null,
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
    image: p.image || p.main_image || "",
    description: p.description || p.description_en || "",
    descriptionAr: p.descriptionAr || p.description_ar || "",
  };
}

const adminProductService = {
  /** List all products (admin view, includes archived/inactive) */
  async list(params = {}) {
    const response = await api.get("/api/v1/admin/products/", params);
    const data = response?.data || response;
    const results = Array.isArray(data) ? data : (data?.results || []);
    return results.map(normalize);
  },

  /** Create a new product with optional image upload */
  async create(product) {
    const form = buildFormData(product);
    const response = await api.post("/api/v1/admin/products/", form);
    const data = response?.data || response;
    return normalize(data);
  },

  /** Update an existing product */
  async update(id, product) {
    const form = buildFormData(product);
    const response = await api.patch(`/api/v1/admin/products/${id}/`, form);
    const data = response?.data || response;
    return normalize(data);
  },

  /** Delete (or archive) a product */
  async delete(id) {
    return api.delete(`/api/v1/admin/products/${id}/`);
  },

  /** Upload an additional gallery image */
  async uploadGallery(productId, file) {
    const form = new FormData();
    form.append("image", file);
    const response = await api.post(`/api/v1/admin/products/${productId}/images/`, form);
    return response?.data || response;
  },

  /** Delete a gallery image */
  async deleteGallery(imageId) {
    return api.delete(`/api/v1/admin/products/images/${imageId}/`);
  },
};

export default adminProductService;
