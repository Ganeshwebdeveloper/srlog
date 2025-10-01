import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Package, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CratesBalance, User, Vehicle } from "@shared/schema";
import { format } from "date-fns";

export default function CratesBalanceSheet() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    route: "",
    driverId: "",
    vehicleId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    cratesCount: "",
    notes: ""
  });

  // Fetch data
  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  const startDate = new Date(selectedMonth + "-01");
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

  const { data: cratesRecords = [], isLoading } = useQuery<CratesBalance[]>({
    queryKey: ['/api/crates-balance', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/crates-balance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch crates records');
      return response.json();
    },
    enabled: !!selectedMonth,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/crates-balance", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crates-balance'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Crates record added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add crates record"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/crates-balance/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crates-balance'] });
      toast({
        title: "Success",
        description: "Record deleted successfully"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      route: "",
      driverId: "",
      vehicleId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      cratesCount: "",
      notes: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.route || !formData.driverId || !formData.vehicleId || !formData.cratesCount) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields"
      });
      return;
    }
    
    createMutation.mutate({
      route: formData.route,
      driverId: formData.driverId,
      vehicleId: formData.vehicleId,
      date: new Date(formData.date).toISOString(),
      cratesCount: formData.cratesCount.toString(), // Ensure it's a string for decimal field
      notes: formData.notes || undefined
    });
  };

  // Group records by route and calculate running balance
  const routeData = cratesRecords.reduce((acc: any, record) => {
    if (!acc[record.route]) {
      acc[record.route] = [];
    }
    acc[record.route].push(record);
    return acc;
  }, {});

  // Calculate running balance for each route
  Object.keys(routeData).forEach(route => {
    routeData[route].sort((a: CratesBalance, b: CratesBalance) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let balance = 0;
    routeData[route] = routeData[route].map((record: any) => {
      balance += Number(record.cratesCount);
      return { ...record, runningBalance: balance };
    });
  });

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Unknown Driver';
  };

  const getVehicleNumber = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.numberPlate || 'Unknown Vehicle';
  };

  return (
    <div className="p-6 space-y-6" data-testid="crates-balance-sheet">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crates Balance Sheet</h1>
          <p className="text-muted-foreground">Track daily crate movements by route</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-record">
              <Package className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Crates Record</DialogTitle>
              <DialogDescription>
                Add a new crates movement record for a route
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="route">Route</Label>
                <Input
                  id="route"
                  data-testid="input-route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="driver">Driver</Label>
                <Select
                  value={formData.driverId}
                  onValueChange={(value) => setFormData({ ...formData, driverId: value })}
                  required
                >
                  <SelectTrigger data-testid="select-driver">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.role === 'driver').map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vehicle">Vehicle</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                  required
                >
                  <SelectTrigger data-testid="select-vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.numberPlate} - {vehicle.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  data-testid="input-date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cratesCount">Crates Count (+ to add, - to subtract)</Label>
                <Input
                  id="cratesCount"
                  type="number"
                  data-testid="input-crates-count"
                  value={formData.cratesCount}
                  onChange={(e) => setFormData({ ...formData, cratesCount: e.target.value })}
                  placeholder="Enter positive or negative number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  data-testid="input-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" data-testid="button-submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Record"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="month">Select Month:</Label>
            <Input
              id="month"
              type="month"
              data-testid="input-month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Routes Data */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      ) : Object.keys(routeData).length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No crates records for this month. Add a new record to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(routeData).map(([route, records]: [string, any]) => (
          <Card key={route} data-testid={`route-card-${route}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {route}
              </CardTitle>
              <CardDescription>
                Running Balance: 
                <Badge variant="secondary" className="ml-2">
                  {records[records.length - 1]?.runningBalance || 0} crates
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Movement</TableHead>
                    <TableHead>Running Balance</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record: any) => (
                    <TableRow key={record.id} data-testid={`record-row-${record.id}`}>
                      <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{getDriverName(record.driverId)}</TableCell>
                      <TableCell>{getVehicleNumber(record.vehicleId)}</TableCell>
                      <TableCell>
                        <Badge variant={Number(record.cratesCount) > 0 ? "default" : "destructive"}>
                          {Number(record.cratesCount) > 0 ? <Plus className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                          {Math.abs(Number(record.cratesCount))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.runningBalance}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          data-testid={`button-delete-${record.id}`}
                          onClick={() => deleteMutation.mutate(record.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
