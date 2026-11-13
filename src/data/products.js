
import productService from "../services/productService";

const STORAGE_KEY = "antikatko-products";
const CATEGORIES_STORAGE_KEY = "antikatko-categories";

export const defaultCategories = [
  { id: 1, value: "decor", name: "Decor", nameAr: "ديكورات" },
  { id: 2, value: "collectibles", name: "Collectibles", nameAr: "مقتنيات" },
  { id: 3, value: "lighting", name: "Lighting", nameAr: "إضاءة" },
  { id: 4, value: "antiques", name: "Antiques", nameAr: "تحف أثرية" },
];

export const defaultProducts = [
  {
    id: 1,
    name: "Vintage Ceramic Vase",
    nameAr: "مزهرية سيراميك كلاسيكية",
    category: "Decor",
    categoryAr: "ديكورات",
    price: 1200,
    originalPrice: 1500,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600",
    stock: 5,
  },
  {
    id: 2,
    name: "Antique Table Clock",
    nameAr: "ساعة طاولة أثرية",
    category: "Collectibles",
    categoryAr: "مقتنيات",
    price: 2500,
    originalPrice: 3000,
    image: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600",
    stock: 3,
  },
  {
    id: 3,
    name: "Classic Decorative Lamp",
    nameAr: "مصباح ديكوري كلاسيكي",
    category: "Lighting",
    categoryAr: "إضاءة",
    price: 1800,
    originalPrice: 2200,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
    stock: 8,
  },
  {
    id: 4,
    name: "Vintage Decorative Piece",
    nameAr: "قطعة ديكور كلاسيكية",
    category: "Antiques",
    categoryAr: "تحف أثرية",
    price: 3200,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600",
    stock: 4,
  },
];

let memoryProducts = null;
let memoryCategories = null;

function readStorage(key) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return null;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

export function getProducts() {
  if (memoryProducts !== null) return memoryProducts;

  const saved = readStorage(STORAGE_KEY);

  if (saved !== null) {
    memoryProducts = saved;
    return memoryProducts;
  }

  return defaultProducts;
}

export function saveProducts(newProducts) {
  if (!Array.isArray(newProducts)) return;

  memoryProducts = newProducts;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
  } catch (error) {
    console.warn("Could not save products:", error);
  }

  window.dispatchEvent(new Event("productsUpdated"));
}

export function getCategories() {
  if (memoryCategories !== null) return memoryCategories;

  const saved = readStorage(CATEGORIES_STORAGE_KEY);

  if (saved !== null) {
    memoryCategories = saved;
    return memoryCategories;
  }

  return defaultCategories;
}

export function saveCategories(newCategories) {
  if (!Array.isArray(newCategories)) return;

  memoryCategories = newCategories;

  try {
    localStorage.setItem(
      CATEGORIES_STORAGE_KEY,
      JSON.stringify(newCategories)
    );
  } catch (error) {
    console.warn("Could not save categories:", error);
  }

  window.dispatchEvent(new Event("categoriesUpdated"));
}

/**
 * Django is the authoritative source for products.
 */
export async function refreshProductsFromBackend() {
  try {
    const liveProducts = await productService.getProducts();

    if (!Array.isArray(liveProducts)) {
      throw new Error("Invalid products response from backend");
    }

    // Save even when the backend returns an empty list.
    saveProducts(liveProducts);

    return liveProducts;
  } catch (error) {
    console.error("Products sync failed:", error);
    return getProducts();
  }
}

/**
 * Django is the authoritative source for categories.
 */
export async function refreshCategoriesFromBackend() {
  try {
    const liveCategories = await productService.getCategories();

    if (!Array.isArray(liveCategories)) {
      throw new Error("Invalid categories response from backend");
    }

    saveCategories(liveCategories);

    return liveCategories;
  } catch (error) {
    console.error("Categories sync failed:", error);
    return getCategories();
  }
}

// Initial synchronization with Django.
if (typeof window !== "undefined") {
  refreshProductsFromBackend();
  refreshCategoriesFromBackend();
}

export {
  STORAGE_KEY,
  CATEGORIES_STORAGE_KEY,
};

export default getProducts();
