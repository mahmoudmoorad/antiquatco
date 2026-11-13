// Admin Category Service for ANTIKATKO
import api from "./api";

function normalize(c) {
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

const adminCategoryService = {
  async list(params = {}) {
    const response = await api.get("/api/v1/admin/categories/", params);
    const data = response?.data || response;
    const results = Array.isArray(data) ? data : (data?.results || []);
    return results.map(normalize);
  },

  async create(category) {
    const response = await api.post("/api/v1/admin/categories/", category);
    const data = response?.data || response;
    return normalize(data);
  },

  async update(id, category) {
    const response = await api.patch(`/api/v1/admin/categories/${id}/`, category);
    const data = response?.data || response;
    return normalize(data);
  },

  async delete(id) {
    return api.delete(`/api/v1/admin/categories/${id}/`);
  },
};

export default adminCategoryService;
