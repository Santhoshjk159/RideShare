import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Car, User, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">RideShare</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/request-ride"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Request Ride
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Hello, {user.name}</span>

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="h-5 w-5" />
              </Link>
            )}

            <Link
              to="/profile"
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-gray-50 border-t border-gray-200">
        <div className="px-4 py-3 space-y-2">
          <Link
            to="/dashboard"
            className="block text-gray-700 hover:text-primary-600 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/request-ride"
            className="block text-primary-600 font-medium"
          >
            Request Ride
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
