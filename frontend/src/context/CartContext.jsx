import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export const  CartContext = createContext();

function normalizeCartItem(item = {}) {
  return {
    ...item,
    isSelected: item.isSelected !== false,
  };
}

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated, requireLogin } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const userId = user?.id || user?._id || '';

  const getCartStorageKey = () => (userId ? `fashionCart:${userId}` : null);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCartItems([]);
      setIsCartOpen(false);
      return;
    }

    const storageKey = getCartStorageKey();
    const saved = storageKey ? localStorage.getItem(storageKey) : null;
    const parsedItems = saved ? JSON.parse(saved) : [];
    setCartItems(Array.isArray(parsedItems) ? parsedItems.map(normalizeCartItem) : []);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const storageKey = getCartStorageKey();

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated, userId]);

  const addToCart = (product, size = 'M', color = 'Original') => {
    if (!requireLogin('add items to cart')) {
      return false;
    }

    setCartItems((current) => {
      const existingItem = current.find(
        (item) => item.id === product.id && item.size === size && item.color === color
      );

      if (existingItem) {
        return current.map((item) =>
          item.id === product.id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + 1, isSelected: true }
            : item
        );
      }

      return [...current, { ...product, quantity: 1, size, color, isSelected: true }];
    });

    toast.success(`${product.name} added to cart.`);
    return true;
  };

  const removeFromCart = (productId, size, color) => {
    setCartItems((current) => current.filter(
      (item) => !(item.id === productId && item.size === size && item.color === color)
    ));
  };

  const updateQuantity = (productId, size, color, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    setCartItems((current) => current.map((item) =>
      item.id === productId && item.size === size && item.color === color
        ? { ...item, quantity }
        : item
    ));
  };

  const toggleItemSelection = (productId, size, color) => {
    setCartItems((current) => current.map((item) =>
      item.id === productId && item.size === size && item.color === color
        ? { ...item, isSelected: !item.isSelected }
        : item
    ));
  };

  const toggleCart = () => {
    if (isCartOpen) {
      setIsCartOpen(false);
      return true;
    }

    if (!requireLogin('view your cart')) {
      setIsCartOpen(false);
      return false;
    }

    setIsCartOpen(true);
    return true;
  };

  const clearCart = () => {
    setCartItems([]);
    const storageKey = getCartStorageKey();

    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const discount = item.discount || 0;
      const finalPrice = discount > 0 ? item.price * (1 - discount / 100) : item.price;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const getSelectedCartItems = () => {
    return cartItems.filter((item) => item.isSelected);
  };

  const getSelectedCartTotal = () => {
    return cartItems.reduce((total, item) => {
      if (!item.isSelected) {
        return total;
      }

      const discount = item.discount || 0;
      const finalPrice = discount > 0 ? item.price * (1 - discount / 100) : item.price;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const removeSelectedCartItems = () => {
    setCartItems((current) => current.filter((item) => !item.isSelected));
  };

  const hasSelectedItems = () => {
    return cartItems.some((item) => item.isSelected);
  };

  const value = {
    cartItems,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleCart,
    clearCart,
    getCartTotal,
    toggleItemSelection,
    getSelectedCartItems,
    getSelectedCartTotal,
    removeSelectedCartItems,
    hasSelectedItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
