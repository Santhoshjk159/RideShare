import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Users,
  FileText,
  Calendar,
  Car,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Search,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import logo from "../assets/images/ourlogo.png";
import FormView from "../components/FormView";

interface RideFormData {
  destination: string;
  pickupLocation: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  date: string;
  maxSeats: number;
  notes: string;
}

interface RideMatch {
  id: number;
  destination: string;
  pickup_location: string;
  time_window_start: string;
  time_window_end: string;
  date: string;
  max_seats: number;
  creator_name: string;
  creator_email: string;
  participant_count: number;
  notes: string;
}

type ViewState = "form" | "matches" | "waiting" | "success";

const RideRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("form");
  const [matches, setMatches] = useState<RideMatch[]>([]);
  const [currentRideId, setCurrentRideId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RideFormData>({
    destination: "",
    pickupLocation: "",
    timeWindowStart: "",
    timeWindowEnd: "",
    date: new Date().toISOString().split("T")[0],
    maxSeats: 6,
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<RideFormData>>({});
  const navigate = useNavigate();

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<RideFormData> = {};

    if (!formData.destination.trim()) {
      newErrors.destination = "Destination is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.timeWindowStart) {
      newErrors.timeWindowStart = "Start time is required";
    }
    if (!formData.timeWindowEnd) {
      newErrors.timeWindowEnd = "End time is required";
    }
    if (
      formData.timeWindowStart &&
      formData.timeWindowEnd &&
      formData.timeWindowStart >= formData.timeWindowEnd
    ) {
      newErrors.timeWindowEnd = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.post("/rides/match", formData);

        if (response.data.hasMatches) {
          // Found matches!
          setMatches(response.data.matches);
          setCurrentRideId(response.data.rideId);
          setViewState("matches");
          toast.success(response.data.message);
        } else {
          // No matches, waiting for others
          setCurrentRideId(response.data.rideId);
          setViewState("waiting");
          toast.success(response.data.message);
        }
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to process ride request";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, validateForm]
  );

  const handleJoinMatch = async (matchId: number) => {
    try {
      setIsLoading(true);
      await axios.post(`/rides/${matchId}/join-match`);
      toast.success("Successfully joined the ride!");
      setViewState("success");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to join ride";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCancel = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleInputChange = useCallback(
    (field: keyof RideFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleSearchMatches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/rides/match", formData);
      setMatches(response.data.matches);
      setViewState("matches");
    } catch (error) {
      toast.error("Failed to fetch matches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRide = async (rideId: number) => {
    setIsLoading(true);
    try {
      await axios.post(`/rides/${rideId}/book`);
      toast.success("Ride booked successfully!");
      setViewState("success");
    } catch (error) {
      toast.error("Failed to book ride");
    } finally {
      setIsLoading(false);
    }
  };

  // Matches View Component
  const MatchesView = ({
    matches,
    onJoinMatch,
    onBackToForm,
    isLoading,
    formatTime,
    formatDate,
  }: any) => (
    <motion.div
      key="matches"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Perfect Matches Found!
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          We found {matches.length} compatible ride
          {matches.length > 1 ? "s" : ""} for you
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4 mb-6">
        {matches.map((match: RideMatch) => (
          <div
            key={match.id}
            className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {match.destination}
                  </span>
                  {match.pickup_location && (
                    <span className="text-xs sm:text-sm text-gray-500">
                      from {match.pickup_location}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {formatTime(match.time_window_start)} -{" "}
                      {formatTime(match.time_window_end)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {match.participant_count}/{match.max_seats} seats
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs sm:text-sm">
                  <span className="text-gray-700">
                    Organized by <strong>{match.creator_name}</strong>
                  </span>
                  {match.notes && (
                    <p className="text-gray-600 mt-1 italic">"{match.notes}"</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onJoinMatch(match.id)}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Join Ride</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBackToForm}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium text-sm sm:text-base"
        >
          Back to Form
        </button>
      </div>
    </motion.div>
  );

  // Waiting View Component
  const WaitingView = ({
    formData,
    onBackToDashboard,
    formatTime,
    formatDate,
  }: any) => (
    <motion.div
      key="waiting"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-pulse">
            <Search className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Waiting for Friends...
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          We'll notify you as soon as someone with a matching ride joins!
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
          Your Ride Request
        </h3>
        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>
              <strong>Destination:</strong> {formData.destination}
            </span>
          </div>
          {formData.pickupLocation && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                <strong>Pickup:</strong> {formData.pickupLocation}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>
              <strong>Date:</strong> {formatDate(formData.date)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>
              <strong>Time:</strong> {formatTime(formData.timeWindowStart)} -{" "}
              {formatTime(formData.timeWindowEnd)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm text-blue-800">
            Scanning for compatible rides...
          </span>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse delay-1000"></div>
          <span className="text-xs sm:text-sm text-green-800">
            Ready to match with new ride requests
          </span>
        </div>
      </div>

      <button
        onClick={onBackToDashboard}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium text-sm sm:text-base"
      >
        Back to Dashboard
      </button>
    </motion.div>
  );

  // Success View Component
  const SuccessView = ({ onBackToDashboard, onViewRides }: any) => (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Ride Confirmed!
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          You've successfully joined the ride. Get ready for your journey!
        </p>
      </div>

      <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800 text-sm sm:text-base">
            What's Next?
          </span>
        </div>
        <ul className="text-xs sm:text-sm text-green-700 space-y-1">
          <li>• You'll receive contact information for coordination</li>
          <li>• Check your dashboard for ride details</li>
          <li>• Be ready at the pickup location on time</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onViewRides}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium text-sm sm:text-base"
        >
          View My Rides
        </button>
        <button
          onClick={onBackToDashboard}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium text-sm sm:text-base"
        >
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <img
                src={logo}
                alt="CampusCruze Logo"
                className="h-12 w-12 object-contain rounded-full border-2 border-blue-200"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CampusCruze
                </h1>
                <div className="flex items-center justify-center space-x-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    {viewState === "form" && "Find Your Perfect Ride"}
                    {viewState === "matches" && "Great Matches Found!"}
                    {viewState === "waiting" && "Waiting for Friends..."}
                    {viewState === "success" && "Ride Confirmed!"}
                  </span>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {viewState === "form" && (
            <FormView
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}

          {viewState === "matches" && (
            <MatchesView
              matches={matches}
              onJoinMatch={handleJoinMatch}
              onBackToForm={() => setViewState("form")}
              isLoading={isLoading}
              formatTime={formatTime}
              formatDate={formatDate}
            />
          )}

          {viewState === "waiting" && (
            <WaitingView
              formData={formData}
              onBackToDashboard={() => navigate("/dashboard")}
              formatTime={formatTime}
              formatDate={formatDate}
            />
          )}

          {viewState === "success" && (
            <SuccessView
              onBackToDashboard={() => navigate("/dashboard")}
              onViewRides={() => navigate("/dashboard")}
            />
          )}
        </AnimatePresence>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800 font-medium">
              Join the CampusCruze Community
            </p>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            By creating a ride, you're helping build a sustainable and connected
            campus community. Your contact information will be shared with ride
            participants for coordination.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RideRequest;
