import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Clock, MapPin, Users, Search } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

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
  participant_count: number;
  participants: any[];
  status: string;
}

function Dashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchRides();
  }, [selectedDate, searchTerm]);

  const fetchRides = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (searchTerm) params.append("destination", searchTerm);

      const response = await axios.get(`/rides?${params}`);
      setRides(response.data.rides);
    } catch (error) {
      toast.error("Failed to fetch rides");
      console.error("Fetch rides error:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinRide = async (rideId: number) => {
    try {
      await axios.post(`/rides/${rideId}/join`);
      toast.success("Successfully joined the ride!");
      fetchRides(); // Refresh the list
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to join ride";
      toast.error(message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Available Rides
            </h1>
            <p className="text-gray-600 mt-1">
              Find and join rides to your destination
            </p>
          </div>
          <Link
            to="/request-ride"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Request Ride
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label htmlFor="date-filter" className="sr-only">
              Select date
            </label>
            <input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Rides Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rides.map((ride, index) => (
          <motion.div
            key={ride.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {ride.destination}
                </h3>
                <p className="text-sm text-gray-600">by {ride.creator_name}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ride.status === "active"
                    ? "bg-green-100 text-green-800"
                    : ride.status === "full"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {ride.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {ride.pickup_location || "No pickup location specified"}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {ride.time_window_start} - {ride.time_window_end}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                {ride.participant_count}/{ride.max_seats} seats
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
                ride.status === "active" && (
                  <button
                    onClick={() => joinRide(ride.id)}
                    className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Join Ride
                  </button>
                )}
            </div>
          </motion.div>
        ))}
      </div>

      {rides.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-500 mb-4">
            <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No rides found</h3>
            <p className="text-sm">
              Try adjusting your search criteria or create a new ride
            </p>
          </div>
          <Link
            to="/request-ride"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
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
