import React, { createContext, useContext, useState, useEffect } from 'react';

export const  CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('fashionCart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('fashionCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, size = 'M', color = 'Original') => {
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
    setIsCartOpen(!isCartOpen);
  };

  const clearCart = () => {
    setCartItems([]);
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