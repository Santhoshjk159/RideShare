import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Clock, MapPin, Users, Search, Filter, Calendar, Compass, History, Star, MessageCircle, Car } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

interface Ride {
  id: number;
  destination: string;
  pickup_location: string;
  time_window_start: string;
  time_window_end: string;
  date: string;
  max_seats: number;
  current_seats: number;
  creator_name: string;
  creator_id: number;
  participant_count: number;
  participants: any[];
  status: string;
  is_joined?: boolean;
}

type TabType = 'all' | 'my-rides' | 'completed';

function Dashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const [tabCounts, setTabCounts] = useState({
    all: 0,
    myRides: 0,
    completed: 0
  });

  useEffect(() => {
    fetchRides();
    fetchTabCounts();
    
    // Set up auto-refresh every 5 minutes to catch cleanup changes
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing rides...");
      fetchRides();
      fetchTabCounts();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [selectedDate, searchTerm, activeTab]);

  const fetchTabCounts = async () => {
    try {
      // Fetch counts for each tab
      const [activeResponse, completedResponse, allResponse] = await Promise.all([
        axios.get('/rides?status=active'),
        axios.get('/rides?status=completed'),
        axios.get('/rides?status=all')
      ]);

      const activeRides = activeResponse.data.rides || [];
      const completedRides = completedResponse.data.rides || [];
      const allRides = allResponse.data.rides || [];

      const userId = parseInt(user?.id || '0');
      const myRides = allRides.filter((ride: Ride) => 
        ride.creator_id === userId || ride.participants?.some((p: any) => p.id === userId)
      );

      setTabCounts({
        all: activeRides.length,
        myRides: myRides.length,
        completed: completedRides.length
      });
    } catch (error) {
      console.error("Failed to fetch tab counts:", error);
    }
  };

  const fetchRides = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (searchTerm) params.append("destination", searchTerm);
      
      // Set status based on active tab
      switch (activeTab) {
        case 'completed':
          params.append("status", "completed");
          break;
        case 'my-rides':
          // For my rides, we need both active and completed
          params.append("status", "all");
          break;
        default:
          params.append("status", "active");
      }

      console.log("Fetching rides with params:", params.toString());
      const response = await axios.get(`/rides?${params.toString()}`);
      console.log("API Response:", response.data);
      
      let fetchedRides = response.data.rides || response.data || [];

      console.log("Raw rides from API:", fetchedRides);
      console.log("Total rides found:", fetchedRides.length);
      setRides(fetchedRides);
      
      if (fetchedRides.length === 0) {
        toast("No rides found. Try creating a new ride!", {
          icon: "ℹ️",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Fetch rides error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(`Failed to fetch rides: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        console.error("Network error:", error.request);
        toast.error("Network error - please check your connection");
      } else {
        toast.error("Failed to fetch rides");
      }
    } finally {
      setLoading(false);
    }
  };

  const joinRide = async (rideId: number) => {
    try {
      await axios.post(`/rides/${rideId}/join`);
      toast.success("Successfully joined the ride!");
      fetchRides();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to join ride";
      toast.error(message);
    }
  };

  const filteredRides = rides.filter(ride => {
    switch (activeTab) {
      case 'my-rides':
        return ride.creator_id === parseInt(user?.id || '0') || ride.participants?.some((p: any) => p.id === parseInt(user?.id || '0'));
      case 'completed':
        return ride.status === 'completed';
      case 'all':
      default:
        return ride.status === 'active';
    }
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600">
              {activeTab === 'all' && "Discover and join rides in your campus community"}
              {activeTab === 'my-rides' && "Manage your rides and track your journey"}
              {activeTab === 'completed' && "Review your ride history and experiences"}
            </p>
          </div>
          <Link
            to="/request-ride"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Create Ride</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="border-b border-gray-200 bg-white rounded-t-xl px-4 sm:px-6">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto">
            {[
              { id: 'all' as TabType, label: 'All Rides', icon: Compass, count: tabCounts.all },
              { id: 'my-rides' as TabType, label: 'My Rides', icon: Users, count: tabCounts.myRides },
              { id: 'completed' as TabType, label: 'Completed', icon: History, count: tabCounts.completed }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                title="Select date"
                aria-label="Select date"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center"
              title="Toggle filters"
              aria-label="Toggle filters"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'Active Rides', value: rides.filter(r => r.status === 'active').length, color: 'text-green-600', bg: 'bg-green-50', icon: Compass },
          { label: 'My Rides', value: rides.filter(r => r.creator_id === parseInt(user?.id || '0')).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
          { label: 'Joined Rides', value: rides.filter(r => r.participants?.some((p: any) => p.id === parseInt(user?.id || '0'))).length, color: 'text-purple-600', bg: 'bg-purple-50', icon: Star },
          { label: 'Total Completed', value: rides.filter(r => r.status === 'completed').length, color: 'text-gray-600', bg: 'bg-gray-50', icon: History }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bg} mr-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Rides Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRides.map((ride, index) => (
          <motion.div
            key={ride.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {ride.destination}
                </h3>
                <p className="text-sm text-gray-600">
                  by <span className="font-medium">{ride.creator_name}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ride.status === "active"
                      ? "bg-green-100 text-green-800"
                      : ride.status === "full"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {ride.status}
                </span>
                {ride.creator_id === parseInt(user?.id || '0') && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Your ride
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{ride.pickup_location || "Pickup location TBD"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{ride.time_window_start} - {ride.time_window_end}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{ride.participant_count}/{ride.max_seats} seats</span>
                <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
                      ride.participant_count === 0 ? 'w-0' :
                      ride.participant_count / ride.max_seats < 0.25 ? 'w-3' :
                      ride.participant_count / ride.max_seats < 0.5 ? 'w-1/4' :
                      ride.participant_count / ride.max_seats < 0.75 ? 'w-1/2' :
                      ride.participant_count / ride.max_seats < 1 ? 'w-3/4' : 'w-full'
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/ride/${ride.id}`}
                className="flex-1 text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                View Details
              </Link>

              {ride.participant_count < ride.max_seats &&
                ride.status === "active" && 
                ride.creator_id !== parseInt(user?.id || '0') && (
                  <button
                    onClick={() => joinRide(ride.id)}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium transform hover:scale-105"
                  >
                    Join Ride
                  </button>
                )}

              {ride.creator_id === parseInt(user?.id || '0') && (
                <button 
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Open chat"
                  aria-label="Open chat"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRides.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-500 mb-4">
            <Car className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {activeTab === 'all' && "No rides available"}
              {activeTab === 'my-rides' && "You haven't created or joined any rides yet"}
              {activeTab === 'completed' && "No completed rides"}
            </h3>
            <p className="text-sm">
              {activeTab === 'all' && "Try adjusting your search criteria or create a new ride"}
              {activeTab === 'my-rides' && "Start by creating your first ride or joining an existing one"}
              {activeTab === 'completed' && "Complete some rides to see them here"}
            </p>
          </div>
          <Link
            to="/request-ride"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Ride
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;
