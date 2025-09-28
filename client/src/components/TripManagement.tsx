import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Clock,
  User,
  Car,
  Play,
  Square,
  CheckCircle,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trip, Vehicle, User as UserType, InsertTrip, insertTripSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportTripsToPDF, exportTripsToExcel } from "@/utils/exportUtils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const tripFormSchema = insertTripSchema.extend({
  driverId: insertTripSchema.shape.driverId.min(1, "Driver is required"),
  vehicleId: insertTripSchema.shape.vehicleId.min(1, "Vehicle is required"),
  route: insertTripSchema.shape.route.min(1, "Route is required"),
});

type TripFormData = InsertTrip;

interface TripWithDetails extends Trip {
  driverName?: string;
  vehiclePlate?: string;
}

export default function TripManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const { toast } = useToast();

  // Fetch data
  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
    refetchInterval: 5000
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles']
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users']
  });

  const drivers = users.filter(user => user.role === 'driver');
  const availableVehicles = vehicles.filter(vehicle => vehicle.status === 'available');
  
  // Filter drivers to show only those not assigned to active trips
  const activeTrips = trips.filter(trip => trip.status === 'assigned' || trip.status === 'in_progress');
  const busyDriverIds = new Set(activeTrips.map(trip => trip.driverId));
  const availableDrivers = drivers.filter(driver => !busyDriverIds.has(driver.id));
  
  // For editing: include currently assigned driver/vehicle even if they're not "available"
  const getSelectableDrivers = (currentDriverId?: string) => {
    if (!currentDriverId) return availableDrivers;
    const currentDriver = drivers.find(d => d.id === currentDriverId);
    return currentDriver && !availableDrivers.find(d => d.id === currentDriverId) 
      ? [...availableDrivers, currentDriver]
      : availableDrivers;
  };
  
  const getSelectableVehicles = (currentVehicleId?: string) => {
    if (!currentVehicleId) return availableVehicles;
    const currentVehicle = vehicles.find(v => v.id === currentVehicleId);
    return currentVehicle && !availableVehicles.find(v => v.id === currentVehicleId)
      ? [...availableVehicles, currentVehicle]
      : availableVehicles;
  };

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (data: TripFormData) => {
      const response = await apiRequest("POST", "/api/trips", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Trip created",
        description: "New trip has been assigned successfully."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating trip",
        description: error.message || "Something went wrong."
      });
    }
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TripFormData> }) => {
      const response = await apiRequest("PUT", `/api/trips/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setEditingTrip(null);
      toast({
        title: "Trip updated",
        description: "Trip has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating trip",
        description: error.message || "Something went wrong."
      });
    }
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/trips/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Trip deleted",
        description: "Trip has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error deleting trip",
        description: error.message || "Something went wrong."
      });
    }
  });

  // Create form
  const createForm = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      driverId: "",
      vehicleId: "",
      route: "",
      status: "assigned",
      driverWage: ""
    }
  });

  // Edit form
  const editForm = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      driverId: "",
      vehicleId: "",
      route: "",
      status: "assigned",
      driverWage: ""
    }
  });

  // Update edit form when editing trip changes
  React.useEffect(() => {
    if (editingTrip) {
      editForm.reset({
        driverId: editingTrip.driverId,
        vehicleId: editingTrip.vehicleId,
        route: editingTrip.route,
        status: editingTrip.status,
        driverWage: editingTrip.driverWage || ""
      });
    }
  }, [editingTrip, editForm]);

  const onCreateSubmit = (data: TripFormData) => {
    createTripMutation.mutate(data);
  };

  const onEditSubmit = (data: TripFormData) => {
    if (editingTrip) {
      updateTripMutation.mutate({ id: editingTrip.id, data });
    }
  };

  const handleDelete = (trip: Trip) => {
    setTripToDelete(trip);
    setIsDeleteDialogOpen(true);
    setDeletePassword("");
  };

  const confirmDelete = () => {
    if (deletePassword !== "delete") {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Please type 'delete' to confirm deletion."
      });
      return;
    }

    if (tripToDelete) {
      deleteTripMutation.mutate(tripToDelete.id);
      setIsDeleteDialogOpen(false);
      setTripToDelete(null);
      setDeletePassword("");
    }
  };

  const handleStatusChange = (trip: Trip, newStatus: "assigned" | "in_progress" | "completed" | "cancelled") => {
    updateTripMutation.mutate({ 
      id: trip.id, 
      data: { status: newStatus }
    });
  };

  // Get trips with details
  const tripsWithDetails: TripWithDetails[] = trips.map(trip => {
    const driver = users.find(user => user.id === trip.driverId);
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    
    return {
      ...trip,
      driverName: driver?.name || 'Unknown Driver',
      vehiclePlate: vehicle?.numberPlate || 'Unknown Vehicle'
    };
  });

  // Filter and sort trips
  const filteredAndSortedTrips = React.useMemo(() => {
    let filtered = tripsWithDetails.filter((trip) => {
      const matchesSearch = trip.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trip.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           trip.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
      const matchesDriver = driverFilter === "all" || trip.driverId === driverFilter;
      const matchesVehicle = vehicleFilter === "all" || trip.vehicleId === vehicleFilter;
      
      // Date filtering
      let matchesDateRange = true;
      if (dateFromFilter || dateToFilter) {
        const tripDate = new Date(trip.createdAt || new Date());
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          matchesDateRange = matchesDateRange && tripDate >= fromDate;
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of day
          matchesDateRange = matchesDateRange && tripDate <= toDate;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDriver && matchesVehicle && matchesDateRange;
    });

    // Sort trips
    filtered.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (sortBy) {
        case "driverName":
          valueA = a.driverName || "";
          valueB = b.driverName || "";
          break;
        case "vehiclePlate":
          valueA = a.vehiclePlate || "";
          valueB = b.vehiclePlate || "";
          break;
        case "route":
          valueA = a.route;
          valueB = b.route;
          break;
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "driverWage":
          valueA = parseFloat(a.driverWage || "0");
          valueB = parseFloat(b.driverWage || "0");
          break;
        case "createdAt":
        default:
          valueA = new Date(a.createdAt || new Date());
          valueB = new Date(b.createdAt || new Date());
          break;
      }
      
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tripsWithDetails, searchTerm, statusFilter, driverFilter, vehicleFilter, dateFromFilter, dateToFilter, sortBy, sortOrder]);

  // For backward compatibility
  const filteredTrips = filteredAndSortedTrips;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-yellow-500";
      case "in_progress": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "assigned": return "outline";
      case "in_progress": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned": return Clock;
      case "in_progress": return Play;
      case "completed": return CheckCircle;
      case "cancelled": return Square;
      default: return Clock;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Export handlers
  const handleExportPDF = () => {
    const tripsToExport = filteredTrips.map(trip => ({
      ...trip,
      vehicleType: vehicles.find(v => v.id === trip.vehicleId)?.type
    }));
    exportTripsToPDF(tripsToExport, 'Fleet Trips Report');
    toast({
      title: "PDF Export",
      description: "Trips report has been downloaded as PDF."
    });
  };

  const handleExportExcel = () => {
    const tripsToExport = filteredTrips.map(trip => ({
      ...trip,
      vehicleType: vehicles.find(v => v.id === trip.vehicleId)?.type
    }));
    exportTripsToExcel(tripsToExport, 'fleet_trips_report');
    toast({
      title: "Excel Export",
      description: "Trips data has been downloaded as Excel file."
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trip Management</h1>
          <p className="text-muted-foreground mt-1">Assign and monitor fleet trips</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportExcel}
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-trip">
                <Plus className="w-4 h-4 mr-2" />
                Assign Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Trip</DialogTitle>
              <DialogDescription>
                Create a new trip assignment
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-driver">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.numberPlate} - {vehicle.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Warehouse A → Customer Site" {...field} data-testid="input-route" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="driverWage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Wage (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 1500.00" 
                          type="number" 
                          step="0.01" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-driver-wage" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTripMutation.isPending}
                    data-testid="button-create-trip"
                  >
                    {createTripMutation.isPending ? "Assigning..." : "Assign Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filters & View Options</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === "cards" ? "default" : "outline"}
                onClick={() => setViewMode("cards")}
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger data-testid="select-driver-filter">
                <SelectValue placeholder="Driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger data-testid="select-vehicle-filter">
                <SelectValue placeholder="Vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.numberPlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="From Date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              data-testid="input-date-from"
            />
            
            <Input
              type="date"
              placeholder="To Date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              data-testid="input-date-to"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="driverName">Driver Name</SelectItem>
                  <SelectItem value="vehiclePlate">Vehicle</SelectItem>
                  <SelectItem value="route">Route</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="driverWage">Driver Wage</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                data-testid="button-sort-order"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trips Display */}
      {tripsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No trips found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search filters"
              : "Start by assigning your first trip"
            }
          </p>
        </div>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="trips-table">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Driver</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Wage (₹)</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip, index) => {
                    const StatusIcon = getStatusIcon(trip.status);
                    
                    return (
                      <motion.tr
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/25 transition-colors"
                        data-testid={`trip-row-${trip.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(trip.driverName || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{trip.driverName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            <Car className="w-3 h-3 mr-1" />
                            {trip.vehiclePlate}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{trip.route}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(trip.status)} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {trip.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">
                            {trip.driverWage ? `₹${parseFloat(trip.driverWage).toLocaleString()}` : 'Not set'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {trip.status === 'assigned' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(trip, 'in_progress')}
                                data-testid={`button-start-${trip.id}`}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </Button>
                            )}
                            
                            {trip.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(trip, 'completed')}
                                data-testid={`button-complete-${trip.id}`}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTrip(trip)}
                              data-testid={`button-edit-${trip.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(trip)}
                              disabled={deleteTripMutation.isPending}
                              data-testid={`button-delete-${trip.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip, index) => {
            const StatusIcon = getStatusIcon(trip.status);
            
            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover-elevate" data-testid={`trip-card-${trip.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(trip.driverName || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{trip.driverName}</h3>
                            <Badge variant="outline" className="text-xs">
                              <Car className="w-3 h-3 mr-1" />
                              {trip.vehiclePlate}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">{trip.route}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Created: {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                            <span>
                              Wage: {trip.driverWage ? `₹${parseFloat(trip.driverWage).toLocaleString()}` : 'Not set'}
                            </span>
                            {trip.startTime && (
                              <span>
                                Started: {new Date(trip.startTime).toLocaleString()}
                              </span>
                            )}
                            {trip.endTime && (
                              <span>
                                Completed: {new Date(trip.endTime).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(trip.status)} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {trip.status.replace('_', ' ')}
                        </Badge>
                        
                        {trip.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(trip, 'in_progress')}
                            data-testid={`button-start-${trip.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        {trip.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(trip, 'completed')}
                            data-testid={`button-complete-${trip.id}`}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTrip(trip)}
                          data-testid={`button-edit-${trip.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(trip)}
                          disabled={deleteTripMutation.isPending}
                          data-testid={`button-delete-${trip.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTrip} onOpenChange={() => setEditingTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip</DialogTitle>
            <DialogDescription>
              Update trip information
            </DialogDescription>
          </DialogHeader>
          {editingTrip && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-driver">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getSelectableDrivers(editingTrip?.driverId).map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-vehicle">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getSelectableVehicles(editingTrip?.vehicleId).map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.numberPlate} - {vehicle.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Warehouse A → Customer Site" {...field} data-testid="input-edit-route" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="driverWage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Wage (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 1500.00" 
                          type="number" 
                          step="0.01" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-edit-driver-wage" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTrip(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTripMutation.isPending}
                    data-testid="button-update-trip"
                  >
                    {updateTripMutation.isPending ? "Updating..." : "Update Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Trip Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the trip and all associated location data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {tripToDelete && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Trip Details:</h4>
                <p className="text-sm text-muted-foreground">Route: {tripToDelete.route}</p>
                <p className="text-sm text-muted-foreground">Status: {tripToDelete.status}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="delete-password" className="text-sm font-medium">
                Type "delete" to confirm:
              </label>
              <Input
                id="delete-password"
                type="text"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="mt-1"
                data-testid="input-delete-password"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setTripToDelete(null);
                setDeletePassword("");
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePassword !== "delete" || deleteTripMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteTripMutation.isPending ? "Deleting..." : "Delete Trip"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}