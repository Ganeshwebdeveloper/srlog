import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Trip, Vehicle, User } from '@shared/schema';

interface TripWithDetails extends Trip {
  driverName?: string;
  vehiclePlate?: string;
  vehicleType?: string;
}

export const exportTripsToPDF = async (
  trips: TripWithDetails[],
  title: string = 'Trips Report'
) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Prepare table data
  const tableData = trips.map(trip => [
    trip.id.slice(0, 8) + '...',
    trip.driverName || 'Unknown',
    trip.vehiclePlate || 'Unknown',
    trip.route,
    trip.status.replace('_', ' '),
    trip.priority || 'medium',
    trip.distance ? `${trip.distance} km` : 'N/A',
    trip.startTime ? new Date(trip.startTime).toLocaleDateString() : 'Not started',
    trip.endTime ? new Date(trip.endTime).toLocaleDateString() : 'Not completed'
  ]);

  // Add table
  autoTable(doc, {
    head: [['Trip ID', 'Driver', 'Vehicle', 'Route', 'Status', 'Priority', 'Distance', 'Start Date', 'End Date']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add summary statistics
  const yPosition = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.text('Summary Statistics:', 20, yPosition);
  
  doc.setFontSize(10);
  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const inProgressTrips = trips.filter(t => t.status === 'in_progress').length;
  const totalDistance = trips.reduce((sum, trip) => sum + (parseFloat(trip.distance?.toString() || '0')), 0);
  
  doc.text(`Total Trips: ${totalTrips}`, 20, yPosition + 10);
  doc.text(`Completed: ${completedTrips}`, 20, yPosition + 20);
  doc.text(`In Progress: ${inProgressTrips}`, 20, yPosition + 30);
  doc.text(`Total Distance: ${totalDistance.toFixed(2)} km`, 20, yPosition + 40);

  // Save the PDF
  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportTripsToExcel = (
  trips: TripWithDetails[],
  filename: string = 'trips_export'
) => {
  // Prepare data for Excel
  const excelData = trips.map(trip => ({
    'Trip ID': trip.id,
    'Driver Name': trip.driverName || 'Unknown',
    'Vehicle Plate': trip.vehiclePlate || 'Unknown',
    'Vehicle Type': trip.vehicleType || 'Unknown',
    'Route': trip.route,
    'Status': trip.status.replace('_', ' '),
    'Priority': trip.priority || 'medium',
    'Start Location': trip.startLocation || 'N/A',
    'End Location': trip.endLocation || 'N/A',
    'Distance (km)': trip.distance ? parseFloat(trip.distance.toString()) : 0,
    'Estimated Duration (hrs)': trip.estimatedDuration ? parseFloat(trip.estimatedDuration.toString()) : 0,
    'Fuel Consumed (L)': trip.fuelConsumed ? parseFloat(trip.fuelConsumed.toString()) : 0,
    'Notes': trip.notes || '',
    'Start Time': trip.startTime ? new Date(trip.startTime).toLocaleString() : 'Not started',
    'End Time': trip.endTime ? new Date(trip.endTime).toLocaleString() : 'Not completed',
    'Created At': new Date(trip.createdAt!).toLocaleString(),
  }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Create trips worksheet
  const tripsWorksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Trip ID
    { wch: 20 }, // Driver Name
    { wch: 15 }, // Vehicle Plate
    { wch: 15 }, // Vehicle Type
    { wch: 30 }, // Route
    { wch: 12 }, // Status
    { wch: 10 }, // Priority
    { wch: 20 }, // Start Location
    { wch: 20 }, // End Location
    { wch: 12 }, // Distance
    { wch: 18 }, // Duration
    { wch: 15 }, // Fuel
    { wch: 30 }, // Notes
    { wch: 20 }, // Start Time
    { wch: 20 }, // End Time
    { wch: 20 }, // Created At
  ];
  
  tripsWorksheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, tripsWorksheet, 'Trips');

  // Create summary worksheet
  const summary = [
    { Metric: 'Total Trips', Value: trips.length },
    { Metric: 'Completed Trips', Value: trips.filter(t => t.status === 'completed').length },
    { Metric: 'In Progress Trips', Value: trips.filter(t => t.status === 'in_progress').length },
    { Metric: 'Assigned Trips', Value: trips.filter(t => t.status === 'assigned').length },
    { Metric: 'Cancelled Trips', Value: trips.filter(t => t.status === 'cancelled').length },
    { Metric: 'Total Distance (km)', Value: trips.reduce((sum, trip) => sum + (parseFloat(trip.distance?.toString() || '0')), 0).toFixed(2) },
    { Metric: 'Total Fuel Consumed (L)', Value: trips.reduce((sum, trip) => sum + (parseFloat(trip.fuelConsumed?.toString() || '0')), 0).toFixed(2) },
    { Metric: 'Report Generated', Value: new Date().toLocaleString() },
  ];
  
  const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
  summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Save the file
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportChartToPDF = async (
  chartElementId: string,
  title: string = 'Chart Export'
) => {
  const chartElement = document.getElementById(chartElementId);
  if (!chartElement) {
    console.error('Chart element not found');
    return;
  }

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Add chart image
    const imgWidth = 170;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
    
    // Add generation info
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30 + imgHeight + 10);
    
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
};