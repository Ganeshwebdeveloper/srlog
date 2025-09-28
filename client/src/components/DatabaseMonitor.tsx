import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  HardDrive, 
  Activity, 
  RefreshCw,
  TrendingUp,
  Table,
  FileText,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface DatabaseStats {
  tables: {
    name: string;
    rowCount: number;
    sizeBytes: number;
    sizeMB: number;
    lastUpdated: string;
  }[];
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
}

interface DatabaseMonitorProps {
  className?: string;
}

export default function DatabaseMonitor({ className }: DatabaseMonitorProps) {

  // Fetch database statistics
  const { data: dbStats, isLoading, error, refetch } = useQuery<DatabaseStats>({
    queryKey: ['/api/database/stats'],
    queryFn: async () => {
      const response = await fetch('/api/database/stats', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 3,
  });

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy': return 'secondary';
      case 'warning': return 'outline';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Monitor
            </CardTitle>
            <CardDescription>Loading database statistics...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Monitor
              <Badge variant="destructive">Error</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>Unable to load database statistics</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dbStats) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No database statistics available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`} data-testid="database-monitor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Database Monitor
          </h2>
          <p className="text-muted-foreground">Real-time database performance and usage statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getHealthBadgeVariant(dbStats.healthStatus)}>
            {dbStats.healthStatus.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                  <p className="text-2xl font-bold">{formatBytes(dbStats.totalSize)}</p>
                </div>
                <HardDrive className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{formatNumber(dbStats.totalRecords)}</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connections</p>
                  <p className="text-2xl font-bold">{dbStats.connectionCount}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">{dbStats.memoryUsage.percentage}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <Progress value={dbStats.memoryUsage.percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Table Statistics
          </CardTitle>
          <CardDescription>Detailed breakdown by database table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dbStats.tables.map((table, index) => (
              <motion.div
                key={table.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                  <div>
                    <h4 className="font-medium capitalize">{table.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(table.rowCount)} records
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatBytes(table.sizeBytes)}</p>
                  <p className="text-sm text-muted-foreground">
                    Updated: {new Date(table.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage Details */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
          <CardDescription>Current memory allocation and usage patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Used Memory</span>
              <span className="text-sm">{formatBytes(dbStats.memoryUsage.used)}</span>
            </div>
            <Progress value={dbStats.memoryUsage.percentage} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>0 B</span>
              <span>{formatBytes(dbStats.memoryUsage.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dbStats.queryCount}</p>
                <p className="text-sm text-muted-foreground">Queries Executed</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getHealthColor(dbStats.healthStatus)}`}>
                  {dbStats.healthStatus.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">Health Status</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}