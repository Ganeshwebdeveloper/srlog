import { type User, type InsertUser, type Vehicle, type InsertVehicle, type Trip, type InsertTrip, type Location, type InsertLocation } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;
  // Trip operations
  getTrips(): Promise<Trip[]>;
  getTripsByDriver(driverId: string): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: string): Promise<boolean>;
  // Location operations
  getLocationsByTrip(tripId: string): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vehicles: Map<string, Vehicle>;
  private trips: Map<string, Trip>;
  private locations: Map<string, Location>;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.trips = new Map();
    this.locations = new Map();
    
    // Initialize with sample data for testing
    this.initSampleData();
  }

  private async initSampleData() {
    // Create sample admin user (password: admin123)
    const adminUser: User = {
      id: randomUUID(),
      name: "John Admin",
      email: "admin@srlogistics.com",
      password: "$2b$10$ubTkp.g4BDWCejM.hf.63.zkn1Ap73pRxNO2LQvMpO6Yy9TgC0p9a", // bcrypt hash of "admin123"
      role: "admin",
      createdAt: new Date()
    };
    
    // Create sample driver user (password: driver123)
    const driverUser: User = {
      id: randomUUID(),
      name: "Mike Driver",
      email: "driver@srlogistics.com",
      password: "$2b$10$gAAttSPm6MVsQkKdlFqNUe6hRVjwuU3mqM2ens9UkyFKC7R1w3YzC", // bcrypt hash of "driver123"
      role: "driver",
      createdAt: new Date()
    };
    
    this.users.set(adminUser.id, adminUser);
    this.users.set(driverUser.id, driverUser);
    
    // Create sample vehicles
    const vehicle1: Vehicle = {
      id: randomUUID(),
      numberPlate: "TRK-001",
      type: "Truck",
      status: "available",
      createdAt: new Date()
    };
    
    const vehicle2: Vehicle = {
      id: randomUUID(),
      numberPlate: "VAN-205",
      type: "Van",
      status: "in_use",
      createdAt: new Date()
    };
    
    this.vehicles.set(vehicle1.id, vehicle1);
    this.vehicles.set(vehicle2.id, vehicle2);
    
    // Create sample trip
    const trip1: Trip = {
      id: randomUUID(),
      driverId: driverUser.id,
      vehicleId: vehicle2.id,
      route: "Warehouse A → Customer Site",
      status: "assigned",
      startTime: null,
      endTime: null,
      createdAt: new Date()
    };
    
    this.trips.set(trip1.id, trip1);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      role: insertUser.role as "admin" | "driver"
    };
    this.users.set(id, user);
    return user;
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id, 
      createdAt: new Date(),
      status: insertVehicle.status as "available" | "in_use" | "maintenance"
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle: Vehicle = { 
      ...vehicle, 
      ...updates,
      status: (updates.status || vehicle.status) as "available" | "in_use" | "maintenance"
    };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Trip operations
  async getTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values());
  }

  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.driverId === driverId);
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = randomUUID();
    const trip: Trip = { 
      ...insertTrip, 
      id, 
      createdAt: new Date(),
      startTime: null,
      endTime: null,
      status: insertTrip.status as "assigned" | "in_progress" | "completed" | "cancelled"
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: string, updates: Partial<InsertTrip & { startTime?: Date; endTime?: Date }>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip: Trip = { 
      ...trip, 
      ...updates,
      status: (updates.status || trip.status) as "assigned" | "in_progress" | "completed" | "cancelled"
    };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  async deleteTrip(id: string): Promise<boolean> {
    return this.trips.delete(id);
  }

  // Location operations
  async getLocationsByTrip(tripId: string): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(location => location.tripId === tripId);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const location: Location = { 
      ...insertLocation, 
      id, 
      timestamp: new Date()
    };
    this.locations.set(id, location);
    return location;
  }
}

export const storage = new MemStorage();
