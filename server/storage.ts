import { type User, type InsertUser, type Vehicle, type InsertVehicle, type Trip, type InsertTrip, type Location, type InsertLocation, users, vehicles, trips, locations } from "@shared/schema";
import { randomUUID } from "crypto";
import { db, initializeDatabase } from "./db";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getDrivers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
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
  // Database statistics operations
  getDatabaseStats(): Promise<{
    tables: Array<{
      name: string;
      rowCount: number;
      sizeBytes: number;
      sizeMB: number;
      lastUpdated: string;
    }>;
    totalSize: number;
    totalSizeMB: number;
    totalRecords: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    connectionCount: number;
    queryCount: number;
    healthStatus: 'healthy' | 'warning' | 'critical';
  }>;
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
      model: "Volvo FH16",
      year: "2023",
      fuelType: "diesel",
      capacity: "25000",
      mileage: "85000",
      createdAt: new Date()
    };
    
    const vehicle2: Vehicle = {
      id: randomUUID(),
      numberPlate: "VAN-205",
      type: "Van",
      status: "in_use",
      model: "Mercedes Sprinter",
      year: "2022",
      fuelType: "diesel",
      capacity: "3500",
      mileage: "45000",
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
      startLocation: "Warehouse A",
      endLocation: "Customer Site",
      distance: "45.5",
      estimatedDuration: "2.5",
      fuelConsumed: null,
      driverWage: "1500.00",
      priority: "medium",
      notes: "Standard delivery",
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

  async getDrivers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === 'driver');
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

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { 
      ...user, 
      ...updates,
      role: (updates.role || user.role) as "admin" | "driver"
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
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
      id, 
      createdAt: new Date(),
      numberPlate: insertVehicle.numberPlate,
      type: insertVehicle.type,
      status: insertVehicle.status as "available" | "in_use" | "maintenance",
      model: insertVehicle.model || null,
      year: insertVehicle.year || null,
      fuelType: insertVehicle.fuelType as "diesel" | "petrol" | "electric" | "hybrid" | null,
      capacity: insertVehicle.capacity || null,
      mileage: insertVehicle.mileage || null
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
      status: (updates.status || vehicle.status) as "available" | "in_use" | "maintenance",
      fuelType: (updates.fuelType || vehicle.fuelType) as "diesel" | "petrol" | "electric" | "hybrid" | null
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
      id, 
      createdAt: new Date(),
      driverId: insertTrip.driverId,
      vehicleId: insertTrip.vehicleId,
      route: insertTrip.route,
      status: insertTrip.status as "assigned" | "in_progress" | "completed" | "cancelled",
      startLocation: insertTrip.startLocation || null,
      endLocation: insertTrip.endLocation || null,
      distance: insertTrip.distance || null,
      estimatedDuration: insertTrip.estimatedDuration || null,
      fuelConsumed: insertTrip.fuelConsumed || null,
      driverWage: insertTrip.driverWage || null,
      priority: (insertTrip.priority || "medium") as "low" | "medium" | "high" | "urgent",
      notes: insertTrip.notes || null,
      startTime: null,
      endTime: null
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
      status: (updates.status || trip.status) as "assigned" | "in_progress" | "completed" | "cancelled",
      priority: (updates.priority || trip.priority) as "low" | "medium" | "high" | "urgent"
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
      id, 
      tripId: insertLocation.tripId,
      latitude: insertLocation.latitude,
      longitude: insertLocation.longitude,
      altitude: insertLocation.altitude || null,
      speed: insertLocation.speed || null,
      heading: insertLocation.heading || null,
      accuracy: insertLocation.accuracy || null,
      timestamp: new Date()
    };
    this.locations.set(id, location);
    return location;
  }

  async getDatabaseStats() {
    // Calculate mock statistics for in-memory storage
    const usersCount = this.users.size;
    const vehiclesCount = this.vehicles.size;
    const tripsCount = this.trips.size;
    const locationsCount = this.locations.size;

    const tables = [
      {
        name: 'users',
        rowCount: usersCount,
        sizeBytes: usersCount * 200, // estimated bytes per record
        sizeMB: (usersCount * 200) / (1024 * 1024),
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'vehicles',
        rowCount: vehiclesCount,
        sizeBytes: vehiclesCount * 300,
        sizeMB: (vehiclesCount * 300) / (1024 * 1024),
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'trips',
        rowCount: tripsCount,
        sizeBytes: tripsCount * 400,
        sizeMB: (tripsCount * 400) / (1024 * 1024),
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'locations',
        rowCount: locationsCount,
        sizeBytes: locationsCount * 150,
        sizeMB: (locationsCount * 150) / (1024 * 1024),
        lastUpdated: new Date().toISOString()
      }
    ];

    const totalRecords = usersCount + vehiclesCount + tripsCount + locationsCount;
    const totalSize = tables.reduce((sum, table) => sum + table.sizeBytes, 0);
    const totalSizeMB = totalSize / (1024 * 1024);

    // Mock memory usage (for demonstration)
    const memoryUsed = totalSize;
    const memoryTotal = 50 * 1024 * 1024; // 50MB mock limit
    const memoryPercentage = Math.min((memoryUsed / memoryTotal) * 100, 100);

    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (memoryPercentage > 80) healthStatus = 'critical';
    else if (memoryPercentage > 60) healthStatus = 'warning';

    return {
      tables,
      totalSize,
      totalSizeMB,
      totalRecords,
      memoryUsage: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: Math.round(memoryPercentage)
      },
      connectionCount: 1, // In-memory has single connection
      queryCount: totalRecords * 2, // Mock query count
      healthStatus
    };
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getDrivers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'driver'));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values([{
      ...insertUser,
      role: insertUser.role as "admin" | "driver"
    }]).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates as any)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(vehicles).values([{
      ...insertVehicle,
      status: insertVehicle.status as "available" | "in_use" | "maintenance"
    }]).returning();
    return result[0];
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles)
      .set(updates as any)
      .where(eq(vehicles.id, id))
      .returning();
    return result[0];
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }

  // Trip operations
  async getTrips(): Promise<Trip[]> {
    return await db.select().from(trips);
  }

  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.driverId, driverId));
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
    return result[0];
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const result = await db.insert(trips).values([{
      ...insertTrip,
      status: insertTrip.status as "assigned" | "in_progress" | "completed" | "cancelled"
    }]).returning();
    return result[0];
  }

  async updateTrip(id: string, updates: Partial<InsertTrip & { startTime?: Date; endTime?: Date }>): Promise<Trip | undefined> {
    const result = await db.update(trips)
      .set(updates as any)
      .where(eq(trips.id, id))
      .returning();
    return result[0];
  }

  async deleteTrip(id: string): Promise<boolean> {
    try {
      // First delete all locations associated with this trip
      await db.delete(locations).where(eq(locations.tripId, id));
      
      // Then delete the trip itself
      const result = await db.delete(trips).where(eq(trips.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  // Location operations
  async getLocationsByTrip(tripId: string): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.tripId, tripId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values([insertLocation]).returning();
    return result[0];
  }

  async getDatabaseStats() {
    try {
      // Get row counts for each table
      const usersCount = await db.select({ count: sql`count(*)` }).from(users);
      const vehiclesCount = await db.select({ count: sql`count(*)` }).from(vehicles);
      const tripsCount = await db.select({ count: sql`count(*)` }).from(trips);
      const locationsCount = await db.select({ count: sql`count(*)` }).from(locations);

      // PostgreSQL table size queries - using a safer approach
      let tableSizeData: any[] = [];
      try {
        const tableSizes = await db.execute(sql`
          SELECT 
            schemaname as schema_name,
            tablename as table_name,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
            pg_total_relation_size(schemaname||'.'||tablename)/(1024*1024) as size_mb
          FROM pg_tables 
          WHERE schemaname = 'public'
          AND tablename IN ('users', 'vehicles', 'trips', 'locations')
        `);
        
        // Handle different result structures (rows property vs direct array)
        tableSizeData = tableSizes.rows || tableSizes || [];
      } catch (error) {
        console.error('Error getting table sizes:', error);
        tableSizeData = [];
      }

      const findTableSize = (tableName: string) => {
        const tableData = tableSizeData.find((t: any) => t.table_name === tableName);
        return {
          sizeBytes: Number(tableData?.size_bytes || 0),
          sizeMB: Number(tableData?.size_mb || 0)
        };
      };

      const tables = [
        {
          name: 'users',
          rowCount: Number(usersCount[0]?.count || 0),
          ...findTableSize('users'),
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'vehicles',
          rowCount: Number(vehiclesCount[0]?.count || 0),
          ...findTableSize('vehicles'),
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'trips',
          rowCount: Number(tripsCount[0]?.count || 0),
          ...findTableSize('trips'),
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'locations',
          rowCount: Number(locationsCount[0]?.count || 0),
          ...findTableSize('locations'),
          lastUpdated: new Date().toISOString()
        }
      ];

      const totalRecords = tables.reduce((sum, table) => sum + table.rowCount, 0);
      const totalSize = tables.reduce((sum, table) => sum + table.sizeBytes, 0);
      const totalSizeMB = totalSize / (1024 * 1024);

      // Get database connection and activity stats
      let connectionCount = 1;
      try {
        const dbStats = await db.execute(sql`
          SELECT 
            (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
            (SELECT sum(numbackends) FROM pg_stat_database) as total_connections
        `);
        
        // Handle different result structures (rows property vs direct array)
        const statsData = dbStats.rows || dbStats || [];
        connectionCount = Number(statsData[0]?.active_connections || 1);
      } catch (error) {
        console.error('Error getting connection stats:', error);
        connectionCount = 1;
      }
      
      // Memory usage (mock for demonstration - real implementation would need system queries)
      const memoryUsed = totalSize;
      const memoryTotal = 100 * 1024 * 1024; // 100MB mock limit
      const memoryPercentage = Math.min((memoryUsed / memoryTotal) * 100, 100);

      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (memoryPercentage > 80) healthStatus = 'critical';
      else if (memoryPercentage > 60) healthStatus = 'warning';

      return {
        tables,
        totalSize,
        totalSizeMB,
        totalRecords,
        memoryUsage: {
          used: memoryUsed,
          total: memoryTotal,
          percentage: Math.round(memoryPercentage)
        },
        connectionCount,
        queryCount: totalRecords * 3, // Mock query count
        healthStatus
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      // Return fallback stats if database queries fail
      return {
        tables: [],
        totalSize: 0,
        totalSizeMB: 0,
        totalRecords: 0,
        memoryUsage: {
          used: 0,
          total: 100 * 1024 * 1024,
          percentage: 0
        },
        connectionCount: 0,
        queryCount: 0,
        healthStatus: 'critical' as const
      };
    }
  }
}

// Initialize sample data for demonstration
async function initSampleData() {
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Sample data already exists, skipping initialization");
      return;
    }

    console.log("Initializing sample data...");

    // Create sample admin user (password: admin123)
    const adminUser = await db.insert(users).values([{
      name: "John Admin",
      email: "admin@srlogistics.com",
      password: "$2b$10$ubTkp.g4BDWCejM.hf.63.zkn1Ap73pRxNO2LQvMpO6Yy9TgC0p9a", // bcrypt hash of "admin123"
      role: "admin" as const
    }]).returning();
    
    // Create sample driver user (password: driver123)
    const driverUser = await db.insert(users).values([{
      name: "Mike Driver",
      email: "driver@srlogistics.com",
      password: "$2b$10$gAAttSPm6MVsQkKdlFqNUe6hRVjwuU3mqM2ens9UkyFKC7R1w3YzC", // bcrypt hash of "driver123"
      role: "driver" as const
    }]).returning();
    
    // Create sample vehicles
    const vehicle1 = await db.insert(vehicles).values([{
      numberPlate: "TRK-001",
      type: "Truck",
      status: "available" as const
    }]).returning();
    
    const vehicle2 = await db.insert(vehicles).values([{
      numberPlate: "VAN-205",
      type: "Van",
      status: "in_use" as const
    }]).returning();
    
    // Create sample trip
    await db.insert(trips).values([{
      driverId: driverUser[0].id,
      vehicleId: vehicle2[0].id,
      route: "Warehouse A → Customer Site",
      status: "assigned" as const
    }]);

    console.log("Sample data initialized successfully");
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
}

// Initialize storage with proper database connectivity check
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  const dbConnection = await initializeDatabase();
  
  if (dbConnection) {
    console.log("Using database storage");
    storage = new DatabaseStorage();
    // Initialize sample data for database
    try {
      await initSampleData();
    } catch (error) {
      console.error("Failed to initialize sample data, falling back to in-memory storage:", error);
      storage = new MemStorage();
    }
  } else {
    console.log("Using in-memory storage");
    storage = new MemStorage();
  }
  
  return storage;
}

// Initialize storage asynchronously but export synchronously for compatibility
storage = new MemStorage(); // Default fallback

initializeStorage().then((initializedStorage) => {
  storage = initializedStorage;
}).catch((error) => {
  console.error("Storage initialization failed, using in-memory storage:", error);
  storage = new MemStorage();
});

export { storage };
