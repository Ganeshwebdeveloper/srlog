import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Play, 
  Square, 
  Route,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

//todo: remove mock functionality
const mockDriverTrips = [
  {
    id: "1",
    route: "Warehouse A → Customer Site",
    vehicle: "TRK-001",
    status: "assigned" as const,
    scheduledTime: "09:30 AM",
    estimatedDuration: "2h 30m",
    priority: "high" as const
  },
  {
    id: "2",
    route: "Distribution Center → Mall Plaza", 
    vehicle: "VAN-205",
    status: "in_progress" as const,
    scheduledTime: "10:15 AM",
    estimatedDuration: "1h 45m",
    priority: "medium" as const,
    startedAt: "10:20 AM",
    progress: 45
  }
];

const mockTripHistory = [
  {
    id: "h1",
    route: "Factory → Port Terminal",
    vehicle: "TRK-108",
    completedAt: "Yesterday 4:30 PM",
    duration: "3h 15m",
    status: "completed" as const
  },
  {
    id: "h2",
    route: "Retail Store → Warehouse B",
    vehicle: "VAN-301",
    completedAt: "Yesterday 1:45 PM",
    duration: "2h 10m",
    status: "completed" as const
  }
];

interface DriverPortalProps {
  driverName: string;
}

export default function DriverPortal({ driverName }: DriverPortalProps) {
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-yellow-500";
      case "in_progress": return "bg-blue-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const handleStartTrip = (tripId: string) => {
    setActiveTrip(tripId);
    setLocationSharing(true);
    console.log(`Started trip ${tripId} - Location sharing enabled`);
  };

  const handleEndTrip = () => {
    setActiveTrip(null);
    setLocationSharing(false);
    console.log('Trip ended - Location sharing disabled');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground"
        >
          Welcome back, {driverName}
        </motion.h1>
        <p className="text-muted-foreground mt-2">Your trips and assignments</p>
        {locationSharing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm mt-3"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Location sharing active
          </motion.div>
        )}
      </div>

      {/* Assigned Trips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
            <CardDescription>Your assigned and active trips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockDriverTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`p-4 rounded-lg border hover-elevate transition-all ${
                  activeTrip === trip.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border'
                }`}
                data-testid={`driver-trip-${trip.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(trip.status)}`} />
                    <div>
                      <h3 className="font-semibold">{trip.route}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Route className="w-3 h-3" />
                          {trip.vehicle}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {trip.scheduledTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(trip.priority)}>
                      {trip.priority} priority
                    </Badge>
                  </div>
                </div>

                {trip.status === "in_progress" && trip.progress && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{trip.progress}% complete</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${trip.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Est. duration: {trip.estimatedDuration}
                  </span>
                  
                  {trip.status === "assigned" ? (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartTrip(trip.id)}
                      data-testid={`button-start-trip-${trip.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Start Trip
                    </Button>
                  ) : trip.status === "in_progress" && activeTrip === trip.id ? (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={handleEndTrip}
                      data-testid={`button-end-trip-${trip.id}`}
                    >
                      <Square className="w-3 h-3 mr-1" />
                      End Trip
                    </Button>
                  ) : (
                    <Badge variant="secondary">
                      {trip.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Trip History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Your completed trip history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTripHistory.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover-elevate"
                data-testid={`history-trip-${trip.id}`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="font-medium">{trip.route}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{trip.vehicle}</span>
                      <span>{trip.completedAt}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{trip.duration}</Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Location Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    {locationSharing 
                      ? "Your location is being shared for active trip tracking"
                      : "Start a trip to enable location tracking"
                    }
                  </p>
                </div>
              </div>
              {locationSharing ? (
                <AlertCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}