import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Model from './pages/Model';
import TryOn from './pages/TryOn';
import TrialRoom from './pages/TrialRoom';
import About from './pages/About';
import CartSidebar from './components/common/CartSidebar'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51SX0AdCMqeEsvOyIkN6pGGa5IbBJ0dfAfOoumSM6GYebBc6niHPf08X4v4atgiWYkPZEzs9M96jj3qyxihmlFViA00XI2wIV0P');

function App() {
  return (
    <Router>
      <ProductsProvider>
        <CartProvider>
          <div className="min-h-screen bg-white font-body">
            <Navbar />
            <Elements stripe={stripePromise}>
            <CartSidebar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/model" element={<Model />} />
              <Route path="/try-on" element={<TryOn />} />
              <Route path="/trial-room" element={<TrialRoom />} />
              <Route path="/about" element={<About />} />
            </Routes>
            </Elements>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </CartProvider>
      </ProductsProvider>
    </Router>
  );
}

export default App;