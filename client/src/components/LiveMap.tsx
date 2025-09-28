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

  // Create custom truck SVG icons
  const createTruckIcon = (color: string, vehicleType: string, driverName: string, isSelected: boolean = false) => {
    const truckSvg = vehicleType === 'truck' || vehicleType === 'Truck' ? `
      <!-- Truck Body -->
      <path d="M4 18H2V16C2 14.9 2.9 14 4 14H6V18Z" fill="${color}"/>
      <path d="M6 14H20V18H18C18 19.1 17.1 20 16 20S14 19.1 14 18H10C10 19.1 9.1 20 8 20S6 19.1 6 18Z" fill="${color}"/>
      <path d="M20 14V10C20 8.9 19.1 8 18 8H14V14H20Z" fill="${color}"/>
      <!-- Truck Cab -->
      <path d="M6 8V14H14V8C14 6.9 13.1 6 12 6H8C6.9 6 6 6.9 6 8Z" fill="${color}"/>
      <!-- Wheels -->
      <circle cx="8" cy="18" r="1.5" fill="#333"/>
      <circle cx="16" cy="18" r="1.5" fill="#333"/>
      <!-- Highlights -->
      <path d="M7 9H13V11H7Z" fill="rgba(255,255,255,0.3)"/>
      <path d="M15 10H19V12H15Z" fill="rgba(255,255,255,0.3)"/>
    ` : `
      <!-- Van Body -->
      <path d="M4 18H2V12C2 10.9 2.9 10 4 10H20C21.1 10 22 10.9 22 12V18H20C20 19.1 19.1 20 18 20S16 19.1 16 18H8C8 19.1 7.1 20 6 20S4 19.1 4 18Z" fill="${color}"/>
      <!-- Van Windows -->
      <path d="M5 7C5 5.9 5.9 5 7 5H17C18.1 5 19 5.9 19 7V10H5V7Z" fill="${color}"/>
      <!-- Wheels -->
      <circle cx="6" cy="18" r="1.5" fill="#333"/>
      <circle cx="18" cy="18" r="1.5" fill="#333"/>
      <!-- Windshield -->
      <path d="M6 6H18V8H6Z" fill="rgba(255,255,255,0.4)"/>
      <!-- Side Windows -->
      <path d="M6 8H10V10H6Z" fill="rgba(255,255,255,0.3)"/>
      <path d="M14 8H18V10H14Z" fill="rgba(255,255,255,0.3)"/>
    `;

    const iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          ${truckSvg}
        </g>
        ${isSelected ? `
          <circle cx="12" cy="12" r="11" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>
          <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2"/>
        ` : ''}
      </svg>
    `;
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(iconSvg),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: isSelected ? 'selected-vehicle-marker' : 'vehicle-marker'
    });
  };

  // Create hover tooltip component
  const createHoverTooltip = (trip: TripWithDetails, vehicle: Vehicle | undefined) => {
    return `
      <div style="
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 200px;
        z-index: 1000;
        pointer-events: none;
      ">
        <div style="font-weight: bold; margin-bottom: 4px;">
          ${trip.driverName}
        </div>
        <div style="opacity: 0.9; margin-bottom: 2px;">
          ${trip.vehiclePlate}
        </div>
        <div style="opacity: 0.8; font-size: 11px;">
          Status: ${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </div>
        <div style="opacity: 0.8; font-size: 11px;">
          ${trip.route.length > 30 ? trip.route.substring(0, 30) + '...' : trip.route}
        </div>
      </div>
    `;
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
              icon={createTruckIcon(
                getStatusColor(trip.status),
                vehicle?.type || 'van',
                trip.driverName || 'Unknown Driver',
                selectedTripId === trip.id
              )}
              eventHandlers={{
                click: () => onTripSelect?.(trip.id),
                mouseover: (e) => {
                  const marker = e.target;
                  const tooltipHtml = createHoverTooltip(trip, vehicle);
                  marker.bindTooltip(tooltipHtml, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -10],
                    className: 'custom-truck-tooltip',
                    opacity: 1
                  }).openTooltip();
                },
                mouseout: (e) => {
                  const marker = e.target;
                  marker.closeTooltip();
                }
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