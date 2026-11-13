/**
 * Product and Category Data Service for ANTIKATKO.
 */
import api, { formatImageUrl } from "./api";

function normalizeProduct(p) {
  if (!p) return null;
  return {
    ...p,
    id: p.id,
    name: p.name || p.name_en || "",
    nameAr: p.nameAr || p.name_ar || "",
    category: p.category || (p.category_details ? p.category_details.name : "") || "Decor",
    categoryAr: p.categoryAr || (p.category_details ? p.category_details.nameAr : "") || "ديكورات",
    price: Number(p.price || 0),
    originalPrice: p.originalPrice || p.original_price ? Number(p.originalPrice || p.original_price) : null,
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
    image: formatImageUrl(p.image || p.main_image || ""),
    description: p.description || p.description_en || "",
    descriptionAr: p.descriptionAr || p.description_ar || "",
  };
}

function normalizeCategory(c) {
  if (!c) return null;
  return {
    ...c,
    id: c.id,
    value: c.value || c.slug || "",
    slug: c.slug || c.value || "",
    name: c.name || c.name_en || "",
    nameAr: c.nameAr || c.name_ar || "",
    name_en: c.name_en || c.name || "",
    name_ar: c.name_ar || c.nameAr || "",
  };
}

export const productService = {
  /**
   * Fetch active catalog products with optional filters.
   */
  async getProducts(params = {}) {
    const response = await api.get("/api/v1/products/", params);
    const data = response?.data || response;
    const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    return results.map(normalizeProduct);
  },

  /**
   * Fetch single product detail by ID or Slug.
   */
  async getProductById(idOrSlug) {
    const response = await api.get(`/api/v1/products/${idOrSlug}/`);
    const data = response?.data || response;
    return normalizeProduct(data);
  },

  /**
   * Fetch active categories.
   */
  async getCategories() {
    const response = await api.get("/api/v1/categories/");
    const data = response?.data || response;
    const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    return results.map(normalizeCategory);
  },

  /**
   * Admin: fetch all products (including low-stock and unarchived).
   */
  async adminGetProducts(params = {}) {
    const response = await api.get("/api/v1/admin/products/", params);
    const data = response?.data || response;
    const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    return results.map(normalizeProduct);
  },

  /**
   * Admin: create product.
   */
  async adminCreateProduct(productData) {
    const response = await api.post("/api/v1/admin/products/", productData);
    const data = response?.data || response;
    return normalizeProduct(data);
  },

  /**
   * Admin: update product.
   */
  async adminUpdateProduct(id, productData) {
    const response = await api.patch(`/api/v1/admin/products/${id}/`, productData);
    const data = response?.data || response;
    return normalizeProduct(data);
  },

  /**
   * Admin: delete/archive product.
   */
  async adminDeleteProduct(id) {
    return api.delete(`/api/v1/admin/products/${id}/`);
  },

  /**
   * Admin: create category.
   */
  async adminCreateCategory(categoryData) {
    const response = await api.post("/api/v1/admin/categories/", categoryData);
    const data = response?.data || response;
    return normalizeCategory(data);
  },

  /**
   * Admin: update category.
   */
  async adminUpdateCategory(id, categoryData) {
    const response = await api.patch(`/api/v1/admin/categories/${id}/`, categoryData);
    const data = response?.data || response;
    return normalizeCategory(data);
  },

  /**
   * Admin: delete category.
   */
  async adminDeleteCategory(id) {
    return api.delete(`/api/v1/admin/categories/${id}/`);
  },
};

export default productService;
