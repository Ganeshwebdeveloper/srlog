import AdminDashboard from '../AdminDashboard';

export default function AdminDashboardExample() {
  const handleManageDrivers = () => {
    console.log('Navigate to drivers management');
  };

  const handleManageVehicles = () => {
    console.log('Navigate to vehicles management');
  };

  const handleManageTrips = () => {
    console.log('Navigate to trips management');
  };

  return (
    <AdminDashboard 
      onManageDrivers={handleManageDrivers}
      onManageVehicles={handleManageVehicles}
      onManageTrips={handleManageTrips}
    />
  );
}