
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (!product || product.id == null) return;

    const amount = Math.max(1, Number(quantity) || 1);

    setCartItems(current => {
      const found = current.find(
        item => String(item.id) === String(product.id)
      );

      if (found) {
        return current.map(item =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + amount }
            : item
        );
      }

      return [...current, { ...product, quantity: amount }];
    });
  };

  const removeFromCart = id => {
    setCartItems(current =>
      current.filter(item => String(item.id) !== String(id))
    );
  };

  const updateQuantity = (id, quantity) => {
    const amount = Math.floor(Number(quantity));

    if (!Number.isFinite(amount) || amount < 1) return;

    setCartItems(current =>
      current.map(item =>
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
