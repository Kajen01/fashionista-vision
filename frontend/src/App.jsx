import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Model from './pages/Model';
import TryOn from './pages/TryOn';
import TrialRoom from './pages/TrialRoom';
import About from './pages/About';
import LiveTryOn from './pages/LiveTryOn';
import DigitalMirror from './pages/DigitalMirror';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import CartSidebar from './components/common/CartSidebar'
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserEdit from './pages/admin/AdminUserEdit';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from './utils/runtimeConfig';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <div className="min-h-screen bg-white font-body">
              <Navbar />
              <Elements stripe={stripePromise}>
                <CartSidebar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route
                    path="/admin"
                    element={(
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="/admin/users"
                    element={(
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="/admin/users/:id/edit"
                    element={(
                      <AdminRoute>
                        <AdminUserEdit />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="/admin/products"
                    element={(
                      <AdminRoute>
                        <AdminProducts />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="/admin/products/new"
                    element={(
                      <AdminRoute>
                        <AdminProductForm />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="/admin/products/:id/edit"
                    element={(
                      <AdminRoute>
                        <AdminProductForm />
                      </AdminRoute>
                    )}
                  />
                  <Route
                    path="/profile"
                    element={(
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/model"
                    element={(
                      <ProtectedRoute>
                        <Model />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/try-on"
                    element={(
                      <ProtectedRoute>
                        <TryOn />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/trial-room"
                    element={(
                      <ProtectedRoute>
                        <TrialRoom />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/live-tryon"
                    element={(
                      <ProtectedRoute>
                        <LiveTryOn />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/digital-mirror"
                    element={(
                      <ProtectedRoute>
                        <DigitalMirror />
                      </ProtectedRoute>
                    )}
                  />
                </Routes>
              </Elements>
              <Footer />
              <Toaster position="top-right" />
            </div>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
