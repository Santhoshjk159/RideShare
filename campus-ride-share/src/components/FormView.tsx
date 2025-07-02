import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  FileText,
  Calendar,
  Search,
  Sparkles,
} from "lucide-react";

interface RideFormData {
  destination: string;
  pickupLocation: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  date: string;
  maxSeats: number;
  notes: string;
}

interface FormViewProps {
  formData: RideFormData;
  errors: Partial<RideFormData>;
  isLoading: boolean;
  onInputChange: (field: keyof RideFormData, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const FormView = React.memo(
  ({
    formData,
    errors,
    isLoading,
    onInputChange,
    onSubmit,
    onCancel,
  }: FormViewProps) => (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8"
    >
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label
            htmlFor="destination"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Destination *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              id="destination"
              value={formData.destination}
              onChange={(e) => onInputChange("destination", e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base appearance-none"
            >
              <option value="">Select your destination</option>
              <option value="NIT Back Gate">NIT Back Gate</option>
              <option value="NIT Front Gate">NIT Front Gate</option>
              <option value="Railway Station">Railway Station</option>
              <option value="Bus Stand">Bus Stand</option>
              <option value="Jio Mart">Jio Mart</option>
              <option value="GV Mall">GV Mall</option>
              <option value="Connplex Cinemas">Connplex Cinemas</option>
              <option value="Vijetha Mart">Vijetha Mart</option>
              <option value="Sri Ranga Mahal Theatre">
                Sri Ranga Mahal Theatre
              </option>
              <option value="Sri Seshmahal Theatre">
                Sri Seshmahal Theatre
              </option>
              <option value="Tadepalligudem Highway">
                Tadepalligudem Highway
              </option>
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {errors.destination && (
            <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="pickup"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Pickup Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="pickup"
              value={formData.pickupLocation}
              onChange={(e) => onInputChange("pickupLocation", e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
              placeholder="Where should riders meet you?"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="ride-date"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="ride-date"
              value={formData.date}
              onChange={(e) => onInputChange("date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start-time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="time"
                id="start-time"
                value={formData.timeWindowStart}
                onChange={(e) =>
                  onInputChange("timeWindowStart", e.target.value)
                }
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
              />
            </div>
            {errors.timeWindowStart && (
              <p className="mt-1 text-sm text-red-600">
                {errors.timeWindowStart}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="end-time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="time"
                id="end-time"
                value={formData.timeWindowEnd}
                onChange={(e) => onInputChange("timeWindowEnd", e.target.value)}
                min={formData.timeWindowStart}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
              />
            </div>
            {errors.timeWindowEnd && (
              <p className="mt-1 text-sm text-red-600">
                {errors.timeWindowEnd}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Additional Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => onInputChange("notes", e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white shadow-sm text-sm sm:text-base"
              placeholder="Any special instructions or preferences..."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Finding Matches...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Search className="h-4 w-4 mr-2" />
                Find My Ride
              </div>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <p className="text-xs sm:text-sm text-blue-800 font-medium">
            Smart Matching: We'll find rides with similar destinations and
            overlapping time windows!
          </p>
        </div>
      </div>
    </motion.div>
  )
);

FormView.displayName = "FormView";

export default FormView;
