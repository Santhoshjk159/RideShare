import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Users,
  Car,
  MapPin,
  TrendingUp,
  Calendar,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import toast from "react-hot-toast";

interface AdminStats {
  totalUsers: number;
  totalRides: number;
  activeRides: number;
  completedRides: number;
  topDestinations: Array<{ destination: string; count: number }>;
  ridesPerDay: Array<{ date: string; count: number }>;
}

interface RecentRide {
  id: number;
  destination: string;
  pickup_location: string;
  date: string;
  time_window_start: string;
  time_window_end: string;
  max_seats: number;
  current_seats: number;
  status: string;
  created_at: string;
  creator_name: string;
  creator_email: string;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  rides_created: number;
  rides_joined: number;
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch all data in parallel using axios
      const [statsResponse, ridesResponse, usersResponse] = await Promise.allSettled([
        axios.get("/admin/stats"),
        axios.get("/admin/recent-rides"),
        axios.get("/admin/recent-users"),
      ]);

      // Handle stats data
      if (statsResponse.status === "fulfilled") {
        setStats(statsResponse.value.data);
      } else {
        throw new Error("Failed to fetch admin stats");
      }

      // Handle recent rides data
      if (ridesResponse.status === "fulfilled") {
        setRecentRides(ridesResponse.value.data);
      }

      // Handle recent users data
      if (usersResponse.status === "fulfilled") {
        setRecentUsers(usersResponse.value.data);
      }
    } catch (error) {
      console.error("Admin data fetch error:", error);
      toast.error("Failed to load admin data");
      // Fallback to empty data if API fails
      const mockStats: AdminStats = {
        totalUsers: 0,
        totalRides: 0,
        activeRides: 0,
        completedRides: 0,
        topDestinations: [],
        ridesPerDay: [],
      };
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) return <div>Failed to load data</div>;

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Car className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRides}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Rides
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeRides}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedRides}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rides Per Day Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rides Per Day
            </h3>
            {stats.ridesPerDay.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No ride data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ridesPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Top Destinations Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Popular Destinations
            </h3>
            {stats.topDestinations.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No destination data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.topDestinations}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ destination, percent }) =>
                      `${destination} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.topDestinations.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Top Destinations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Top Destinations
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.topDestinations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No destination data available
              </div>
            ) : (
              stats.topDestinations.map((destination, index) => {
                const colorClass =
                  index === 0
                    ? "bg-green-500"
                    : index === 1
                    ? "bg-blue-500"
                    : index === 2
                    ? "bg-purple-500"
                    : index === 3
                    ? "bg-yellow-500"
                    : "bg-red-500";

                return (
                  <div
                    key={destination.destination}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${colorClass}`}
                      ></div>
                      <span className="font-medium text-gray-900">
                        {destination.destination}
                      </span>
                    </div>
                    <span className="text-gray-600 font-medium">
                      {destination.count} rides
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Recent Rides and Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Rides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Rides
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {recentRides.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recent rides found
                </div>
              ) : (
                recentRides.map((ride) => {
                  const statusColors: Record<string, string> = {
                    waiting: "bg-yellow-100 text-yellow-800",
                    active: "bg-blue-100 text-blue-800",
                    full: "bg-orange-100 text-orange-800",
                    completed: "bg-green-100 text-green-800",
                    cancelled: "bg-red-100 text-red-800"
                  };

                  return (
                    <div key={ride.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {ride.destination}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ride.status] || 'bg-gray-100 text-gray-800'}`}>
                              {ride.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            From: {ride.pickup_location || 'Not specified'}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            Creator: {ride.creator_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Seats: {ride.current_seats}/{ride.max_seats}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500 ml-4">
                          <p>{new Date(ride.date).toLocaleDateString()}</p>
                          <p>{ride.time_window_start} - {ride.time_window_end}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Recent Users
              </h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {recentUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recent users found
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Car className="h-3 w-3 mr-1" />
                            {user.rides_created} created
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {user.rides_joined} joined
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 ml-4">
                        <p>Joined</p>
                        <p>{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminDashboard;
