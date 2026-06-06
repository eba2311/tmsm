import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import api from './lib/axios';
import Layout from './components/Layout';
import Login from './features/Auth/Login';
import Register from './features/Auth/Register';
import ForgotPassword from './features/Auth/ForgotPassword';
import ResetPassword from './features/Auth/ResetPassword';
import Dashboard from './features/Dashboard';
import Vehicles from './features/Vehicles';
import Drivers from './features/Drivers';
import Booking from './features/Booking';
import Routes_ from './features/Routes';
import Reports from './features/Reports';
import Schedules from './features/Schedules';
import Tracking from './features/Tracking';
import Notifications from './features/Notifications';
import FuelManagement from './features/FuelManagement';
import Maintenance from './features/Maintenance';
import DriverAnalytics from './features/DriverAnalytics';
import PassengerCapacity from './features/PassengerCapacity';
import AdvancedReports from './features/AdvancedReports';
import MobileApp from './features/MobileApp';
import SystemSettings from './features/Settings';
import SystemHealth from './components/SystemHealth';
import RouteOptimization from './features/Routes/Optimization';
import Geofencing from './features/Tracking/Geofencing';
import PredictiveMaintenance from './features/Maintenance/Predictive';
import HistoricalPlayback from './features/Tracking/Playback';
import DriverPayroll from './features/Drivers/Payroll';
import Inventory from './features/Inventory';
import AuditLogs from './features/System/AuditLogs';
import PassengerPortal from './features/PassengerPortal';
import DriverPanel from './features/DriverPanel';
import Passengers from './features/Passenger';
import DriverCompliance from './features/Drivers/Compliance';
import ReportSchedules from './features/ReportSchedules';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, refreshToken, setTokens, login } = useAuthStore();

  // Try to restore session on app load
  React.useEffect(() => {
    const tryRestore = async () => {
      if (!user && refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          if (data?.data?.accessToken) {
            setTokens(data.data);
            const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.data.accessToken}` } });
            if (me.data?.data) login({ user: me.data.data, accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
          }
        } catch (e) {
          // ignore — user will see login
        }
      }
    };
    tryRestore();
  }, [user, refreshToken, setTokens, login]);

  return (
    <Routes>
      <Route path="/" element={<PassengerPortal />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/driver/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<DriverPanel />} />
                <Route path="tracking" element={<Tracking />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="driver-compliance" element={<DriverCompliance />} />
        <Route path="passengers" element={<Passengers />} />
        <Route path="report-schedules" element={<ReportSchedules />} />
        <Route path="booking" element={<Booking />} />
        <Route path="routes" element={<Routes_ />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="reports" element={<Reports />} />
        <Route path="tracking" element={<Tracking />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="fuel" element={<FuelManagement />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="analytics" element={<DriverAnalytics />} />
        <Route path="capacity" element={<PassengerCapacity />} />
        <Route path="advanced-reports" element={<AdvancedReports />} />
        <Route path="mobile-app" element={<MobileApp />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="route-optimization" element={<RouteOptimization />} />
        <Route path="geofencing" element={<Geofencing />} />
        <Route path="predictive-maintenance" element={<PredictiveMaintenance />} />
        <Route path="playback" element={<HistoricalPlayback />} />
        <Route path="payroll" element={<DriverPayroll />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
