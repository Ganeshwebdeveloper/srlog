import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { insertUserSchema, insertVehicleSchema, insertTripSchema, insertLocationSchema } from "../shared/schema.js";
import bcrypt from "bcrypt";

// WebSocket clients map to store active connections
const wsClients = new Map<string, any>();

// Extract common HTTP route registration logic that can be used both for serverless and full server
function registerHttpRoutes(app: Express): void {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const newUser = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }: any) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      let updateData: any = { ...validatedData };
      
      // Hash password if provided
      if (validatedData.password) {
        updateData.password = await bcrypt.hash(validatedData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error: any) {
      console.error("Get vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error: any) {
      console.error("Get vehicle error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const newVehicle = await storage.createVehicle(validatedData);
      res.status(201).json(newVehicle);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Create vehicle error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      const updatedVehicle = await storage.updateVehicle(req.params.id, validatedData);
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(updatedVehicle);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Update vehicle error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVehicle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json({ message: "Vehicle deleted successfully" });
    } catch (error: any) {
      console.error("Delete vehicle error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const { driverId } = req.query;
      let trips;
      
      if (driverId) {
        trips = await storage.getTripsByDriver(driverId as string);
      } else {
        trips = await storage.getTrips();
      }
      
      res.json(trips);
    } catch (error: any) {
      console.error("Get trips error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error: any) {
      console.error("Get trip error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      const validatedData = insertTripSchema.parse(req.body);
      const newTrip = await storage.createTrip(validatedData);
      res.status(201).json(newTrip);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Create trip error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    try {
      const validatedData = insertTripSchema.partial().parse(req.body);
      const updatedTrip = await storage.updateTrip(req.params.id, validatedData);
      
      if (!updatedTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(updatedTrip);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Update trip error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrip(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json({ message: "Trip deleted successfully" });
    } catch (error: any) {
      console.error("Delete trip error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Location tracking routes
  app.get("/api/locations", async (req, res) => {
    try {
      // If this endpoint should return all locations, it needs to be implemented in storage
      res.json([]);
    } catch (error: any) {
      console.error("Get all locations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/trips/:tripId/locations", async (req, res) => {
    try {
      const locations = await storage.getLocationsByTrip(req.params.tripId);
      res.json(locations);
    } catch (error: any) {
      console.error("Get locations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/trips/:tripId/locations", async (req, res) => {
    try {
      const locationData = {
        ...req.body,
        tripId: req.params.tripId
      };
      const validatedData = insertLocationSchema.parse(locationData);
      const newLocation = await storage.createLocation(validatedData);
      res.status(201).json(newLocation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Create location error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics route
  app.get("/api/analytics", async (req, res) => {
    try {
      const trips = await storage.getTrips();
      const vehicles = await storage.getVehicles();
      const drivers = await storage.getDrivers();

      // Calculate analytics
      const totalTrips = trips.length;
      const completedTrips = trips.filter(trip => trip.status === 'completed').length;
      const activeTrips = trips.filter(trip => trip.status === 'in_progress').length;
      const activeDrivers = drivers.filter(driver => driver.status === 'on_trip').length;
      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(vehicle => vehicle.status === 'in_use').length;

      // Calculate average trip duration for completed trips
      const completedTripsWithDuration = trips.filter(trip => 
        trip.status === 'completed' && trip.startTime && trip.endTime
      );
      const avgTripDuration = completedTripsWithDuration.length > 0
        ? completedTripsWithDuration.reduce((sum, trip) => {
            const duration = new Date(trip.endTime!).getTime() - new Date(trip.startTime!).getTime();
            return sum + (duration / (1000 * 60 * 60)); // Convert to hours
          }, 0) / completedTripsWithDuration.length
        : 0;

      // Calculate total distance from completed trips
      const totalDistance = trips.filter(trip => trip.status === 'completed').reduce((sum, trip) => {
        return sum + (parseFloat(trip.distance?.toString() || '0') || 0);
      }, 0);

      // Group trips by status for pie chart
      const tripsByStatus = {
        assigned: trips.filter(trip => trip.status === 'assigned').length,
        in_progress: trips.filter(trip => trip.status === 'in_progress').length,
        completed: trips.filter(trip => trip.status === 'completed').length,
        cancelled: trips.filter(trip => trip.status === 'cancelled').length,
      };

      // Get trips by day for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const tripsByDay = last7Days.map(day => ({
        date: day,
        trips: trips.filter(trip => {
          const tripDate = new Date(trip.createdAt || '').toISOString().split('T')[0];
          return tripDate === day;
        }).length
      }));

      // Driver performance data (trips per driver)
      const driverPerformance = drivers.map(driver => ({
        name: driver.name,
        trips: trips.filter(trip => trip.driverId === driver.id).length
      }));

      // Recent trips (last 10)
      const recentTrips = trips
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 10);

      const analyticsData = {
        totalTrips,
        completedTrips,
        activeTrips,
        activeDrivers,
        totalVehicles,
        activeVehicles,
        avgTripDuration,
        totalDistance,
        tripsByStatus,
        tripsByDay,
        driverPerformance,
        recentTrips
      };

      res.json(analyticsData);
    } catch (error: any) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Database statistics route
  app.get("/api/database/stats", async (req, res) => {
    try {
      const dbStats = await storage.getDatabaseStats();
      res.json(dbStats);
    } catch (error: any) {
      console.error("Database stats error:", error);
      res.status(500).json({ 
        message: "Failed to retrieve database statistics",
        error: error.message 
      });
    }
  });
}

// Serverless-compatible function that only registers API routes (no WebSocket)
export async function registerApiRoutes(app: Express): Promise<void> {
  registerHttpRoutes(app);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all HTTP routes (shared with serverless version)
  registerHttpRoutes(app);

  const httpServer = createServer(app);

  // Set up WebSocket server on the same HTTP server with path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  console.log(`WebSocket server running on /ws path`);
  
  wss.on('connection', (ws, request) => {
    const clientId = `client_${Date.now()}_${Math.random()}`;
    wsClients.set(clientId, ws);
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to SR Logistics location tracking'
    }));
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Message from ${clientId}:`, data);
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'location_update' && data.payload) {
          // Handle location updates from drivers
          const { tripId, latitude, longitude, driverId } = data.payload;
          
          // Basic authentication - verify the driver is assigned to this trip
          const trip = await storage.getTrip(tripId);
          if (!trip) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Trip not found'
            }));
            return;
          }
          
          if (trip.driverId !== driverId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: You can only update your own trips'
            }));
            return;
          }
          
          try {
            // Validate and save location to database
            const validatedLocation = insertLocationSchema.parse({
              tripId,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            });
            
            const newLocation = await storage.createLocation(validatedLocation);
            
            // Broadcast location update to all connected clients
            const locationUpdate = {
              type: 'location_update',
              data: newLocation
            };
            
            wsClients.forEach((client, id) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(locationUpdate));
              } else {
                // Remove disconnected clients
                wsClients.delete(id);
              }
            });
            
            console.log(`Location update broadcasted for trip ${tripId}`);
          } catch (locationError) {
            console.error('Error saving location:', locationError);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to save location update'
            }));
          }
        } else if (data.type === 'trip_status_update' && data.payload) {
          // Handle trip status updates
          const { tripId, status, driverId } = data.payload;
          
          // Basic authentication - verify the driver is assigned to this trip
          const trip = await storage.getTrip(tripId);
          if (!trip) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Trip not found'
            }));
            return;
          }
          
          if (trip.driverId !== driverId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: You can only update your own trips'
            }));
            return;
          }
          
          try {
            const updateData: any = { 
              status: status as "assigned" | "in_progress" | "completed" | "cancelled"
            };
            if (status === 'in_progress') {
              updateData.startTime = new Date();
            } else if (status === 'completed') {
              updateData.endTime = new Date();
            }
            
            const updatedTrip = await storage.updateTrip(tripId, updateData);
            
            if (updatedTrip) {
              // Automatically update vehicle and driver status based on trip status
              try {
                if (status === 'in_progress') {
                  // Update vehicle status to in_use
                  await storage.updateVehicle(updatedTrip.vehicleId, { status: 'in_use' });
                  // Update driver status to on_trip
                  await storage.updateUser(updatedTrip.driverId, { status: 'on_trip' });
                } else if (status === 'completed' || status === 'cancelled') {
                  // Update vehicle status to available
                  await storage.updateVehicle(updatedTrip.vehicleId, { status: 'available' });
                  // Update driver status to available
                  await storage.updateUser(updatedTrip.driverId, { status: 'available' });
                  // Delete all locations associated with the completed trip
                  await storage.deleteLocationsByTrip(updatedTrip.id);
                }
              } catch (statusUpdateError) {
                console.error("Error updating vehicle/driver status via WebSocket:", statusUpdateError);
                // Don't fail the trip update if status updates fail, just log the error
              }
              
              // Broadcast trip status update to all clients
              const statusUpdate = {
                type: 'trip_status_update',
                data: updatedTrip
              };
              
              wsClients.forEach((client, id) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(statusUpdate));
                } else {
                  wsClients.delete(id);
                }
              });
              
              console.log(`Trip status update broadcasted for trip ${tripId}: ${status}`);
            }
          } catch (tripError) {
            console.error('Error updating trip status:', tripError);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to update trip status'
            }));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId}`);
      wsClients.delete(clientId);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
      wsClients.delete(clientId);
    });
  });

  return httpServer;
}
