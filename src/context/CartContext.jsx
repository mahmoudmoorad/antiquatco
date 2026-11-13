
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getProducts, saveProducts } from "../data/products";

const CartContext = createContext(null);

const STORAGE_KEY = "antikatko-cart";
const STOCK_MOVEMENTS_KEY = "antikatko-stock-movements";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function readStockMovements() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STOCK_MOVEMENTS_KEY) || "[]"
    );

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

  // تحديث المنتجات الموجودة في السلة
  useEffect(() => {
    const syncCartProducts = () => {
      const latestProducts = getProducts();

      setCartItems((currentItems) =>
        currentItems
          .map((cartItem) => {
            const latestProduct = latestProducts.find(
              (product) =>
                String(product.id) === String(cartItem.id)
            );

            if (!latestProduct) return null;

            const maxStock = Math.max(
              0,
              Number(latestProduct.stock) || 0
            );

            if (maxStock === 0) return null;

            return {
              ...latestProduct,
              quantity: Math.min(
                Number(cartItem.quantity) || 1,
                maxStock
              ),
            };
          })
          .filter(Boolean)
      );
    };

    syncCartProducts();

    window.addEventListener("productsUpdated", syncCartProducts);

    return () => {
      window.removeEventListener(
        "productsUpdated",
        syncCartProducts
      );
    };
  }, []);

  // إضافة منتج للسلة مع التحقق من المخزون
  const addToCart = (product, quantity = 1) => {
    if (!product || product.id == null) return;

    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount) || amount < 1) return;

    const currentProducts = getProducts();

    const liveProduct = currentProducts.find(
      (item) => String(item.id) === String(product.id)
    );

    if (!liveProduct) {
      window.alert("هذا المنتج لم يعد متاحاً.");
      return;
    }

    const availableStock = Math.max(
      0,
      Number(liveProduct.stock) || 0
    );

    setCartItems((current) => {
      const found = current.find(
        (item) => String(item.id) === String(product.id)
      );

      const existingQty = found ? Number(found.quantity) || 0 : 0;
      const totalRequested = existingQty + amount;

      if (totalRequested > availableStock) {
        window.alert(
          `عذراً، الكمية المطلوبة غير متوفرة. المتاح حالياً: ${availableStock}`
        );
        return current;
      }

      if (found) {
        return current.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...liveProduct,
                quantity: totalRequested,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...liveProduct,
          quantity: amount,
        },
      ];
    });
  };

  // حذف منتج من السلة
  const removeFromCart = (id) => {
    setCartItems((current) =>
      current.filter((item) => String(item.id) !== String(id))
    );
  };

  // تعديل كمية المنتج في السلة
  const updateQuantity = (id, quantity) => {
    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount) || amount < 1) return;

    const currentProducts = getProducts();

    const liveProduct = currentProducts.find(
      (product) => String(product.id) === String(id)
    );

    if (!liveProduct) {
      window.alert("هذا المنتج لم يعد متاحاً.");
      return;
    }

    const availableStock = Math.max(
      0,
      Number(liveProduct.stock) || 0
    );

    if (amount > availableStock) {
      window.alert(
        `عذراً، أقصى كمية متاحة هي ${availableStock}`
      );
      return;
    }

    setCartItems((current) =>
      current.map((item) =>
        String(item.id) === String(id)
          ? { ...item, quantity: amount }
          : item
      )
    );
  };

  // Frontend stock management is delegated to the authoritative Django backend.
  const deductStockForOrder = () => {
    return { success: true };
  };

  const restoreStockForOrder = () => {
    return { success: true };
  };

  const clearCart = () => setCartItems([]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * item.quantity,
    0
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      deductStockForOrder,
      restoreStockForOrder,
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
