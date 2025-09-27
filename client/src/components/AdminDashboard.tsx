import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Activity,
  Plus,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

//todo: remove mock functionality
const mockStats = {
  totalVehicles: 24,
  activeDrivers: 18,
  activeTrips: 12,
  completedToday: 8
};

const mockActiveTrips = [
  {
    id: "1",
    driver: "John Smith",
    vehicle: "TRK-001",
    route: "Warehouse A → Customer Site",
    status: "in_progress" as const,
    startTime: "09:30 AM",
    progress: 65
  },
  {
    id: "2", 
    driver: "Sarah Johnson",
    vehicle: "VAN-205",
    route: "Distribution Center → Mall Plaza",
    status: "in_progress" as const,
    startTime: "10:15 AM",
    progress: 30
  },
  {
    id: "3",
    driver: "Mike Wilson",
    vehicle: "TRK-108",
    route: "Factory → Port Terminal",
    status: "in_progress" as const,
    startTime: "08:45 AM",
    progress: 85
  }
];

interface AdminDashboardProps {
  onManageDrivers: () => void;
  onManageVehicles: () => void;
  onManageTrips: () => void;
}

export default function AdminDashboard({ 
  onManageDrivers, 
  onManageVehicles, 
  onManageTrips 
}: AdminDashboardProps) {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "assigned": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Fleet operations overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={onManageTrips} data-testid="button-new-trip">
            <Plus className="w-4 h-4 mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover-elevate cursor-pointer" onClick={onManageVehicles} data-testid="card-vehicles">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalVehicles}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2 this month
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover-elevate cursor-pointer" onClick={onManageDrivers} data-testid="card-drivers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeDrivers}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Activity className="w-3 h-3 mr-1" />
                Currently online
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover-elevate" data-testid="card-active-trips">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeTrips}</div>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                In progress
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="hover-elevate" data-testid="card-completed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.completedToday}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3 from yesterday
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Trips & Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Trips */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Active Trips</CardTitle>
              <CardDescription>Real-time trip monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActiveTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`p-4 rounded-lg border hover-elevate cursor-pointer transition-all ${
                    selectedTrip === trip.id ? 'ring-2 ring-primary border-primary' : 'border-border'
                  }`}
                  onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
                  data-testid={`trip-${trip.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(trip.status)}`} />
                      <span className="font-medium">{trip.driver}</span>
                    </div>
                    <Badge variant="secondary">{trip.vehicle}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{trip.route}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Started: {trip.startTime}</span>
                    <span className="text-xs font-medium">{trip.progress}% complete</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${trip.progress}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Map Placeholder */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Live Fleet Map</CardTitle>
              <CardDescription>Real-time vehicle locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg" />
                
                {/* Mock map pins */}
                <div className="absolute top-8 left-8">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg animate-pulse" />
                  <div className="text-xs font-medium mt-1">TRK-001</div>
                </div>
                <div className="absolute top-16 right-12">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse" />
                  <div className="text-xs font-medium mt-1">VAN-205</div>
                </div>
                <div className="absolute bottom-12 left-16">
                  <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg animate-pulse" />
                  <div className="text-xs font-medium mt-1">TRK-108</div>
                </div>
                
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Interactive map integration</p>
                  <p className="text-xs">Real-time vehicle tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}