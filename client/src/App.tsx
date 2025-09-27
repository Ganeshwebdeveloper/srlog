import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { motion } from "framer-motion";

// Components
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./components/AdminDashboard";
import DriverPortal from "./components/DriverPortal";
import AppSidebar from "./components/AppSidebar";
import ThemeToggle from "./components/ThemeToggle";
import { ThemeProvider } from "./components/ThemeProvider";
import NotFound from "@/pages/not-found";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "driver";
  createdAt: Date;
};

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useLocation();

  const handleLogin = (user: User) => {
    setUser(user);
    
    // Redirect based on role
    if (user.role === "admin") {
      setLocation("/dashboard");
    } else {
      setLocation("/trips");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLocation("/");
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  const handleManageDrivers = () => {
    console.log("Navigate to driver management");
  };

  const handleManageVehicles = () => {
    console.log("Navigate to vehicle management");
  };

  const handleManageTrips = () => {
    console.log("Navigate to trip management");
  };

  // If not logged in, show login
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={() => <LoginForm onLogin={handleLogin} />} />
        <Route component={() => <LoginForm onLogin={handleLogin} />} />
      </Switch>
    );
  }

  // Sidebar style for fleet management
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          userRole={user.role}
          userName={user.name}
          currentPath={location}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {user.role === "admin" ? "Fleet Management" : "Driver Portal"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user.role === "admin" 
                    ? "Monitor and manage your fleet operations" 
                    : "View your trips and assignments"
                  }
                </p>
              </div>
            </div>
            <ThemeToggle />
          </motion.header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Switch>
              {user.role === "admin" ? (
                <>
                  <Route path="/dashboard" component={() => 
                    <AdminDashboard 
                      onManageDrivers={handleManageDrivers}
                      onManageVehicles={handleManageVehicles}
                      onManageTrips={handleManageTrips}
                    />
                  } />
                  <Route path="/vehicles" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Vehicle Management</h1>
                      <p className="text-muted-foreground">Vehicle CRUD operations will be implemented here.</p>
                    </div>
                  } />
                  <Route path="/drivers" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Driver Management</h1>
                      <p className="text-muted-foreground">Driver CRUD operations will be implemented here.</p>
                    </div>
                  } />
                  <Route path="/trips" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Trip Management</h1>
                      <p className="text-muted-foreground">Trip assignment and tracking will be implemented here.</p>
                    </div>
                  } />
                  <Route path="/map" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Live Fleet Map</h1>
                      <p className="text-muted-foreground">Real-time map with vehicle locations will be implemented here.</p>
                    </div>
                  } />
                  <Route path="/analytics" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
                      <p className="text-muted-foreground">Fleet analytics and reports will be implemented here.</p>
                    </div>
                  } />
                  <Route path="/settings" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Settings</h1>
                      <p className="text-muted-foreground">System settings and configuration will be implemented here.</p>
                    </div>
                  } />
                  <Route component={() => <AdminDashboard 
                    onManageDrivers={handleManageDrivers}
                    onManageVehicles={handleManageVehicles}
                    onManageTrips={handleManageTrips}
                  />} />
                </>
              ) : (
                <>
                  <Route path="/trips" component={() => <DriverPortal driverName={user.name} />} />
                  <Route path="/history" component={() => 
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-4">Trip History</h1>
                      <p className="text-muted-foreground">Detailed trip history and statistics will be implemented here.</p>
                    </div>
                  } />
                  <Route component={() => <DriverPortal driverName={user.name} />} />
                </>
              )}
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sr-logistics-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
