import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProducts } from "../data/products";

const CartContext = createContext(null);
const STORAGE_KEY = "antikatko-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // حفظ السلة
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // تحديث بيانات المنتجات الموجودة في السلة
  useEffect(() => {
    const syncCartProducts = () => {
      const latestProducts = getProducts();

      setCartItems((currentItems) => {
        const updatedItems = currentItems
          .map((cartItem) => {
            const latestProduct = latestProducts.find(
              (product) =>
                String(product.id) === String(cartItem.id)
            );

            if (!latestProduct) return null;

            return {
              ...latestProduct,
              quantity: cartItem.quantity,
            };
          })
          .filter(Boolean);

        return updatedItems;
      });
    };

    // تحديث السلة عند فتح المتجر
    syncCartProducts();

    // الاستماع لأي تعديل من لوحة الأدمن
    window.addEventListener("productsUpdated", syncCartProducts);

    return () => {
      window.removeEventListener(
        "productsUpdated",
        syncCartProducts
      );
    };
  }, []);

  const addToCart = (product, quantity = 1) => {
    if (!product || product.id == null) return;

    const amount = Math.max(1, Number(quantity) || 1);

    setCartItems((current) => {
      const found = current.find(
        (item) => String(item.id) === String(product.id)
      );

      if (found) {
        return current.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...product,
                quantity: item.quantity + amount,
              }
            : item
        );
      }

      return [...current, { ...product, quantity: amount }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((current) =>
      current.filter((item) => String(item.id) !== String(id))
    );
  };

  const updateQuantity = (id, quantity) => {
    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount) || amount < 1) return;

    setCartItems((current) =>
      current.map((item) =>
        String(item.id) === String(id)
          ? { ...item, quantity: amount }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [cartItems, cartCount, cartTotal, isCartOpen]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}