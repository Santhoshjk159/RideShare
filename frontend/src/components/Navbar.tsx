import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Car, User, LogOut, Shield, Menu, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <img
              src="/src/assets/images/ourlogo.png"
              alt="CampusCruze Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full"
            />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
              CampusCruze
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 lg:px-3 py-2 rounded-lg hover:bg-blue-50 text-sm lg:text-base"
            >
              Dashboard
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User name - hidden on mobile */}
            <span className="text-sm text-gray-600 hidden md:block">
              Hello, <span className="font-medium">{user.name}</span>
            </span>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-2">
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                  title="Admin Dashboard"
                >
                  <Shield className="h-5 w-5" />
                </Link>
              )}

              <Link
                to="/profile"
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-4 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Car className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>



                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5 mr-3" />
                    Admin Dashboard
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;
