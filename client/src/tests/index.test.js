// Comprehensive Test Suite for TMSM System
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import App from '../App';

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock API responses
const mockVehicles = [
  { _id: '1', plateNumber: 'ABC123', make: 'Toyota', model: 'Hiace', capacity: 15 },
  { _id: '2', plateNumber: 'DEF456', make: 'Mercedes', model: 'Sprinter', capacity: 18 },
];

const mockDrivers = [
  { _id: '1', name: 'John Doe', licenseNumber: 'DL123456', rating: 4.5, totalTrips: 150 },
  { _id: '2', name: 'Jane Smith', licenseNumber: 'DL789012', rating: 4.8, totalTrips: 200 },
];

const mockRoutes = [
  { _id: '1', name: 'Addis Ababa - Arba Minch', distance: 452, estimatedDuration: 8 },
  { _id: '2', name: 'Arba Minch - Hawassa', distance: 275, estimatedDuration: 5 },
];

describe('TMSM System Tests', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Application Initialization', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<App />);
      expect(container).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      const { container } = renderWithProviders(<App />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render navigation menu with all items', async () => {
      const { container } = renderWithProviders(<App />);
      
      // Wait for navigation to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Vehicles')).toBeInTheDocument();
        expect(screen.getByText('Drivers')).toBeInTheDocument();
        expect(screen.getByText('Routes')).toBeInTheDocument();
        expect(screen.getByText('Schedules')).toBeInTheDocument();
        expect(screen.getByText('Booking')).toBeInTheDocument();
        expect(screen.getByText('Live map')).toBeInTheDocument();
        expect(screen.getByText('Capacity')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Fuel')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Alerts')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
      });
    });

    it('should navigate to different sections', async () => {
      const { container } = renderWithProviders(<App />);
      
      // Test navigation to vehicles
      const vehiclesLink = screen.getByText('Vehicles');
      fireEvent.click(vehiclesLink);
      
      await waitFor(() => {
        expect(window.location.pathname).toBe('/vehicles');
      });
    });
  });

  describe('Dashboard Component', () => {
    it('should display key metrics', async () => {
      // Mock API responses
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: {
            data: {
              totalVehicles: 10,
              totalDrivers: 25,
              totalBookings: 500,
              totalRevenue: 250000
            }
          }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Total Vehicles')).toBeInTheDocument();
        expect(screen.getByText('Active Drivers')).toBeInTheDocument();
        expect(screen.getByText('Total bookings')).toBeInTheDocument();
        expect(screen.getByText('Revenue (ETB)')).toBeInTheDocument();
      });
    });
  });

  describe('Vehicle Management', () => {
    it('should display vehicle list', async () => {
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockVehicles }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to vehicles
      const vehiclesLink = screen.getByText('Vehicles');
      fireEvent.click(vehiclesLink);
      
      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('DEF456')).toBeInTheDocument();
        expect(screen.getByText('Toyota Hiace')).toBeInTheDocument();
        expect(screen.getByText('Mercedes Sprinter')).toBeInTheDocument();
      });
    });

    it('should add new vehicle', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: { data: { _id: '3', plateNumber: 'GHI789' } }
      });
      
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({ data: { data: mockVehicles } }),
        post: mockPost
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to vehicles
      const vehiclesLink = screen.getByText('Vehicles');
      fireEvent.click(vehiclesLink);
      
      await waitFor(() => {
        const addButton = screen.getByText('Add Vehicle');
        fireEvent.click(addButton);
        
        // Fill form
        const plateInput = screen.getByPlaceholderText('License Plate');
        fireEvent.change(plateInput, { target: { value: 'GHI789' } });
        
        const makeInput = screen.getByPlaceholderText('Make');
        fireEvent.change(makeInput, { target: { value: 'Nissan' } });
        
        const modelInput = screen.getByPlaceholderText('Model');
        fireEvent.change(modelInput, { target: { value: 'Urvan' } });
        
        const capacityInput = screen.getByPlaceholderText('Capacity');
        fireEvent.change(capacityInput, { target: { value: '16' } });
        
        const submitButton = screen.getByText('Save');
        fireEvent.click(submitButton);
      });
      
      // Verify API was called
      expect(mockPost).toHaveBeenCalledWith('/vehicles', {
        plateNumber: 'GHI789',
        make: 'Nissan',
        model: 'Urvan',
        capacity: 16
      });
    });
  });

  describe('Driver Management', () => {
    it('should display driver list', async () => {
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockDrivers }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to drivers
      const driversLink = screen.getByText('Drivers');
      fireEvent.click(driversLink);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('DL123456')).toBeInTheDocument();
        expect(screen.getByText('DL789012')).toBeInTheDocument();
      });
    });

    it('should display driver performance metrics', async () => {
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              { name: 'John Doe', avgRating: 4.5, totalTrips: 150, totalRevenue: 75000 },
              { name: 'Jane Smith', avgRating: 4.8, totalTrips: 200, totalRevenue: 85000 }
            ]
          }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to driver analytics
      const analyticsLink = screen.getByText('Analytics');
      fireEvent.click(analyticsLink);
      
      await waitFor(() => {
        expect(screen.getByText('Top Performers')).toBeInTheDocument();
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Tracking', () => {
    it('should display live map with vehicles', async () => {
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockVehicles }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to tracking
      const trackingLink = screen.getByText('Live map');
      fireEvent.click(trackingLink);
      
      await waitFor(() => {
        expect(screen.getByText('Live tracking')).toBeInTheDocument();
        expect(screen.getByText('Socket.IO /tracking')).toBeInTheDocument();
      });
    });

    it('should calculate and display ETA', async () => {
      const mockVehicleWithLocation = {
        ...mockVehicles[0],
        currentLocation: { coordinates: [37.5485, 36.9333] }
      };

      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: [mockVehicleWithLocation] }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to tracking
      const trackingLink = screen.getByText('Live map');
      fireEvent.click(trackingLink);
      
      await waitFor(() => {
        expect(screen.getByText('ETA:')).toBeInTheDocument();
        expect(screen.getByText('Distance:')).toBeInTheDocument();
      });
    });
  });

  describe('Fuel Management', () => {
    it('should display fuel consumption data', async () => {
      const mockFuelData = [
        { vehicleId: '1', liters: 45, cost: 2250, distance: 450, efficiency: 10 },
        { vehicleId: '2', liters: 38, cost: 1900, distance: 380, efficiency: 10 },
      ];

      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockFuelData }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to fuel management
      const fuelLink = screen.getByText('Fuel');
      fireEvent.click(fuelLink);
      
      await waitFor(() => {
        expect(screen.getByText('Total Consumption')).toBeInTheDocument();
        expect(screen.getByText('Total Cost')).toBeInTheDocument();
        expect(screen.getByText('Efficiency')).toBeInTheDocument();
      });
    });

    it('should show fuel alerts', async () => {
      const mockAlerts = [
        { type: 'High Consumption', vehicle: 'ABC123', severity: 'warning' },
        { type: 'Low Fuel', vehicle: 'DEF456', severity: 'error' },
      ];

      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockAlerts }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to fuel management
      const fuelLink = screen.getByText('Fuel');
      fireEvent.click(fuelLink);
      
      await waitFor(() => {
        expect(screen.getByText('High Consumption')).toBeInTheDocument();
        expect(screen.getByText('Low Fuel')).toBeInTheDocument();
      });
    });
  });

  describe('Maintenance System', () => {
    it('should display maintenance tasks', async () => {
      const mockTasks = [
        { _id: '1', title: 'Oil Change', vehicle: 'ABC123', priority: 'MEDIUM', status: 'SCHEDULED' },
        { _id: '2', title: 'Tire Rotation', vehicle: 'DEF456', priority: 'HIGH', status: 'OVERDUE' },
      ];

      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockTasks }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to maintenance
      const maintenanceLink = screen.getByText('Maintenance');
      fireEvent.click(maintenanceLink);
      
      await waitFor(() => {
        expect(screen.getByText('Oil Change')).toBeInTheDocument();
        expect(screen.getByText('Tire Rotation')).toBeInTheDocument();
        expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
        expect(screen.getByText('OVERDUE')).toBeInTheDocument();
      });
    });
  });

  describe('Passenger Capacity Monitoring', () => {
    it('should display capacity data', async () => {
      const mockCapacityData = [
        { vehicleId: '1', currentPassengers: 12, capacity: 15, percentage: 80 },
        { vehicleId: '2', currentPassengers: 18, capacity: 18, percentage: 100 },
      ];

      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockCapacityData }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to passenger capacity
      const capacityLink = screen.getByText('Capacity');
      fireEvent.click(capacityLink);
      
      await waitFor(() => {
        expect(screen.getByText('12/15')).toBeInTheDocument();
        expect(screen.getByText('18/18')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('should show overcrowding alerts', async () => {
      const mockOvercrowding = [
        { vehicleId: '2', vehicle: 'DEF456', percentage: 100, severity: 'critical' },
      ];

      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: mockOvercrowding }
        })
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to passenger capacity
      const capacityLink = screen.getByText('Capacity');
      fireEvent.click(capacityLink);
      
      await waitFor(() => {
        expect(screen.getByText('Overcrowding Alert')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Management', () => {
    it('should display settings categories', async () => {
      const { container } = renderWithProviders(<App />);
      
      // Navigate to settings
      const settingsLink = screen.getByText('Settings');
      fireEvent.click(settingsLink);
      
      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Vehicles')).toBeInTheDocument();
        expect(screen.getByText('Fuel')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Data & Backup')).toBeInTheDocument();
      });
    });

    it('should save settings changes', async () => {
      const mockPut = vi.fn().mockResolvedValue({ data: { success: true } });
      
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockResolvedValue({
          data: { data: { general: { systemName: 'TMSM Test' } }
        }),
        put: mockPut
      }));

      const { container } = renderWithProviders(<App />);
      
      // Navigate to settings
      const settingsLink = screen.getByText('Settings');
      fireEvent.click(settingsLink);
      
      await waitFor(() => {
        const systemNameInput = screen.getByDisplayValue('TMSM Test');
        fireEvent.change(systemNameInput, { target: { value: 'Updated TMSM' } });
        
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });
      
      // Verify API was called
      expect(mockPut).toHaveBeenCalledWith('/settings', {
        general: { systemName: 'Updated TMSM' }
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockRejectedValue(new Error('API Error'))
      }));

      const { container } = renderWithProviders(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      vi.mock('../../lib/axios', () => ({
        get: vi.fn().mockRejectedValue(new Error('Network Error'))
      }));

      const { container } = renderWithProviders(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/network/i)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance limits', () => {
      const startTime = performance.now();
      const { container } = renderWithProviders(<App />);
      const endTime = performance.now();
      
      // Initial render should be under 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not have memory leaks', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(<App />);
        unmount();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const { container } = renderWithProviders(<App />);
      
      // Check for keyboard navigation
      const focusableElements = container.querySelectorAll('button, input, select, a, [tabindex]');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels', async () => {
      const { container } = renderWithProviders(<App />);
      
      // Check for ARIA labels
      const labeledElements = container.querySelectorAll('[aria-label], [aria-labelledby]');
      expect(labeledElements.length).toBeGreaterThan(0);
    });

    it('should support screen readers', async () => {
      const { container } = renderWithProviders(<App />);
      
      // Check for semantic HTML
      const semanticElements = container.querySelectorAll('main, nav, section, article, aside');
      expect(semanticElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { container } = renderWithProviders(<App />);
      
      // Check for mobile-specific elements
      const mobileMenu = container.querySelector('.mobile-menu');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('should render on desktop devices', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });

      const { container } = renderWithProviders(<App />);
      
      // Check for desktop-specific elements
      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
    });
  });
});
