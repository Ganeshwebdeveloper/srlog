import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, Users, Car, TrendingUp, MapPin, Clock, Target, AlertTriangle } from "lucide-react";
import { Trip, Vehicle, Location } from "@shared/schema";

interface AnalyticsData {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  activeVehicles: number;
  avgTripDuration: number;
  totalDistance: number;
  tripsByStatus: { status: string; count: number; fill: string }[];
  tripsByDay: { day: string; trips: number }[];
  driverPerformance: { name: string; trips: number; avgRating: number }[];
  recentTrips: Trip[];
}

const COLORS = {
  assigned: '#3b82f6',
  in_progress: '#f59e0b', 
  completed: '#10b981',
  cancelled: '#ef4444'
};

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const utilizationRate = analytics.totalVehicles > 0 
    ? Math.round((analytics.activeVehicles / analytics.totalVehicles) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Analytics</h1>
          <p className="text-muted-foreground">Real-time insights and performance metrics</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="metric-active-trips">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.activeTrips}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalTrips} total trips
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-active-drivers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalDrivers} total drivers
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-vehicle-utilization">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicle Utilization</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeVehicles}/{analytics.totalVehicles} vehicles
            </p>
          </CardContent>
        </Card>

        <Card data-testid="metric-avg-duration">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trip Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(analytics.avgTripDuration)}m
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(analytics.totalDistance)}km total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Status Distribution */}
        <Card data-testid="chart-trip-status">
          <CardHeader>
            <CardTitle>Trip Status Distribution</CardTitle>
            <CardDescription>Current status of all trips</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.tripsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.tripsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trips Over Time */}
        <Card data-testid="chart-trips-timeline">
          <CardHeader>
            <CardTitle>Trips Over Time</CardTitle>
            <CardDescription>Daily trip volume for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.tripsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="trips" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card data-testid="chart-driver-performance" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Driver Performance</CardTitle>
            <CardDescription>Trip completion and performance metrics by driver</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.driverPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="trips" fill="#3b82f6" name="Completed Trips" />
                <Bar yAxisId="right" dataKey="avgRating" fill="#10b981" name="Avg Rating" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-testid="recent-trips">
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
          <CardDescription>Latest trip activities and status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentTrips.slice(0, 5).map((trip) => (
              <div key={trip.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0">
                  <Badge 
                    variant={trip.status === 'completed' ? 'default' : 
                            trip.status === 'in_progress' ? 'secondary' : 'outline'}
                    data-testid={`trip-status-${trip.id}`}
                  >
                    {trip.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Route: {trip.route}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Trip #{trip.id} • Driver ID: {trip.driverId}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            ))}
            {analytics.recentTrips.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent trips to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}