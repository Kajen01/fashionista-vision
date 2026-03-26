import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export const  CartContext = createContext();

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
    setCartItems(saved ? JSON.parse(saved) : []);
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

    const existingItem = cartItems.find(
      item => item.id === product.id && item.size === size && item.color === color
    );

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id && item.size === size && item.color === color
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1, size, color }]);
    }

    toast.success(`${product.name} added to cart.`);
    return true;
  };

  const removeFromCart = (productId, size, color) => {
    setCartItems(cartItems.filter(
      item => !(item.id === productId && item.size === size && item.color === color)
    ));
  };

  const updateQuantity = (productId, size, color, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    setCartItems(cartItems.map(item =>
      item.id === productId && item.size === size && item.color === color
        ? { ...item, quantity }
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
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
