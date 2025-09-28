import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Car,
  Users,
  Route,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Truck
} from "lucide-react";
import { motion } from "framer-motion";

interface AppSidebarProps {
  userRole: "admin" | "driver";
  userName: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function AppSidebar({ 
  userRole, 
  userName, 
  currentPath, 
  onNavigate, 
  onLogout 
}: AppSidebarProps) {
  const adminMenuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Vehicles",
      url: "/vehicles",
      icon: Car,
    },
    {
      title: "Drivers",
      url: "/drivers",
      icon: Users,
    },
    {
      title: "Trips",
      url: "/trips",
      icon: Route,
    },
    {
      title: "Live Map",
      url: "/map",
      icon: MapPin,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
  ];

  const driverMenuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "My Trips",
      url: "/trips",
      icon: Route,
    },
    {
      title: "Trip History",
      url: "/history",
      icon: BarChart3,
    },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : driverMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">SR Logistics</h2>
            <p className="text-xs text-sidebar-foreground/70 capitalize">{userRole} Portal</p>
          </div>
        </motion.div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      isActive={currentPath === item.url}
                      data-testid={`sidebar-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <button 
                        onClick={() => onNavigate(item.url)}
                        className="w-full flex items-center gap-3"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={currentPath === "/settings"}
                    data-testid="sidebar-settings"
                  >
                    <button 
                      onClick={() => onNavigate("/settings")}
                      className="w-full flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3 p-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs font-medium">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">{userRole}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLogout}
            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </SidebarFooter>
    </Sidebar>
  );
}