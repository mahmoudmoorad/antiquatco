import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProducts } from "../data/products";

const WishlistContext = createContext(null);
const STORAGE_KEY = "antikatko-wishlist";

function readWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(readWishlist);

  // حفظ المفضلة
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // مزامنة المفضلة مع المنتجات الموجودة في المتجر
  useEffect(() => {
    const syncWishlistProducts = () => {
      const latestProducts = getProducts();

      setWishlistItems((currentItems) =>
        currentItems
          .map((item) => {
            const latestProduct = latestProducts.find(
              (product) => String(product.id) === String(item.id)
            );

            if (!latestProduct) return null;

            return latestProduct;
          })
          .filter(Boolean)
      );
    };

    syncWishlistProducts();

    window.addEventListener("productsUpdated", syncWishlistProducts);

    return () => {
      window.removeEventListener(
        "productsUpdated",
        syncWishlistProducts
      );
    };
  }, []);

  const toggleWishlist = (product) => {
    if (!product || product.id == null) return;

    setWishlistItems((current) =>
      current.some(
        (item) => String(item.id) === String(product.id)
      )
        ? current.filter(
            (item) => String(item.id) !== String(product.id)
          )
        : [...current, product]
    );
  };

  const isInWishlist = (id) =>
    wishlistItems.some((item) => String(item.id) === String(id));

  const removeFromWishlist = (id) => {
    setWishlistItems((current) =>
      current.filter((item) => String(item.id) !== String(id))
    );
  };

  const value = useMemo(
    () => ({
      wishlistItems,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
    }),
    [wishlistItems]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}