import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

interface SocketContextType {
  socket: Socket | null;
  joinRide: (rideId: string) => void;
  leaveRide: (rideId: string) => void;
  sendMessage: (rideId: string, message: string) => void;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | null>(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log(`🔌 Connecting to socket with user:`, user.id);

      const newSocket = io(SOCKET_URL, {
        auth: {
          userId: user.id,
        },
        transports: ["websocket", "polling"], // Allow fallback to polling
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to server");
        // Ensure authentication
        newSocket.emit("authenticate", user.id);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from server:", reason);
      });

      newSocket.on("connect_error", (error) => {
        console.error("🔥 Socket connection error:", error);
      });

      newSocket.on("userJoined", (data) => {
        toast.success(`${data.userName} joined the ride`);
      });

      newSocket.on("userLeft", (data) => {
        toast(`${data.userName} left the ride`, { icon: "👋" });
      });

      newSocket.on("newMessage", (_data) => {
        // Handle new message - will be used in RideDetails component
      });

      newSocket.on("rideUpdated", (_data) => {
        toast.success("Ride information updated");
      });

      newSocket.on("onlineUsers", (users) => {
        setOnlineUsers(users);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user]);

  const joinRide = (rideId: string) => {
    if (socket) {
      socket.emit("joinRide", rideId);
    }
  };

  const leaveRide = (rideId: string) => {
    if (socket) {
      socket.emit("leaveRide", rideId);
    }
  };

  const sendMessage = (rideId: string, message: string) => {
    if (socket) {
      socket.emit("sendMessage", { rideId, message });
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, joinRide, leaveRide, sendMessage, onlineUsers }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
