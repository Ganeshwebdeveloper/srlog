import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trip, Vehicle, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended trip interface with vehicle details
interface TripWithDetails extends Trip {
  vehiclePlate?: string;
  progress?: number;
}

interface DriverPortalProps {
  driverName: string;
  driverId: string;
}

export default function DriverPortal({ driverName, driverId }: DriverPortalProps) {
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const { toast } = useToast();

  // Location tracking interval
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch driver's trips
  const { data: allTrips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
    refetchInterval: 5000 // Real-time updates
  });

  // Fetch vehicles for trip details
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles']
  });

  // Filter trips for current driver
  const driverTrips = allTrips.filter(trip => trip.driverId === driverId);
  const activeTrips = driverTrips.filter(trip => trip.status === 'assigned' || trip.status === 'in_progress');
  const completedTrips = driverTrips.filter(trip => trip.status === 'completed').slice(0, 5); // Last 5 completed

  // Create trips with vehicle details
  const tripsWithDetails: TripWithDetails[] = activeTrips.map(trip => {
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    
    // Calculate progress for in-progress trips
    let progress = 0;
    if (trip.status === 'in_progress' && trip.startTime) {
      const startTime = new Date(trip.startTime).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      // Assume 4 hours for a typical trip
      progress = Math.min(Math.round((elapsed / (4 * 60 * 60 * 1000)) * 100), 95);
    }
    
    return {
      ...trip,
      vehiclePlate: vehicle?.numberPlate || 'Unknown Vehicle',
      progress: trip.status === 'assigned' ? 0 : progress
    };
  });

  // Trip update mutation
  const updateTripMutation = useMutation({
    mutationFn: async ({ tripId, status, startTime, endTime }: { 
      tripId: string; 
      status: string; 
      startTime?: string; 
      endTime?: string; 
    }) => {
      const response = await apiRequest('PUT', `/api/trips/${tripId}`, {
        status,
        ...(startTime && { startTime }),
        ...(endTime && { endTime })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
    }
  });

  // Location update mutation
  const sendLocationMutation = useMutation({
    mutationFn: async ({ tripId, latitude, longitude }: {
      tripId: string;
      latitude: number;
      longitude: number;
    }) => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/locations`, {
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });
      return response.json();
    },
    onError: (error) => {
      console.error('Error sending location:', error);
    }
  });

  // Start location tracking
  const startLocationTracking = (tripId: string) => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location tracking",
        variant: "destructive"
      });
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition(position);
        // Send initial location
        sendLocationMutation.mutate({
          tripId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access to track your trip",
          variant: "destructive"
        });
      }
    );

    // Start periodic location updates every 30 seconds
    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition(position);
          sendLocationMutation.mutate({
            tripId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }, 30000); // Update every 30 seconds
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    setCurrentPosition(null);
  };

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

  const handleStartTrip = async (tripId: string) => {
    try {
      await updateTripMutation.mutateAsync({
        tripId,
        status: 'in_progress',
        startTime: new Date().toISOString()
      });
      setActiveTrip(tripId);
      setLocationSharing(true);
      
      // Start location tracking
      startLocationTracking(tripId);
      
      toast({
        title: "Trip started",
        description: "Location sharing is now active",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start trip",
        variant: "destructive"
      });
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    
    try {
      await updateTripMutation.mutateAsync({
        tripId: activeTrip,
        status: 'completed',
        endTime: new Date().toISOString()
      });
      
      // Stop location tracking
      stopLocationTracking();
      
      setActiveTrip(null);
      setLocationSharing(false);
      toast({
        title: "Trip completed",
        description: "Well done! Trip marked as completed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete trip",
        variant: "destructive"
      });
    }
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
            {tripsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : tripsWithDetails.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Route className="w-8 h-8 mx-auto mb-2" />
                <p>No active trips assigned</p>
                <p className="text-sm">Check back later for new assignments</p>
              </div>
            ) : (
              tripsWithDetails.map((trip, index) => (
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
                          {trip.vehiclePlate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {trip.createdAt ? new Date(trip.createdAt).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {trip.status.replace('_', ' ')}
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
                    {trip.startTime ? `Started: ${new Date(trip.startTime).toLocaleTimeString()}` : 'Not started yet'}
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
            ))
            )}
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
            {completedTrips.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p>No completed trips yet</p>
              </div>
            ) : (
              completedTrips.map((trip, index) => {
                const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                const completedTime = trip.endTime ? new Date(trip.endTime).toLocaleDateString() : 'Unknown';
                const duration = trip.startTime && trip.endTime 
                  ? `${Math.round((new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / (1000 * 60 * 60))}h`
                  : 'Unknown';
                
                return (
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
                          <span>{vehicle?.numberPlate || 'Unknown Vehicle'}</span>
                          <span>{completedTime}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{duration}</Badge>
                  </motion.div>
                );
              })
            )}
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