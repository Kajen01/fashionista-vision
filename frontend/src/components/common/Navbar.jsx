import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems, toggleCart } = useCart();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Always visible (no login required)
  const homeItem = { path: '/', label: 'Home', page: 'home' };
  const aboutItem = { path: '/about', label: 'About', page: 'about' };

  // Always visible but require login to access
  const guardedNavItems = [
    { path: '/model', label: 'Model', page: 'model' },
    { path: '/digital-mirror', label: 'Digital Mirror', page: 'digital-mirror' },
  ];

  const protectedNavItems = [
    // { path: '/try-on', label: 'Try-On', page: 'try-on' },
    // { path: '/trial-room', label: 'TrialRoom', page: 'trial-room' },
    // { path: '/live-tryon', label: 'Live Try-On', page: 'live-tryon' },
    { path: '/profile', label: 'Profile', page: 'profile' },
  ];

  const adminNavItems = isAdmin
    ? [{ path: '/admin', label: 'Admin Dashboard', page: 'admin' }]
    : [];

  // Order: Home > Model > Digital Mirror > About > (Profile if logged in)
  const navItems = isAuthenticated
    ? [homeItem, ...guardedNavItems, aboutItem, ...protectedNavItems, ...adminNavItems]
    : [homeItem, ...guardedNavItems, aboutItem];

  // For guarded items: navigate to login if not authenticated
  const handleGuardedClick = (e, path) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login', { state: { from: path } });
    }
  };

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-display font-bold text-gray-900">
              Fashionista Vision
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => {
                const isGuarded = guardedNavItems.some(g => g.path === item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={isGuarded ? (e) => handleGuardedClick(e, item.path) : undefined}
                    className={`nav-link px-3 py-2 text-sm font-medium transition-colors duration-200 ${location.pathname === item.path
                      ? 'text-rose-600 border-b-2 border-rose-600'
                      : 'text-gray-600 hover:text-rose-600'
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated && (
              <div className="hidden items-center space-x-3 md:flex">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-rose-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Register
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="hidden items-center space-x-3 md:flex">
                <span className="text-sm font-medium text-slate-500">
                  {user?.name}
                </span>
                <button
                  onClick={() => logout()}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                >
                  Logout
                </button>
              </div>
            )}

            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-rose-600 transition-colors"
              title={isAuthenticated ? 'Open cart' : 'Login required to view cart'}
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center cart-counter">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-rose-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isGuarded = guardedNavItems.some(g => g.path === item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (isGuarded) handleGuardedClick(e, item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${location.pathname === item.path
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-gray-600 hover:text-rose-600 hover:bg-gray-50'
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-rose-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-rose-600"
                >
                  Register
                </Link>
              </>
            )}

            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="block w-full px-3 py-2 text-left text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-rose-600"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
