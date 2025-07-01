import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Car, LogOut, Star, Award, MapPin, Clock, Shield, Edit, Camera } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface UserStats {
  createdRides: number;
  joinedRides: number;
  completedRides: number;
  totalRides: number;
}

interface RideHistory {
  id: number;
  destination: string;
  date: string;
  participation_type: "created" | "joined";
  status: string;
}

function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [statsResponse, profileResponse] = await Promise.all([
        axios.get("/users/stats"),
        axios.get("/users/profile"),
      ]);

      setStats(statsResponse.data);
      setRideHistory(profileResponse.data.rideHistory);
    } catch (error) {
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 rounded-full p-4">
              <User className="h-12 w-12 text-primary-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                Member since {new Date().toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <Car className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.createdRides}
              </div>
              <div className="text-sm text-gray-600">Rides Created</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.joinedRides}
              </div>
              <div className="text-sm text-gray-600">Rides Joined</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.completedRides}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <Car className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalRides}
              </div>
              <div className="text-sm text-gray-600">Total Rides</div>
            </div>
          </div>
        )}

        {/* Ride History */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Ride History
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {rideHistory.length > 0 ? (
              rideHistory.map((ride) => (
                <div
                  key={ride.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {ride.destination}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(ride.date).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ride.participation_type === "created"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {ride.participation_type === "created"
                            ? "Created"
                            : "Joined"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ride.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : ride.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : ride.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {ride.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No ride history yet</p>
                <p className="text-sm">Start by creating or joining a ride!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;
