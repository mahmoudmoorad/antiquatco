
const STORAGE_KEY = "antikatko-products";
const CATEGORIES_STORAGE_KEY = "antikatko-categories";

const defaultCategories = [
  {
    value: "Decor",
    name: "Decor",
    nameAr: "ديكورات",
  },
  {
    value: "Collectibles",
    name: "Collectibles",
    nameAr: "مقتنيات",
  },
  {
    value: "Lighting",
    name: "Lighting",
    nameAr: "إضاءة",
  },
  {
    value: "Antiques",
    name: "Antiques",
    nameAr: "تحف أثرية",
  },
];

const defaultProducts = [
  {
    id: 1,
    name: "Vintage Ceramic Vase",
    nameAr: "مزهرية سيراميك كلاسيكية",
    category: "Decor",
    categoryAr: "ديكورات",
    price: 1200,
    originalPrice: 1500,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600",
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
  },
  {
    id: 5,
    name: "Vintage Decorative Piece",
    nameAr: "قطعة ديكور كلاسيكية",
    category: "Antiques",
    categoryAr: "تحف أثرية",
    price: 3200,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600",
  },
  {
    id: 6,
    name: "Vintage Decorative Piece",
    nameAr: "قطعة ديكور كلاسيكية",
    category: "Antiques",
    categoryAr: "تحف أثرية",
    price: 3200,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600",
  },
  {
    id: 7,
    name: "Vintage Decorative Piece",
    nameAr: "قطعة ديكور كلاسيكية",
    category: "Antiques",
    categoryAr: "تحف أثرية",
    price: 3200,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=600",
  },
];

export function getProducts() {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY);

    if (savedProducts) {
      const parsed = JSON.parse(savedProducts);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }

  return defaultProducts;
}

export function saveProducts(newProducts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
  window.dispatchEvent(new Event("productsUpdated"));
}

export function getCategories() {
  try {
    const savedCategories = localStorage.getItem(
      CATEGORIES_STORAGE_KEY
    );

    if (savedCategories) {
      const parsed = JSON.parse(savedCategories);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }

  return defaultCategories;
}

export function saveCategories(newCategories) {
  localStorage.setItem(
    CATEGORIES_STORAGE_KEY,
    JSON.stringify(newCategories)
  );

  window.dispatchEvent(new Event("categoriesUpdated"));
}

const products = getProducts();

export {
  STORAGE_KEY,
  CATEGORIES_STORAGE_KEY,
  defaultProducts,
  defaultCategories,
};

export default products;
