import AppSidebar from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppSidebarExample() {
  const handleNavigate = (path: string) => {
    console.log(`Navigate to: ${path}`);
  };

  const handleLogout = () => {
    console.log('User logged out');
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          userRole="admin"
          userName="John Admin"
          currentPath="/dashboard"
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <div className="flex-1 p-6 bg-background">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">Sidebar Preview</h3>
            <p className="text-sm">This is how the sidebar will look in the application</p>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}