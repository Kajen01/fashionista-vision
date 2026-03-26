import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/helpers';
import axios from 'axios';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { buildBackendUrl, resolveProductImageUrl } from '../../utils/runtimeConfig';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const CartSidebar = () => {
  const { cartItems, isCartOpen, toggleCart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { token, requireLogin } = useAuth();

  const stripe = useStripe();
  const elements = useElements();

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!requireLogin('checkout')) return;

    try {
      const res = await axios.post(buildBackendUrl('/api/checkout'), {
        items: cartItems.map(item => {
          const discount = item.discount || 0;
          const finalPrice = discount > 0 ? item.price * (1 - discount / 100) : item.price;
          return {
            id: item.id,
            name: item.name,
            price: Math.round(finalPrice * 100),
            quantity: item.quantity
          };
        })
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const clientSecret = res.data.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        toast.error(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        clearCart()
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      toast.error(err.response?.data?.message || 'Error during checkout.');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={toggleCart}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
              <button
                onClick={toggleCart}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={resolveProductImageUrl(item)}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500">
                            Size: {item.size} | Color: {item.color}
                          </p>
                          {(item.discount || 0) > 0 ? (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-rose-600 font-bold">
                                LKR {(item.price * (1 - item.discount / 100)).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400 line-through">LKR {item.price}</p>
                            </div>
                          ) : (
                            <p className="text-rose-600 font-bold mt-0.5">LKR {item.price}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-rose-600">
                    {formatCurrency(getCartTotal())}
                  </span>
                </div>
                <div className="my-4">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                      },
                    }}
                  />
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold">
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
