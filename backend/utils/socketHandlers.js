import { db } from "../server.js";

export const handleSocketConnection = (socket, io) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Get user ID from auth during connection
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} authenticated and joined user room`);
  } else {
    console.log(`❌ No userId in auth for socket ${socket.id}`);
  }

  // Store user ID with socket (alternative method)
  socket.on("authenticate", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`🔐 User ${userId} authenticated via event`);
  });

  // Join a ride room for chat
  socket.on("joinRide", async (rideId) => {
    try {
      // Verify user is part of this ride
      const [participants] = await db.execute(
        "SELECT user_id FROM ride_participants WHERE ride_id = ? AND user_id = ?",
        [rideId, socket.userId]
      );

      if (participants.length > 0) {
        socket.join(`ride_${rideId}`);
        socket.currentRide = rideId;

        // Notify others in the ride
        const [users] = await db.execute(
          "SELECT name FROM users WHERE id = ?",
          [socket.userId]
        );

        if (users.length > 0) {
          socket.to(`ride_${rideId}`).emit("userJoined", {
            userId: socket.userId,
            userName: users[0].name,
          });
        }
      }
    } catch (error) {
      console.error("Join ride error:", error);
    }
  });

  // Leave a ride room
  socket.on("leaveRide", async (rideId) => {
    socket.leave(`ride_${rideId}`);
    socket.currentRide = null;

    // Notify others in the ride
    try {
      const [users] = await db.execute("SELECT name FROM users WHERE id = ?", [
        socket.userId,
      ]);

      if (users.length > 0) {
        socket.to(`ride_${rideId}`).emit("userLeft", {
          userId: socket.userId,
          userName: users[0].name,
        });
      }
    } catch (error) {
      console.error("Leave ride error:", error);
    }
  });

  // Send chat message
  socket.on("sendMessage", async (data) => {
    const { rideId, message } = data;

    try {
      // Verify user is part of this ride
      const [participants] = await db.execute(
        "SELECT user_id FROM ride_participants WHERE ride_id = ? AND user_id = ?",
        [rideId, socket.userId]
      );

      if (participants.length === 0) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      // Save message to database
      const [result] = await db.execute(
        "INSERT INTO messages (ride_id, user_id, message, created_at) VALUES (?, ?, ?, NOW())",
        [rideId, socket.userId, message]
      );

      // Get user info
      const [users] = await db.execute("SELECT name FROM users WHERE id = ?", [
        socket.userId,
      ]);

      const messageData = {
        id: result.insertId,
        message,
        user_id: socket.userId,
        user_name: users[0].name,
        created_at: new Date(),
        ride_id: rideId,
      };

      // Broadcast message to all users in the ride
      io.to(`ride_${rideId}`).emit("newMessage", messageData);
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle ride updates
  socket.on("updateRide", async (data) => {
    const { rideId } = data;

    try {
      // Verify user is the creator of this ride
      const [rides] = await db.execute(
        "SELECT creator_id FROM rides WHERE id = ? AND creator_id = ?",
        [rideId, socket.userId]
      );

      if (rides.length > 0) {
        // Broadcast ride update to all participants
        io.to(`ride_${rideId}`).emit("rideUpdated", data);
      }
    } catch (error) {
      console.error("Update ride error:", error);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { rideId, isTyping } = data;
    socket.to(`ride_${rideId}`).emit("userTyping", {
      userId: socket.userId,
      isTyping,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    if (socket.currentRide) {
      socket.to(`ride_${socket.currentRide}`).emit("userLeft", {
        userId: socket.userId,
      });
    }
  });
};
