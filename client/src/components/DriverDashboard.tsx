import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Trip, Vehicle, User } from "@shared/schema";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Car,
  Play,
  Pause,
  Square,
  Wifi,
  WifiOff
} from "lucide-react";
import { motion } from "framer-motion";

interface DriverDashboardProps {
  driverId?: string;
}

export default function DriverDashboard({ driverId }: DriverDashboardProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocket();

  // Mock driver ID for demo (in real app, this would come from auth)
  const currentDriverId = driverId || "9d3c029c-bea0-4e57-8e4c-9afd29620476"; // Sample driver ID

  // Fetch driver's assigned trips
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
    refetchInterval: 5000
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles']
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  // Get current driver's trips
  const driverTrips = trips.filter(trip => trip.driverId === currentDriverId);
  const activeTrip = driverTrips.find(trip => trip.status === 'assigned' || trip.status === 'in_progress');
  
  const driver = users.find(user => user.id === currentDriverId);
  const vehicle = activeTrip ? vehicles.find(v => v.id === activeTrip.vehicleId) : null;

  // Location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location not supported",
        description: "Your browser doesn't support geolocation."
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ latitude, longitude });

      // Send location update via WebSocket if trip is active
      if (activeTrip && isConnected) {
        sendMessage({
          type: 'location_update',
          payload: {
            tripId: activeTrip.id,
            latitude,
            longitude,
            driverId: currentDriverId
          }
        });
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
      toast({
        variant: "destructive",
        title: "Location error",
        description: "Failed to get your location. Please check permissions."
      });
    };

    const id = navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    setWatchId(id);
    setIsTracking(true);

    toast({
      title: "Location tracking started",
      description: "Your location is now being tracked."
    });
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast({
      title: "Location tracking stopped",
      description: "Location tracking has been disabled."
    });
  };

  const updateTripStatus = (status: 'in_progress' | 'completed') => {
    if (!activeTrip || !isConnected) return;

    sendMessage({
      type: 'trip_status_update',
      payload: {
        tripId: activeTrip.id,
        status,
        driverId: currentDriverId
      }
    });

    toast({
      title: "Trip status updated",
      description: `Trip marked as ${status.replace('_', ' ')}.`
    });

    // Auto-start tracking when trip starts
    if (status === 'in_progress' && !isTracking) {
      startLocationTracking();
    }

    // Stop tracking when trip completes
    if (status === 'completed' && isTracking) {
      stopLocationTracking();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Driver Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {driver?.name || 'Driver'}
          </p>
        </div>
        
        {/* Connection Status */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Disconnected</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Trip Card */}
      {activeTrip ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Active Trip
                  </CardTitle>
                  <CardDescription>
                    {vehicle?.numberPlate} • {vehicle?.type}
                  </CardDescription>
                </div>
                <Badge variant={activeTrip.status === 'in_progress' ? 'default' : 'secondary'}>
                  {activeTrip.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{activeTrip.route}</span>
              </div>
              
              {activeTrip.startTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Started: {new Date(activeTrip.startTime).toLocaleString()}
                  </span>
                </div>
              )}

              {currentLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {activeTrip.status === 'assigned' && (
                  <Button 
                    onClick={() => updateTripStatus('in_progress')}
                    disabled={!isConnected}
                    data-testid="button-start-trip"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Trip
                  </Button>
                )}
                
                {activeTrip.status === 'in_progress' && (
                  <Button 
                    onClick={() => updateTripStatus('completed')}
                    disabled={!isConnected}
                    data-testid="button-complete-trip"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Complete Trip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Trip</h3>
            <p className="text-muted-foreground">
              You don't have any assigned trips at the moment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Location Tracking Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Tracking
          </CardTitle>
          <CardDescription>
            Control your location sharing for real-time tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLocation && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Current Location:</p>
              <p className="text-sm text-muted-foreground">
                Lat: {currentLocation.latitude.toFixed(6)}, 
                Lng: {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {!isTracking ? (
              <Button 
                onClick={startLocationTracking}
                disabled={!activeTrip}
                data-testid="button-start-tracking"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={stopLocationTracking}
                data-testid="button-stop-tracking"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Tracking
              </Button>
            )}
          </div>
          
          {!activeTrip && (
            <p className="text-sm text-muted-foreground">
              Location tracking is only available when you have an active trip.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trip History */}
      {driverTrips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Your trip history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driverTrips.slice(0, 5).map((trip) => {
                const tripVehicle = vehicles.find(v => v.id === trip.vehicleId);
                return (
                  <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{trip.route}</p>
                      <p className="text-sm text-muted-foreground">
                        {tripVehicle?.numberPlate} • {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <Badge variant={
                      trip.status === 'completed' ? 'default' : 
                      trip.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {trip.status.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}