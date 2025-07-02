import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Car,
  Users,
  MapPin,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  Heart,
  MessageCircle,
  User,
} from "lucide-react";
import logo from "../assets/images/ourlogo.png";

function LandingPage() {
  const features = [
    {
      icon: Users,
      title: "Smart Matching",
      description: "Get matched with fellow students heading to the same destination",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Verified campus users only - your safety is our priority",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Live ride status, chat with co-riders, and instant notifications",
    },
    {
      icon: Zap,
      title: "Quick & Easy",
      description: "Book rides in seconds with our intuitive interface",
    },
    {
      icon: Globe,
      title: "Eco-Friendly",
      description: "Reduce carbon footprint by sharing rides with others",
    },
    {
      icon: Heart,
      title: "Build Community",
      description: "Connect with fellow students and build lasting friendships",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={logo}
                alt="CampusCruze Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full"
              />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                CampusCruze
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-50 text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ride Together,
                </span>
                <br />
                <span className="text-gray-800">Arrive Together</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                Connect with fellow students, share rides, and make your campus commute 
                safer, cheaper, and more fun. Join the largest student ride-sharing community.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose CampusCruze?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Experience the future of campus transportation with features designed for students, by students.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Getting started is easy. Follow these simple steps to start sharing rides.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Create your account with your student email and verify your campus identity.",
                icon: User,
              },
              {
                step: "02", 
                title: "Find or Create",
                description: "Search for existing rides or create your own ride request to your destination.",
                icon: MapPin,
              },
              {
                step: "03",
                title: "Connect & Go",
                description: "Get matched with fellow students, chat with them, and enjoy your shared ride.",
                icon: MessageCircle,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold mx-auto mb-3 sm:mb-4">
                  {item.step}
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg">
                  <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Ready to Transform Your Commute?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join thousands of students who are already saving money, making friends, 
              and reducing their carbon footprint with CampusCruze.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Join CampusCruze Today
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <img
                  src={logo}
                  alt="CampusCruze Logo"
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full"
                />
                <span className="text-lg sm:text-xl font-bold">CampusCruze</span>
              </div>
              <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                The premier ride-sharing platform for students. Safe, affordable, and community-driven.
              </p>
              <div className="text-xs sm:text-sm text-gray-500">
                © 2025 CampusCruze. All rights reserved.
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/login" className="block text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Sign In
                </Link>
                <Link to="/register" className="block text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Sign Up
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <div className="space-y-2">
                <a href="mailto:support@campuscruze.com" className="block text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Contact Us
                </a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Help Center
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
