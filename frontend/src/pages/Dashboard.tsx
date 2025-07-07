import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Calendar,
  Compass,
  History,
  Star,
  MessageCircle,
  Car,
  Trash2,
  AlertTriangle,
} from "lucide-react";
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
  completed_by?: number;
  completed_by_name?: string;
  completed_at?: string;
}

type TabType = "my-requests" | "my-rides" | "completed" | "all-admin";

function Dashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("my-requests");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [defaultTabSet, setDefaultTabSet] = useState(false);
  
  // Confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [tabCounts, setTabCounts] = useState({
    requests: 0,
    myRides: 0,
    completed: 0,
    all: 0,
  });

  useEffect(() => {
    // Only set default tab once when component mounts
    if (!defaultTabSet) {
      determineDefaultTab();
    } else {
      fetchRides();
      fetchTabCounts();
      checkAdminStatus();
    }

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchRides();
      fetchTabCounts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [selectedDate, searchTerm, activeTab, defaultTabSet]);

  const determineDefaultTab = async () => {
    try {
      // Fetch all active rides to determine if user has any active rides
      const response = await axios.get("/rides?status=all");
      const allRides = response.data.rides || [];
      
      const userId = parseInt(user?.id || "0");
      const userActiveRides = allRides.filter(
        (ride: Ride) =>
          ((ride.creator_id === userId ||
            ride.participants?.some((p: any) => p.id === userId)) &&
          (ride.status === "active" || ride.status === "full"))
      );

      // Set default tab based on whether user has active rides
      if (userActiveRides.length > 0) {
        setActiveTab("my-rides");
      } else {
        setActiveTab("my-requests");
      }
      
      setDefaultTabSet(true);
    } catch (error) {
      // If there's an error, default to my-requests
      setActiveTab("my-requests");
      setDefaultTabSet(true);
    }
  };

  const checkAdminStatus = async () => {
    try {
      // Check if user has admin role
      setIsAdmin(user?.role === "admin");
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchTabCounts = async () => {
    try {
      // Fetch counts for each tab
      const [requestsResponse, activeResponse, completedResponse] =
        await Promise.all([
          axios.get("/rides/my-requests"),
          axios.get("/rides?status=all"),
          axios.get("/rides?status=completed"),
        ]);

      const requestsRides = requestsResponse.data.rides || [];
      const allRides = activeResponse.data.rides || [];
      const completedRides = completedResponse.data.rides || [];

      const userId = parseInt(user?.id || "0");
      const myRides = allRides.filter(
        (ride: Ride) =>
          (ride.creator_id === userId ||
            ride.participants?.some((p: any) => p.id === userId)) &&
          (ride.status === "active" || ride.status === "full")
      );

      const newTabCounts = {
        requests: requestsRides.length,
        myRides: myRides.length,
        completed: completedRides.length,
        all: allRides.length,
      };

      setTabCounts(newTabCounts);

    } catch (error) {
      // Silently handle tab count fetch errors
    }
  };

  const fetchRides = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (searchTerm) params.append("destination", searchTerm);

      // Handle different endpoints based on tab
      let endpoint = "/rides";
      switch (activeTab) {
        case "my-requests":
          endpoint = "/rides/my-requests";
          break;
        case "completed":
          params.append("status", "completed");
          break;
        case "my-rides":
          params.append("status", "all");
          break;
        case "all-admin":
          params.append("status", "all");
          break;
        default:
          endpoint = "/rides/my-requests";
      }

      // Build the URL without a trailing ? if there are no params
      const url = params.toString()
        ? `${endpoint}?${params.toString()}`
        : endpoint;
      const response = await axios.get(url);

      let fetchedRides = response.data.rides || response.data || [];
      setRides(fetchedRides);

      // Don't show toast for empty results - it's normal
    } catch (error: any) {
      if (error.response) {
        toast.error(
          `Failed to fetch rides: ${
            error.response.data.message || error.response.status
          }`
        );
      } else if (error.request) {
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

  const completeRide = async (rideId: number) => {
    setSelectedRideId(rideId);
    setShowCompleteModal(true);
  };

  const confirmCompleteRide = async () => {
    if (!selectedRideId) return;
    
    setIsCompleting(true);
    try {
      await axios.post(`/rides/${selectedRideId}/complete`);
      toast.success("Ride marked as completed!");
      fetchRides();
      setShowCompleteModal(false);
      setSelectedRideId(null);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to complete ride";
      toast.error(message);
    } finally {
      setIsCompleting(false);
    }
  };

  const deleteRide = async (rideId: number) => {
    setSelectedRideId(rideId);
    setShowDeleteModal(true);
  };

  const confirmDeleteRide = async () => {
    if (!selectedRideId) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/rides/${selectedRideId}`);
      toast.success("Ride deleted successfully!");
      fetchRides();
      setShowDeleteModal(false);
      setSelectedRideId(null);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to delete ride";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelModal = () => {
    setShowDeleteModal(false);
    setShowCompleteModal(false);
    setSelectedRideId(null);
  };

  const filteredRides = rides.filter((ride) => {
    switch (activeTab) {
      case "my-rides":
        // Only show active and full rides, not completed ones
        return (
          (ride.creator_id === parseInt(user?.id || "0") ||
            ride.participants?.some(
              (p: any) => p.id === parseInt(user?.id || "0")
            )) &&
          ride.status !== "completed"
        );
      case "completed":
        // Show completed rides where user was involved
        return (
          ride.status === "completed" &&
          (ride.creator_id === parseInt(user?.id || "0") ||
            ride.participants?.some(
              (p: any) => p.id === parseInt(user?.id || "0")
            ))
        );
      case "my-requests":
        return (
          ride.creator_id === parseInt(user?.id || "0") &&
          ride.status === "waiting"
        );
      case "all-admin":
        return isAdmin; // Only admins can see all rides
      default:
        return (
          ride.creator_id === parseInt(user?.id || "0") &&
          ride.status === "waiting"
        );
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
              {activeTab === "my-requests" &&
                "Create ride requests and get matched with others"}
              {activeTab === "my-rides" &&
                "Manage your active rides and track your journey"}
              {activeTab === "completed" &&
                "Review your ride history and experiences"}
              {activeTab === "all-admin" &&
                "Admin view - manage all campus rides"}
            </p>
          </div>
          <Link
            to="/request-ride"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Find Ride</span>
            <span className="sm:hidden">Find</span>
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
              {
                id: "my-requests" as TabType,
                label: "Create Ride",
                icon: Search,
                count: null,
              },
              {
                id: "my-rides" as TabType,
                label: "My Rides",
                icon: Users,
                count: null,
              },
              {
                id: "completed" as TabType,
                label: "Completed",
                icon: History,
                count: null,
              },
              ...(isAdmin
                ? [
                    {
                      id: "all-admin" as TabType,
                      label: "All (Admin)",
                      icon: Compass,
                      count: tabCounts.all,
                    },
                  ]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label}</span>
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
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
        className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      >
        {[
          // Show different stats based on active tab
          activeTab === "my-requests"
            ? {
                label: "Created Rides",
                value: rides.filter(
                  (r) => r.creator_id === parseInt(user?.id || "0")
                ).length,
                color: "text-blue-600",
                bg: "bg-blue-50",
                icon: Users,
              }
            : {
                label: "Active Rides",
                value: rides.filter((r) => r.status === "active").length,
                color: "text-green-600",
                bg: "bg-green-50",
                icon: Compass,
              },
          {
            label: "Joined Rides",
            value: rides.filter((r) =>
              r.participants?.some(
                (p: any) => p.id === parseInt(user?.id || "0")
              )
            ).length,
            color: "text-purple-600",
            bg: "bg-purple-50",
            icon: Star,
          },
          {
            label: "Total Completed",
            value: rides.filter(
              (r) =>
                r.status === "completed" &&
                (r.creator_id === parseInt(user?.id || "0") ||
                  r.participants?.some(
                    (p: any) => p.id === parseInt(user?.id || "0")
                  ))
            ).length,
            color: "text-gray-600",
            bg: "bg-gray-50",
            icon: History,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
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
                {ride.creator_id === parseInt(user?.id || "0") && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Your ride
                  </span>
                )}
                {ride.creator_id !== parseInt(user?.id || "0") &&
                  ride.participants?.some(
                    (p: any) => p.id === parseInt(user?.id || "0")
                  ) && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Joined
                    </span>
                  )}
                {/* Show completion info for completed rides */}
                {ride.status === "completed" && ride.completed_by_name && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Completed by {ride.completed_by_name}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {ride.pickup_location || "Pickup location TBD"}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {ride.time_window_start} - {ride.time_window_end}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {ride.participant_count}/{ride.max_seats} seats
                </span>
                <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  <div
                    className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
                      ride.participant_count === 0
                        ? "w-0"
                        : ride.participant_count / ride.max_seats < 0.25
                        ? "w-3"
                        : ride.participant_count / ride.max_seats < 0.5
                        ? "w-1/4"
                        : ride.participant_count / ride.max_seats < 0.75
                        ? "w-1/2"
                        : ride.participant_count / ride.max_seats < 1
                        ? "w-3/4"
                        : "w-full"
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Only show View Details and Chat for non-completed rides */}
              {ride.status !== "completed" && (
                <>
                  <Link
                    to={`/ride/${ride.id}`}
                    className="flex-1 min-w-[120px] text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>

                  {/* Chat Button - only show for rides user is part of */}
                  {(ride.creator_id === parseInt(user?.id || "0") ||
                    ride.participants?.some(
                      (p: any) => p.id === parseInt(user?.id || "0")
                    )) && (
                    <Link
                      to={`/ride/${ride.id}#chat`}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Open chat"
                      aria-label="Open chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  )}
                </>
              )}

              {/* Join Ride Button */}
              {ride.participant_count < ride.max_seats &&
                ride.status === "active" &&
                ride.creator_id !== parseInt(user?.id || "0") &&
                !ride.participants?.some(
                  (p: any) => p.id === parseInt(user?.id || "0")
                ) && (
                  <button
                    onClick={() => joinRide(ride.id)}
                    className="flex-1 min-w-[100px] py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium transform hover:scale-105"
                  >
                    Join Ride
                  </button>
                )}

              {/* Complete Ride Button - only show for active rides where user is creator or participant */}
              {ride.status === "active" &&
                (ride.creator_id === parseInt(user?.id || "0") ||
                  ride.participants?.some(
                    (p: any) => p.id === parseInt(user?.id || "0")
                  )) && (
                  <button
                    onClick={() => completeRide(ride.id)}
                    className="py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium"
                    title="Mark as completed"
                  >
                    Complete
                  </button>
                )}

              {/* Delete Ride Button - only show for rides created by the user and not completed */}
              {ride.status !== "completed" &&
                ride.creator_id === parseInt(user?.id || "0") && (
                  <button
                    onClick={() => deleteRide(ride.id)}
                    className="py-2 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium flex items-center gap-1"
                    title="Delete ride"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
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
              {activeTab === "my-requests" && "No pending requests"}
              {activeTab === "my-rides" && "No active rides"}
              {activeTab === "completed" && "No completed rides"}
              {activeTab === "all-admin" && "No rides available"}
            </h3>
            <p className="text-sm">
              {activeTab === "my-requests" &&
                "Create a new ride request to get matched with others"}
              {activeTab === "my-rides" &&
                "You haven't created or joined any rides yet. Start by creating your first ride!"}
              {activeTab === "completed" &&
                "Your completed ride history will appear here"}
              {activeTab === "all-admin" &&
                "Try adjusting your search criteria or date filters"}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Ride</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this ride? This action cannot be undone.
              {/* Note: The backend will prevent deletion if there are other participants */}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelModal}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRide}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Complete Ride</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark this ride as completed? This will finalize the ride and move it to your completed rides history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelModal}
                disabled={isCompleting}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCompleteRide}
                disabled={isCompleting}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  "Complete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
