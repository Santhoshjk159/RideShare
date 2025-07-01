import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Users,
  MessageCircle,
  Send,
  UserX,
  ArrowLeft,
  Calendar,
  FileText,
} from "lucide-react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
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
  creator_name: string;
  creator_id: number;
  notes: string;
  participants: Array<{
    id: number;
    name: string;
    email: string;
    joined_at: string;
  }>;
  messages: Array<{
    id: number;
    message: string;
    user_name: string;
    user_id: number;
    created_at: string;
  }>;
}

function RideDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinRide, leaveRide, sendMessage } = useSocket();

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchRide();
    }
  }, [id]);

  useEffect(() => {
    if (ride && socket) {
      joinRide(ride.id.toString());
      setMessages(ride.messages || []);
    }

    return () => {
      if (ride && socket) {
        leaveRide(ride.id.toString());
      }
    };
  }, [ride, socket]);

  useEffect(() => {
    if (socket) {
      socket.on("newMessage", (messageData) => {
        setMessages((prev) => [...prev, messageData]);
      });

      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRide = async () => {
    try {
      const response = await axios.get(`/rides/${id}`);
      setRide(response.data.ride);
      setMessages(response.data.ride.messages || []);
    } catch (error) {
      toast.error("Failed to fetch ride details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && ride) {
      sendMessage(ride.id.toString(), newMessage.trim());
      setNewMessage("");
    }
  };

  const handleLeaveRide = async () => {
    if (!ride || !user) return;

    const confirmLeave = window.confirm(
      ride.creator_id === parseInt(user.id)
        ? "As the creator, leaving will cancel this ride for everyone. Are you sure?"
        : "Are you sure you want to leave this ride?"
    );

    if (confirmLeave) {
      try {
        await axios.post(`/rides/${ride.id}/leave`);
        toast.success("Successfully left the ride");
        navigate("/dashboard");
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to leave ride";
        toast.error(message);
      }
    }
  };

  const handleJoinRide = async () => {
    if (!ride) return;

    try {
      await axios.post(`/rides/${ride.id}/join`);
      toast.success("Successfully joined the ride!");
      fetchRide(); // Refresh ride details
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to join ride";
      toast.error(message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!ride) return <div>Ride not found</div>;

  const isParticipant =
    user && ride.participants.some((p) => p.id === parseInt(user.id));
  const canJoin = !isParticipant && ride.participants.length < ride.max_seats;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {ride.destination}
              </h1>
              <p className="text-gray-600">Created by {ride.creator_name}</p>
            </div>

            {isParticipant && (
              <button
                onClick={handleLeaveRide}
                className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <UserX className="h-4 w-4 mr-2" />
                Leave Ride
              </button>
            )}

            {canJoin && (
              <button
                onClick={handleJoinRide}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Join Ride
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">Pickup Location</p>
                  <p className="text-sm">
                    {ride.pickup_location || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm">
                    {new Date(ride.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">Time Window</p>
                  <p className="text-sm">
                    {ride.time_window_start} - {ride.time_window_end}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">
                    Participants ({ride.participants.length}/{ride.max_seats})
                  </p>
                  <div className="text-sm space-y-1">
                    {ride.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center">
                        <span
                          className={
                            participant.id === ride.creator_id
                              ? "font-medium"
                              : ""
                          }
                        >
                          {participant.name}
                          {participant.id === ride.creator_id && " (Creator)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {ride.notes && (
                <div className="flex items-start text-gray-700">
                  <FileText className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Notes</p>
                    <p className="text-sm">{ride.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Section */}
      {isParticipant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Group Chat
            </h2>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      isOwn
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1">
                        {message.user_name}
                      </p>
                    )}
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-primary-200" : "text-gray-500"
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                title="Send message"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default RideDetails;
