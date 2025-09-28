import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { Trip, Vehicle, User, Location } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Navigation, Clock, Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { useWebSocket } from "@/hooks/useWebSocket";
import "leaflet/dist/leaflet.css";

// Fix leaflet default markers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface TripWithDetails extends Trip {
  driverName?: string;
  vehiclePlate?: string;
  locations?: Location[];
}

interface LiveMapProps {
  selectedTripId?: string | null;
  onTripSelect?: (tripId: string) => void;
}

export default function LiveMap({ selectedTripId, onTripSelect }: LiveMapProps) {
  const [center, setCenter] = useState<LatLngTuple>([51.505, -0.09]); // Default to London
  const [realtimeLocations, setRealtimeLocations] = useState<Location[]>([]);
  const [realtimeTrips, setRealtimeTrips] = useState<Trip[]>([]);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage, sendMessage } = useWebSocket();

  // Fetch trips, vehicles, users, and locations
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

  // Fetch initial locations for active trips
  const { data: initialLocations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    refetchInterval: 10000 // Less frequent polling since we have WebSocket updates
  });

  // Handle real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'location_update' && lastMessage.data) {
      const newLocation = lastMessage.data as Location;
      setRealtimeLocations(prev => {
        // Accumulate location points for continuous tracking
        const filtered = prev.filter(loc => 
          loc.tripId !== newLocation.tripId || 
          (loc.timestamp && newLocation.timestamp && 
           new Date(loc.timestamp).getTime() !== new Date(newLocation.timestamp).getTime())
        );
        
        // Keep only last 50 points per trip to avoid memory issues
        const tripLocations = filtered.filter(loc => loc.tripId === newLocation.tripId);
        const otherLocations = filtered.filter(loc => loc.tripId !== newLocation.tripId);
        
        const updatedTripLocations = [...tripLocations, newLocation]
          .sort((a, b) => {
            const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return aTime - bTime;
          })
          .slice(-50); // Keep last 50 points
        
        return [...otherLocations, ...updatedTripLocations];
      });
    } else if (lastMessage?.type === 'trip_status_update' && lastMessage.data) {
      const updatedTrip = lastMessage.data as Trip;
      setRealtimeTrips(prev => {
        // Update trip in realtime trips or add it
        const filtered = prev.filter(trip => trip.id !== updatedTrip.id);
        return [...filtered, updatedTrip];
      });
    }
  }, [lastMessage]);

  // Combine initial locations with real-time updates
  const allLocations = [...initialLocations, ...realtimeLocations];

  // Combine initial trips with real-time updates
  const allTrips = [...trips];
  realtimeTrips.forEach(realtimeTrip => {
    const index = allTrips.findIndex(trip => trip.id === realtimeTrip.id);
    if (index >= 0) {
      allTrips[index] = realtimeTrip; // Replace with updated version
    } else {
      allTrips.push(realtimeTrip); // Add new trip
    }
  });

  // Create trip markers with details
  const tripsWithDetails: TripWithDetails[] = allTrips
    .filter(trip => trip.status === 'in_progress' || trip.status === 'assigned')
    .map(trip => {
      const driver = users.find(user => user.id === trip.driverId);
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      const tripLocations = allLocations.filter(loc => loc.tripId === trip.id);
      
      return {
        ...trip,
        driverName: driver?.name || 'Unknown Driver',
        vehiclePlate: vehicle?.numberPlate || 'Unknown Vehicle',
        locations: tripLocations
      };
    });

  // Generate demo locations for vehicles without real GPS data
  const generateDemoLocation = (index: number): LatLngTuple => {
    const baseLocations: LatLngTuple[] = [
      [51.515, -0.09],  // London area
      [51.525, -0.08],  // Slightly north
      [51.505, -0.07],  // Slightly east
      [51.495, -0.11],  // Southwest
      [51.535, -0.12],  // Northwest
    ];
    
    return baseLocations[index % baseLocations.length] || [51.505, -0.09];
  };

  // Custom vehicle icons
  const createVehicleIcon = (color: string, vehicleType: string) => {
    const iconHtml = `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        ${vehicleType === 'truck' || vehicleType === 'Truck' ? '🚚' : '🚐'}
      </div>
    `;
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
          <foreignObject width="30" height="30">
            ${iconHtml}
          </foreignObject>
        </svg>
      `),
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "#3b82f6"; // blue
      case "assigned": return "#eab308"; // yellow
      default: return "#6b7280"; // gray
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Vehicle markers */}
        {tripsWithDetails.map((trip, index) => {
          const vehicle = vehicles.find(v => v.id === trip.vehicleId);
          const hasRealLocation = trip.locations && trip.locations.length > 0;
          
          // Use real location if available, otherwise demo location
          const position: LatLngTuple = hasRealLocation
            ? [
                parseFloat(trip.locations![trip.locations!.length - 1].latitude),
                parseFloat(trip.locations![trip.locations!.length - 1].longitude)
              ]
            : generateDemoLocation(index);

          return (
            <Marker
              key={trip.id}
              position={position}
              icon={createVehicleIcon(
                getStatusColor(trip.status),
                vehicle?.type || 'van'
              )}
              eventHandlers={{
                click: () => onTripSelect?.(trip.id)
              }}
            >
              <Popup>
                <Card className="border-0 shadow-none min-w-[200px]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{trip.vehiclePlate}</span>
                      <Badge variant="secondary">{trip.status}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-3 h-3" />
                        <span>{trip.driverName}</span>
                      </div>
                      <div className="text-muted-foreground">
                        <div className="font-medium">Route:</div>
                        <div className="text-xs">{trip.route}</div>
                      </div>
                      {trip.startTime && (
                        <div className="flex items-center gap-2 pt-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            Started: {new Date(trip.startTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      {!hasRealLocation && (
                        <div className="text-xs text-muted-foreground italic">
                          Demo location - GPS data not available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}

        {/* Route polylines for trips with multiple locations */}
        {tripsWithDetails
          .filter(trip => trip.locations && trip.locations.length > 1)
          .map(trip => {
            const pathPositions: LatLngTuple[] = trip.locations!.map(loc => [
              parseFloat(loc.latitude),
              parseFloat(loc.longitude)
            ]);

            return (
              <Polyline
                key={`route-${trip.id}`}
                positions={pathPositions}
                pathOptions={{
                  color: getStatusColor(trip.status),
                  weight: 3,
                  opacity: 0.7,
                  dashArray: trip.status === 'assigned' ? '10, 10' : undefined
                }}
              />
            );
          })}
      </MapContainer>

      {/* WebSocket connection status */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 z-10"
      >
        <Card className="bg-background/90 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-2">
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
      </motion.div>

      {/* Map overlay info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 z-10"
      >
        <Card className="bg-background/90 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-3">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>In Progress ({allTrips.filter(t => t.status === 'in_progress').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Assigned ({allTrips.filter(t => t.status === 'assigned').length})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}