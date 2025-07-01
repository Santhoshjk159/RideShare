import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, FileText, Calendar, Car } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center space-x-6 mb-4">
              <div className="flex flex-col items-center">
                <img 
                  src="https://nitandhra.ac.in/main/assets/images/logo_nitanp.webp" 
                  alt="NIT Andhra Pradesh" 
                  className="h-12 w-12 object-contain"
                />
                <span className="text-xs text-gray-600 mt-1">NIT AP</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-blue-600 font-medium mt-1">CampusCruze</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Request a Ride
            </h1>
            <p className="text-gray-600 mt-2">
              Create a new ride or join an existing one on campus
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-8">
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white"
                    placeholder="Any special instructions or preferences..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Ride...
                  </div>
                ) : (
                  'Create CampusCruze Ride'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By creating a ride, you agree to share contact information with other participants
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideRequest;
