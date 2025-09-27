import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertTripSchema, insertLocationSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      if (driverId && typeof driverId === 'string') {
        trips = await storage.getTripsByDriver(driverId);
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
      let updateData: any = { ...validatedData };
      
      // Handle status changes that affect timestamps
      if (validatedData.status === 'in_progress' && !req.body.startTime) {
        updateData.startTime = new Date();
      } else if (validatedData.status === 'completed' && !req.body.endTime) {
        updateData.endTime = new Date();
      }
      
      const updatedTrip = await storage.updateTrip(req.params.id, updateData);
      
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
      // Get all locations from all trips for map display
      const allTrips = await storage.getTrips();
      const allLocations = [];
      
      for (const trip of allTrips) {
        const tripLocations = await storage.getLocationsByTrip(trip.id);
        allLocations.push(...tripLocations);
      }
      
      res.json(allLocations);
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
      const validatedData = insertLocationSchema.parse({
        ...req.body,
        tripId: req.params.tripId
      });
      
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

  const httpServer = createServer(app);

  return httpServer;
}
