import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, FileText, Calendar, Car, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

interface RideFormData {
  destination: string;
  pickupLocation: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  date: string;
  maxSeats: number;
  notes: string;
}

const RideRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RideFormData>({
    destination: '',
    pickupLocation: '',
    timeWindowStart: '',
    timeWindowEnd: '',
    date: new Date().toISOString().split('T')[0],
    maxSeats: 4,
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<RideFormData>>({});
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Partial<RideFormData> = {};

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.timeWindowStart) {
      newErrors.timeWindowStart = 'Start time is required';
    }
    if (!formData.timeWindowEnd) {
      newErrors.timeWindowEnd = 'End time is required';
    }
    if (formData.timeWindowStart && formData.timeWindowEnd && 
        formData.timeWindowStart >= formData.timeWindowEnd) {
      newErrors.timeWindowEnd = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/rides', formData);
      toast.success('Ride created successfully!');
      navigate(`/ride/${response.data.ride.id}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('A matching ride already exists. Check existing rides!');
        navigate('/dashboard');
      } else {
        const message = error.response?.data?.message || 'Failed to create ride';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RideFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <img 
                src="/src/assets/images/ourlogo.png" 
                alt="CampusCruze Logo" 
                className="h-12 w-12 object-contain"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CampusCruze
                </h1>
                <div className="flex items-center justify-center space-x-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Create Your Ride</span>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                Destination *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="Where are you going?"
                />
              </div>
              {errors.destination && (
                <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
              )}
            </div>

            <div>
              <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="pickup"
                  value={formData.pickupLocation}
                  onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  placeholder="Where should riders meet you?"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ride-date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="ride-date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    id="start-time"
                    value={formData.timeWindowStart}
                    onChange={(e) => handleInputChange('timeWindowStart', e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
                {errors.timeWindowStart && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeWindowStart}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    id="end-time"
                    value={formData.timeWindowEnd}
                    onChange={(e) => handleInputChange('timeWindowEnd', e.target.value)}
                    min={formData.timeWindowStart}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
                {errors.timeWindowEnd && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeWindowEnd}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="max-seats" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Seats
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  id="max-seats"
                  value={formData.maxSeats}
                  onChange={(e) => handleInputChange('maxSeats', parseInt(e.target.value))}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm appearance-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} seat{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white shadow-sm"
                  placeholder="Any special instructions or preferences..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Ride'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">
                Join the CampusCruze Community
              </p>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              By creating a ride, you're helping build a sustainable and connected campus community. 
              Your contact information will be shared with ride participants for coordination.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RideRequest;
