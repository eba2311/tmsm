import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayersControl, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Navigation, Radio, Clock, MapPin, Activity, Search, Filter, Layers, Maximize2, Download, Printer, Play, Pause, SkipBack, SkipForward, AlertTriangle, User, Fuel, Wrench, Bell, ZoomIn, ZoomOut, RotateCcw, Map as MapIcon, X, Thermometer, Cloud, Zap, TrendingUp, MessageSquare, Route, BarChart3, Users, Settings, Wifi, WifiOff, AlertCircle, Calendar, DollarSign, UsersRound, Shield, Phone, Map as MapIcon2, Gauge, Timer, TrendingDown, CheckCircle, XCircle, Video, Mic, Bot, Zap as ZapIcon, Star, Moon, Sun, LayoutGrid, Smartphone, MessageCircle, ThumbsUp, ThumbsDown, AlertOctagon, MapPinned, History, Globe, Accessibility, CreditCard, Share2, Package, Wrench as Wrench2, BarChart, FileText, Send } from 'lucide-react';

const busIcon = L.divIcon({
  className: 'amtms-marker',
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#1B4F8A;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const busIconActive = L.divIcon({
  className: 'amtms-marker-active',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#2D7D3A;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.3);animation:pulse 2s infinite"><style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const busIconWarning = L.divIcon({
  className: 'amtms-marker-warning',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#C9920A;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const busIconMaintenance = L.divIcon({
  className: 'amtms-marker-maintenance',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#B5251A;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const clusterIcon = (count) => L.divIcon({
  className: 'amtms-cluster',
  html: `<div style="width:40px;height:40px;border-radius:9999px;background:#1B4F8A;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px">${count}</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    const b = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 12 });
  }, [map, positions]);
  return null;
}

export default function Tracking() {
  // All state must be declared before any hooks that depend on them
  const [live, setLive] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapZoom, setMapZoom] = useState(9);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [showDriverBehavior, setShowDriverBehavior] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [enableClustering, setEnableClustering] = useState(false);
  const [showScheduleAdherence, setShowScheduleAdherence] = useState(false);
  const [showPassengerCount, setShowPassengerCount] = useState(false);
  const [showRevenueTracking, setShowRevenueTracking] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPredictiveETA, setShowPredictiveETA] = useState(false);
  const [showVideoFeed, setShowVideoFeed] = useState(false);
  const [showVoiceComm, setShowVoiceComm] = useState(false);
  const [showAutoDispatch, setShowAutoDispatch] = useState(false);
  const [showAIPlanning, setShowAIPlanning] = useState(false);
  const [showPassengerFeedback, setShowPassengerFeedback] = useState(false);
  const [showDynamicPricing, setShowDynamicPricing] = useState(false);
  const [showWeatherAlerts, setShowWeatherAlerts] = useState(false);
  const [showDarkMode, setShowDarkMode] = useState(false);
  const [showCustomWidgets, setShowCustomWidgets] = useState(false);
  const [showMobileView, setShowMobileView] = useState(false);
  const [showGeofencing, setShowGeofencing] = useState(false);
  const [showHistoricalPlayback, setShowHistoricalPlayback] = useState(false);
  const [showMultiLanguage, setShowMultiLanguage] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showPaymentIntegration, setShowPaymentIntegration] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [showInventoryTracking, setShowInventoryTracking] = useState(false);
  const [showPredictiveMaintenance, setShowPredictiveMaintenance] = useState(false);
  const [showFleetComparison, setShowFleetComparison] = useState(false);
  const [showAutomatedReporting, setShowAutomatedReporting] = useState(false);
  const mapRef = useRef(null);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-map'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles/map/live');
      return data.data || [];
    },
    refetchInterval: 30000,
  });

  const { data: geofences = [] } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const { data } = await api.get('/geofencing');
      return data.data || [];
    },
    enabled: showGeofencing,
  });

  const { data: inventoryStats = {} } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/stats');
      return data.data || {};
    },
    enabled: showInventoryTracking,
  });

  const { data: historicalData = [] } = useQuery({
    queryKey: ['historical-playback'],
    queryFn: async () => {
      const { data } = await api.get('/historical-playback/fleet', {
        params: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          interval: '5min',
        },
      });
      return data.data || [];
    },
    enabled: showHistoricalPlayback,
  });

  const { data: maintenancePredictions = [] } = useQuery({
    queryKey: ['predictive-maintenance'],
    queryFn: async () => {
      const { data } = await api.get('/predictive-maintenance');
      return data.data || [];
    },
    enabled: showPredictiveMaintenance,
  });

  useEffect(() => {
    const socket = io('/tracking', { path: '/socket.io', transports: ['websocket', 'polling'] });

    const onLoc = (u) => {
      setLive((prev) => ({ ...prev, [u.vehicleId]: { lat: u.lat, lng: u.lng, at: u.updatedAt } }));
    };
    socket.on('vehicle:location', onLoc);
    socket.on('vehicles:init', (list) => {
      const next = {};
      (list || []).forEach((v) => {
        if (v.currentLocation?.coordinates?.length === 2) {
          const [lng, lat] = v.currentLocation.coordinates;
          next[String(v._id)] = { lat, lng };
        }
      });
      setLive((p) => ({ ...p, ...next }));
    });

    const routeId = vehicles[0]?.assignedRoute?._id;
    if (routeId) socket.emit('subscribe:route', { routeId: String(routeId) });

    return () => socket.disconnect();
  }, [vehicles]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markers = useMemo(() => {
    return vehicles.map((v) => {
      const override = live[String(v._id)];
      const coords = v.currentLocation?.coordinates;
      let lat = coords?.[1];
      let lng = coords?.[0];
      if (override) {
        lat = override.lat;
        lng = override.lng;
      }
      if (lat == null || lng == null) return null;
      
      // Determine vehicle status for icon selection
      const status = v.status || 'ACTIVE';
      const needsMaintenance = v.maintenanceDue || false;
      const fuelLevel = v.fuelLevel || 100;
      
      let icon = busIcon;
      if (needsMaintenance) {
        icon = busIconMaintenance;
      } else if (fuelLevel < 20) {
        icon = busIconWarning;
      } else if (status === 'ACTIVE') {
        icon = busIconActive;
      }
      
      return { 
        id: v._id, 
        lat, 
        lng, 
        plate: v.plateNumber, 
        route: v.assignedRoute?.name,
        status,
        icon,
        vehicle: v,
        fuelLevel,
        needsMaintenance,
        speed: v.currentSpeed || 0
      };
    }).filter(Boolean);
  }, [vehicles, live]);

  // Filtered markers
  const filteredMarkers = useMemo(() => {
    return markers.filter(m => {
      const matchesSearch = !searchTerm || 
        m.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.route?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRoute = selectedRoute === 'all' || m.route === selectedRoute;
      const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
      
      return matchesSearch && matchesRoute && matchesStatus;
    });
  }, [markers, searchTerm, selectedRoute, selectedStatus]);

  // Clustering logic
  const displayMarkers = useMemo(() => {
    if (!enableClustering || filteredMarkers.length < 10) {
      return filteredMarkers.map(m => ({ ...m, isCluster: false }));
    }
    
    // Simple clustering
    const clusters = [];
    const processed = new Set();
    
    for (const marker of filteredMarkers) {
      if (processed.has(marker.id)) continue;
      
      const nearby = filteredMarkers.filter(m => 
        !processed.has(m.id) &&
        Math.abs(m.lat - marker.lat) < 0.01 &&
        Math.abs(m.lng - marker.lng) < 0.01
      );
      
      if (nearby.length > 1) {
        const centerLat = nearby.reduce((sum, m) => sum + m.lat, 0) / nearby.length;
        const centerLng = nearby.reduce((sum, m) => sum + m.lng, 0) / nearby.length;
        clusters.push({
          id: `cluster-${clusters.length}`,
          lat: centerLat,
          lng: centerLng,
          count: nearby.length,
          isCluster: true
        });
        nearby.forEach(m => processed.add(m.id));
      } else {
        clusters.push({ ...marker, isCluster: false });
        processed.add(marker.id);
      }
    }
    
    return clusters;
  }, [filteredMarkers, enableClustering]);

  const line = useMemo(() => markers.map((m) => [m.lat, m.lng]), [markers]);
  const center = markers[0] ? [markers[0].lat, markers[0].lng] : [6.0333, 37.5543];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Navigation className="w-6 h-6 text-primary" /> Live tracking
          </h1>
          <p className="page-subtitle">Socket.IO `/tracking` • GPS markers (Arba Minch hub)</p>
        </div>
        {!isOnline && (
          <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-lg text-xs font-medium">
            <WifiOff className="w-4 h-4" />
            Offline mode
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by plate or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="input w-40"
        >
          <option value="all">All Routes</option>
          {[...new Set(markers.map(m => m.route).filter(Boolean))].map(route => (
            <option key={route} value={route}>{route}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="input w-40"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <button
          onClick={() => setEnableClustering(!enableClustering)}
          className={`btn-secondary ${enableClustering ? 'bg-primary text-white' : ''}`}
        >
          <Users className="w-4 h-4" />
          Cluster
        </button>
      </div>

      {/* Feature Toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`btn-secondary text-xs ${showHeatmap ? 'bg-primary text-white' : ''}`}
        >
          <TrendingUp className="w-3 h-3" />
          Heatmap
        </button>
        <button
          onClick={() => setShowWeather(!showWeather)}
          className={`btn-secondary text-xs ${showWeather ? 'bg-primary text-white' : ''}`}
        >
          <Cloud className="w-3 h-3" />
          Weather
        </button>
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`btn-secondary text-xs ${showTraffic ? 'bg-primary text-white' : ''}`}
        >
          <Activity className="w-3 h-3" />
          Traffic
        </button>
        <button
          onClick={() => setShowFuel(!showFuel)}
          className={`btn-secondary text-xs ${showFuel ? 'bg-primary text-white' : ''}`}
        >
          <Fuel className="w-3 h-3" />
          Fuel
        </button>
        <button
          onClick={() => setShowMaintenance(!showMaintenance)}
          className={`btn-secondary text-xs ${showMaintenance ? 'bg-primary text-white' : ''}`}
        >
          <Wrench className="w-3 h-3" />
          Maintenance
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`btn-secondary text-xs ${showChat ? 'bg-primary text-white' : ''}`}
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </button>
        <button
          onClick={() => setShowOptimization(!showOptimization)}
          className={`btn-secondary text-xs ${showOptimization ? 'bg-primary text-white' : ''}`}
        >
          <Route className="w-3 h-3" />
          Optimize
        </button>
        <button
          onClick={() => setShowDriverBehavior(!showDriverBehavior)}
          className={`btn-secondary text-xs ${showDriverBehavior ? 'bg-primary text-white' : ''}`}
        >
          <BarChart3 className="w-3 h-3" />
          Behavior
        </button>
        <button
          onClick={() => setShowPredictiveETA(!showPredictiveETA)}
          className={`btn-secondary text-xs ${showPredictiveETA ? 'bg-primary text-white' : ''}`}
        >
          <Timer className="w-3 h-3" />
          Predictive ETA
        </button>
        <button
          onClick={() => setShowScheduleAdherence(!showScheduleAdherence)}
          className={`btn-secondary text-xs ${showScheduleAdherence ? 'bg-primary text-white' : ''}`}
        >
          <Calendar className="w-3 h-3" />
          Schedule
        </button>
        <button
          onClick={() => setShowPassengerCount(!showPassengerCount)}
          className={`btn-secondary text-xs ${showPassengerCount ? 'bg-primary text-white' : ''}`}
        >
          <UsersRound className="w-3 h-3" />
          Passengers
        </button>
        <button
          onClick={() => setShowRevenueTracking(!showRevenueTracking)}
          className={`btn-secondary text-xs ${showRevenueTracking ? 'bg-primary text-white' : ''}`}
        >
          <DollarSign className="w-3 h-3" />
          Revenue
        </button>
        <button
          onClick={() => setShowEmergency(!showEmergency)}
          className={`btn-secondary text-xs ${showEmergency ? 'bg-primary text-white' : ''}`}
        >
          <AlertCircle className="w-3 h-3" />
          Emergency
        </button>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`btn-secondary text-xs ${showAnalytics ? 'bg-primary text-white' : ''}`}
        >
          <Gauge className="w-3 h-3" />
          Analytics
        </button>
        <button
          onClick={() => setShowVideoFeed(!showVideoFeed)}
          className={`btn-secondary text-xs ${showVideoFeed ? 'bg-primary text-white' : ''}`}
        >
          <Video className="w-3 h-3" />
          Video Feed
        </button>
        <button
          onClick={() => setShowVoiceComm(!showVoiceComm)}
          className={`btn-secondary text-xs ${showVoiceComm ? 'bg-primary text-white' : ''}`}
        >
          <Mic className="w-3 h-3" />
          Voice
        </button>
        <button
          onClick={() => setShowAutoDispatch(!showAutoDispatch)}
          className={`btn-secondary text-xs ${showAutoDispatch ? 'bg-primary text-white' : ''}`}
        >
          <Bot className="w-3 h-3" />
          Auto Dispatch
        </button>
        <button
          onClick={() => setShowAIPlanning(!showAIPlanning)}
          className={`btn-secondary text-xs ${showAIPlanning ? 'bg-primary text-white' : ''}`}
        >
          <ZapIcon className="w-3 h-3" />
          AI Planning
        </button>
        <button
          onClick={() => setShowPassengerFeedback(!showPassengerFeedback)}
          className={`btn-secondary text-xs ${showPassengerFeedback ? 'bg-primary text-white' : ''}`}
        >
          <MessageCircle className="w-3 h-3" />
          Feedback
        </button>
        <button
          onClick={() => setShowDynamicPricing(!showDynamicPricing)}
          className={`btn-secondary text-xs ${showDynamicPricing ? 'bg-primary text-white' : ''}`}
        >
          <DollarSign className="w-3 h-3" />
          Pricing
        </button>
        <button
          onClick={() => setShowWeatherAlerts(!showWeatherAlerts)}
          className={`btn-secondary text-xs ${showWeatherAlerts ? 'bg-primary text-white' : ''}`}
        >
          <AlertOctagon className="w-3 h-3" />
          Weather Alerts
        </button>
        <button
          onClick={() => setShowDarkMode(!showDarkMode)}
          className={`btn-secondary text-xs ${showDarkMode ? 'bg-primary text-white' : ''}`}
        >
          {showDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          {showDarkMode ? 'Light' : 'Dark'}
        </button>
        <button
          onClick={() => setShowCustomWidgets(!showCustomWidgets)}
          className={`btn-secondary text-xs ${showCustomWidgets ? 'bg-primary text-white' : ''}`}
        >
          <LayoutGrid className="w-3 h-3" />
          Widgets
        </button>
        <button
          onClick={() => setShowMobileView(!showMobileView)}
          className={`btn-secondary text-xs ${showMobileView ? 'bg-primary text-white' : ''}`}
        >
          <Smartphone className="w-3 h-3" />
          Mobile
        </button>
        <button
          onClick={() => setShowGeofencing(!showGeofencing)}
          className={`btn-secondary text-xs ${showGeofencing ? 'bg-primary text-white' : ''}`}
        >
          <MapPinned className="w-3 h-3" />
          Geofencing
        </button>
        <button
          onClick={() => setShowHistoricalPlayback(!showHistoricalPlayback)}
          className={`btn-secondary text-xs ${showHistoricalPlayback ? 'bg-primary text-white' : ''}`}
        >
          <History className="w-3 h-3" />
          Playback
        </button>
        <button
          onClick={() => setShowMultiLanguage(!showMultiLanguage)}
          className={`btn-secondary text-xs ${showMultiLanguage ? 'bg-primary text-white' : ''}`}
        >
          <Globe className="w-3 h-3" />
          Language
        </button>
        <button
          onClick={() => setShowAccessibility(!showAccessibility)}
          className={`btn-secondary text-xs ${showAccessibility ? 'bg-primary text-white' : ''}`}
        >
          <Accessibility className="w-3 h-3" />
          A11y
        </button>
        <button
          onClick={() => setShowPaymentIntegration(!showPaymentIntegration)}
          className={`btn-secondary text-xs ${showPaymentIntegration ? 'bg-primary text-white' : ''}`}
        >
          <CreditCard className="w-3 h-3" />
          Payments
        </button>
        <button
          onClick={() => setShowSocialMedia(!showSocialMedia)}
          className={`btn-secondary text-xs ${showSocialMedia ? 'bg-primary text-white' : ''}`}
        >
          <Share2 className="w-3 h-3" />
          Social
        </button>
        <button
          onClick={() => setShowInventoryTracking(!showInventoryTracking)}
          className={`btn-secondary text-xs ${showInventoryTracking ? 'bg-primary text-white' : ''}`}
        >
          <Package className="w-3 h-3" />
          Inventory
        </button>
        <button
          onClick={() => setShowPredictiveMaintenance(!showPredictiveMaintenance)}
          className={`btn-secondary text-xs ${showPredictiveMaintenance ? 'bg-primary text-white' : ''}`}
        >
          <Wrench2 className="w-3 h-3" />
          Predictive
        </button>
        <button
          onClick={() => setShowFleetComparison(!showFleetComparison)}
          className={`btn-secondary text-xs ${showFleetComparison ? 'bg-primary text-white' : ''}`}
        >
          <BarChart className="w-3 h-3" />
          Compare
        </button>
        <button
          onClick={() => setShowAutomatedReporting(!showAutomatedReporting)}
          className={`btn-secondary text-xs ${showAutomatedReporting ? 'bg-primary text-white' : ''}`}
        >
          <FileText className="w-3 h-3" />
          Reports
        </button>
      </div>

      <div className="card !p-0 overflow-hidden h-[600px] md:h-[700px] relative">
        {/* Live indicator */}
        <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-card text-xs font-medium text-sidebar">
          <Radio className="w-4 h-4 text-etgreen animate-pulse" aria-hidden />
          Live updates
          <span className="text-gray-400">•</span>
          <span>{filteredMarkers.length} vehicles</span>
        </div>

        {/* Map controls */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          <button onClick={() => setMapZoom(Math.min(mapZoom + 1, 18))} className="bg-white p-2 rounded-lg shadow-card hover:bg-gray-50">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setMapZoom(Math.max(mapZoom - 1, 4))} className="bg-white p-2 rounded-lg shadow-card hover:bg-gray-50">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => setMapZoom(9)} className="bg-white p-2 rounded-lg shadow-card hover:bg-gray-50">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white p-2 rounded-lg shadow-card hover:bg-gray-50">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <MapContainer 
          center={center} 
          zoom={mapZoom} 
          className="h-full w-full z-0" 
          scrollWheelZoom
          ref={mapRef}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer name="Street" checked>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer attribution='&copy; OpenTopoMap' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Heatmap overlay */}
          {showHeatmap && filteredMarkers.length > 0 && (
            <>
              {filteredMarkers.map((m, i) => (
                <Circle
                  key={`heat-${i}`}
                  center={[m.lat, m.lng]}
                  radius={500}
                  pathOptions={{ color: '#1B4F8A', weight: 0, fillOpacity: 0.3 }}
                />
              ))}
            </>
          )}

          {/* Weather overlay (simulated) */}
          {showWeather && (
            <Circle
              center={[6.0333, 37.5543]}
              radius={10000}
              pathOptions={{ color: '#87CEEB', weight: 0, fillOpacity: 0.2 }}
            />
          )}

          {/* Traffic overlay (simulated) */}
          {showTraffic && line.length > 1 && (
            <Polyline positions={line} pathOptions={{ color: '#FF6B6B', weight: 6, opacity: 0.4, dashArray: '10, 10' }} />
          )}

          {/* Fuel level indicators */}
          {showFuel && filteredMarkers.filter(m => m.fuelLevel < 30).map((m) => (
            <CircleMarker
              key={`fuel-${m.id}`}
              center={[m.lat, m.lng]}
              radius={15}
              pathOptions={{ color: m.fuelLevel < 15 ? '#B5251A' : '#C9920A', weight: 2, fillOpacity: 0.5 }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>Fuel Alert</strong>
                  <div>Level: {m.fuelLevel}%</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Maintenance alerts */}
          {showMaintenance && filteredMarkers.filter(m => m.needsMaintenance).map((m) => (
            <CircleMarker
              key={`maint-${m.id}`}
              center={[m.lat, m.lng]}
              radius={20}
              pathOptions={{ color: '#B5251A', weight: 3, fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="text-xs">
                  <strong>Maintenance Due</strong>
                  <div>Vehicle: {m.plate}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Route line */}
          {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#C9920A', weight: 4, opacity: 0.85 }} />}

          {/* Vehicle markers */}
          {displayMarkers.map((m) => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={m.isCluster ? clusterIcon(m.count) : m.icon}
              eventHandlers={{
                click: () => {
                  if (m.isCluster) {
                    if (mapRef.current) {
                      mapRef.current.setView([m.lat, m.lng], mapZoom + 2);
                    }
                  } else {
                    setSelectedVehicle(m.vehicle);
                  }
                }
              }}
            >
              <Popup>
                {m.isCluster ? (
                  <div className="space-y-2 min-w-[200px]">
                    <div>
                      <strong>Cluster of {m.count} vehicles</strong>
                    </div>
                    <div className="text-xs text-gray-600">
                      Click to zoom in and see individual vehicles
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 min-w-[200px]">
                    <div>
                      <strong>{m.plate}</strong>
                      <div className="text-xs text-gray-600">{m.route || 'Route'}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        m.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        m.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    {m.speed > 0 && (
                      <div className="text-xs">
                        <span className="font-medium">Speed:</span> {m.speed} km/h
                      </div>
                    )}
                    {m.fuelLevel && (
                      <div className="text-xs">
                        <span className="font-medium">Fuel:</span> {m.fuelLevel}%
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedVehicle(m.vehicle)}
                      className="w-full mt-2 btn-secondary text-xs py-1"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
          <FitBounds positions={markers.map((m) => [m.lat, m.lng])} />
        </MapContainer>
      </div>

      {/* Vehicle Details Panel */}
      {selectedVehicle && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Vehicle Details</h3>
            <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Plate:</span>
              <div className="font-medium">{selectedVehicle.plateNumber}</div>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <div className="font-medium">{selectedVehicle.status}</div>
            </div>
            <div>
              <span className="text-gray-500">Fuel:</span>
              <div className="font-medium">{selectedVehicle.fuelLevel || 100}%</div>
            </div>
            <div>
              <span className="text-gray-500">Speed:</span>
              <div className="font-medium">{selectedVehicle.currentSpeed || 0} km/h</div>
            </div>
          </div>
          {showChat && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium text-sm">Driver Communication</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                Chat feature - Send messages to driver
              </div>
            </div>
          )}
        </div>
      )}

      {/* Route Optimization Panel */}
      {showOptimization && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Route Optimization</h3>
            <button onClick={() => setShowOptimization(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>AI-powered route suggestions based on traffic, weather, and vehicle conditions.</p>
            <div className="mt-2 flex gap-2">
              <button className="btn-primary text-xs">Generate Routes</button>
              <button className="btn-secondary text-xs">View History</button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Behavior Panel */}
      {showDriverBehavior && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Driver Behavior Monitoring</h3>
            <button onClick={() => setShowDriverBehavior(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-xs text-gray-500">Safe Driving</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2.5h</div>
              <div className="text-xs text-gray-500">Avg Trip Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-xs text-gray-500">Alerts Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">A</div>
              <div className="text-xs text-gray-500">Overall Rating</div>
            </div>
          </div>
        </div>
      )}

      {/* Predictive ETA Panel */}
      {showPredictiveETA && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Predictive ETA (Traffic-Aware)</h3>
            <button onClick={() => setShowPredictiveETA(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span>Route A - Arba Minch to Addis Ababa</span>
              </div>
              <div className="text-right">
                <div className="font-bold">4h 32m</div>
                <div className="text-xs text-gray-500">+12m due to traffic</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-green-600" />
                <span>Route B - Alternative Path</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">4h 15m</div>
                <div className="text-xs text-gray-500">-5m faster</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-600" />
                <span>Route C - Scenic Route</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-600">5h 10m</div>
                <div className="text-xs text-gray-500">+50m slower</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Adherence Panel */}
      {showScheduleAdherence && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Schedule Adherence Tracking</h3>
            <button onClick={() => setShowScheduleAdherence(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            {filteredMarkers.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{m.plate}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">On Time</div>
                  <div className="text-xs text-gray-500">+2m ahead</div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>AA-1234</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600">Delayed</div>
                <div className="text-xs text-gray-500">-15m behind</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Count Panel */}
      {showPassengerCount && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Passenger Count Tracking</h3>
            <button onClick={() => setShowPassengerCount(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1,247</div>
              <div className="text-xs text-gray-500">Total Passengers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">89%</div>
              <div className="text-xs text-gray-500">Occupancy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">42</div>
              <div className="text-xs text-gray-500">Avg per Vehicle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-xs text-gray-500">Peak Hour</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {filteredMarkers.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span>{m.plate}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.random() * 100}%` }}></div>
                  </div>
                  <span>{Math.floor(Math.random() * 50) + 10}/50</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Tracking Panel */}
      {showRevenueTracking && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue Tracking per Route</h3>
            <button onClick={() => setShowRevenueTracking(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gold-dark">ETB 45K</div>
              <div className="text-xs text-gray-500">Today's Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+12%</div>
              <div className="text-xs text-gray-500">vs Yesterday</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">ETB 1.2M</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">ETB 36</div>
              <div className="text-xs text-gray-500">Avg per Trip</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[...new Set(markers.map(m => m.route).filter(Boolean))].slice(0, 3).map((route) => (
              <div key={route} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>{route}</span>
                <div className="flex items-center gap-4">
                  <span>ETB {Math.floor(Math.random() * 20000) + 5000}</span>
                  <span className="text-green-600">+{Math.floor(Math.random() * 20)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Response Panel */}
      {showEmergency && (
        <div className="card p-4 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Emergency Response
            </h3>
            <button onClick={() => setShowEmergency(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <Phone className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <div className="font-medium">Emergency Hotline</div>
                <div className="text-xs text-gray-600">24/7 Support: +251 911 123 456</div>
              </div>
              <button className="btn-danger text-xs">Call</button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Shield className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <div className="font-medium">Nearest Hospital</div>
                <div className="text-xs text-gray-600">Arba Minch General Hospital - 2.3km</div>
              </div>
              <button className="btn-secondary text-xs">Navigate</button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <MapIcon2 className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium">Emergency Vehicles</div>
                <div className="text-xs text-gray-600">3 ambulances on standby</div>
              </div>
              <button className="btn-secondary text-xs">Dispatch</button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <div className="font-medium">Report Incident</div>
                <div className="text-xs text-gray-600">Quick incident reporting system</div>
              </div>
              <button className="btn-secondary text-xs">Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Dashboard */}
      {showAnalytics && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Advanced Analytics Dashboard</h3>
            <button onClick={() => setShowAnalytics(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">98.5%</div>
              <div className="text-xs text-gray-500">On-Time Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4.8/5</div>
              <div className="text-xs text-gray-500">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">92%</div>
              <div className="text-xs text-gray-500">Route Efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">15%</div>
              <div className="text-xs text-gray-500">Cost Reduction</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span>Fleet Utilization</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <span>87%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Fuel Efficiency</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span>92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Maintenance Schedule</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span>78%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Driver Satisfaction</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span>85%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary text-xs">Export Report</button>
            <button className="btn-secondary text-xs">View Details</button>
            <button className="btn-secondary text-xs">Schedule Report</button>
          </div>
        </div>
      )}

      {/* Video Feed Panel */}
      {showVideoFeed && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Video Feed</h3>
            <button onClick={() => setShowVideoFeed(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredMarkers.slice(0, 4).map((m) => (
              <div key={m.id} className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative">
                <Video className="w-8 h-8 text-gray-600" />
                <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                  {m.plate}
                </div>
                <div className="absolute top-2 right-2 text-red-500 text-xs animate-pulse">
                  ● LIVE
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary text-xs">View All Cameras</button>
            <button className="btn-secondary text-xs">Record</button>
            <button className="btn-secondary text-xs">Take Snapshot</button>
          </div>
        </div>
      )}

      {/* Voice Communication Panel */}
      {showVoiceComm && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Voice Communication</h3>
            <button onClick={() => setShowVoiceComm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                <span>Call All Drivers</span>
              </div>
              <button className="btn-primary text-xs">Call</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-green-600" />
                <span>Broadcast Announcement</span>
              </div>
              <button className="btn-secondary text-xs">Broadcast</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Emergency Line</span>
              </div>
              <button className="btn-danger text-xs">Connect</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Dispatch Panel */}
      {showAutoDispatch && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Automated Dispatch System</h3>
            <button onClick={() => setShowAutoDispatch(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-green-600" />
                <span className="font-medium">AI Auto-Dispatch Active</span>
              </div>
              <p className="text-xs text-gray-600">System automatically assigns vehicles based on demand, location, and availability.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-primary">12</div>
                <div className="text-xs text-gray-500">Pending Requests</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">8</div>
                <div className="text-xs text-gray-500">Auto-Dispatched</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Configure Rules</button>
              <button className="btn-secondary text-xs">View History</button>
              <button className="btn-secondary text-xs">Manual Override</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Planning Panel */}
      {showAIPlanning && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">AI-Powered Route Planning</h3>
            <button onClick={() => setShowAIPlanning(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ZapIcon className="w-4 h-4 text-purple-600" />
                <span className="font-medium">AI Route Optimization</span>
              </div>
              <p className="text-xs text-gray-600">Machine learning algorithms analyze traffic patterns, weather, and historical data to suggest optimal routes.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Route Efficiency Improvement</span>
                <span className="text-green-600 font-bold">+23%</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Fuel Cost Reduction</span>
                <span className="text-green-600 font-bold">-18%</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Time Savings</span>
                <span className="text-green-600 font-bold">-15%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Generate Routes</button>
              <button className="btn-secondary text-xs">Train Model</button>
              <button className="btn-secondary text-xs">View Predictions</button>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Feedback Panel */}
      {showPassengerFeedback && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Real-time Passenger Feedback</h3>
            <button onClick={() => setShowPassengerFeedback(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4.7/5</div>
              <div className="text-xs text-gray-500">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">89%</div>
              <div className="text-xs text-gray-500">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">8%</div>
              <div className="text-xs text-gray-500">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">3%</div>
              <div className="text-xs text-gray-500">Negative</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span>"Great service, on time!"</span>
              <span className="text-gray-400 ml-auto">2m ago</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <span>"Clean vehicle, friendly driver"</span>
              <span className="text-gray-400 ml-auto">5m ago</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-xs">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <span>"AC not working properly"</span>
              <span className="text-gray-400 ml-auto">8m ago</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary text-xs">View All Feedback</button>
            <button className="btn-secondary text-xs">Respond</button>
            <button className="btn-secondary text-xs">Export</button>
          </div>
        </div>
      )}

      {/* Dynamic Pricing Panel */}
      {showDynamicPricing && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Dynamic Pricing</h3>
            <button onClick={() => setShowDynamicPricing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gold/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Current Demand</span>
                <span className="text-gold-dark font-bold">High</span>
              </div>
              <div className="text-xs text-gray-600">Peak hours pricing active (+25%)</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Base Price</span>
                <span>ETB 35</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Current Price</span>
                <span className="text-gold-dark font-bold">ETB 44</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Surge Multiplier</span>
                <span className="text-orange-600 font-bold">1.25x</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Adjust Pricing</button>
              <button className="btn-secondary text-xs">Set Rules</button>
              <button className="btn-secondary text-xs">View History</button>
            </div>
          </div>
        </div>
      )}

      {/* Weather Alerts Panel */}
      {showWeatherAlerts && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Weather Alerts & Notifications</h3>
            <button onClick={() => setShowWeatherAlerts(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 mb-1">
                <AlertOctagon className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Weather Advisory</span>
              </div>
              <p className="text-xs text-yellow-700">Light rain expected in Arba Minch area. Routes may be affected.</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Current Conditions</span>
              </div>
              <p className="text-xs text-gray-600">Temperature: 24°C, Humidity: 65%, Wind: 12 km/h</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">Forecast</span>
              </div>
              <p className="text-xs text-gray-600">Clearing expected by 3 PM. Optimal driving conditions after.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Set Alerts</button>
              <button className="btn-secondary text-xs">View Full Forecast</button>
              <button className="btn-secondary text-xs">Notify Drivers</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Widgets Panel */}
      {showCustomWidgets && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Custom Dashboard Widgets</h3>
            <button onClick={() => setShowCustomWidgets(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <LayoutGrid className="w-6 h-6 text-primary mb-2" />
              <div className="font-medium">Vehicle Status</div>
              <div className="text-xs text-gray-500">Active/Inactive</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
              <div className="font-medium">Revenue Chart</div>
              <div className="text-xs text-gray-500">Daily trends</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <UsersRound className="w-6 h-6 text-blue-600 mb-2" />
              <div className="font-medium">Passenger Flow</div>
              <div className="text-xs text-gray-500">Real-time count</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <AlertTriangle className="w-6 h-6 text-orange-600 mb-2" />
              <div className="font-medium">Alerts</div>
              <div className="text-xs text-gray-500">System warnings</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary text-xs">Add Widget</button>
            <button className="btn-secondary text-xs">Customize Layout</button>
            <button className="btn-secondary text-xs">Save Dashboard</button>
          </div>
        </div>
      )}

      {/* Mobile View Panel */}
      {showMobileView && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Mobile-Optimized View</h3>
            <button onClick={() => setShowMobileView(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Mobile Preview Mode</span>
              </div>
              <p className="text-xs text-gray-600">View the tracking interface as it appears on mobile devices.</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Simulated Mobile View:</div>
              <div className="bg-gray-900 rounded-lg p-4 text-white text-xs max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Live Tracking</span>
                  <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Active Vehicles</span>
                    <span>24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>On Route</span>
                    <span>18</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Test on Device</button>
              <button className="btn-secondary text-xs">Responsive Check</button>
              <button className="btn-secondary text-xs">PWA Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Geofencing Panel */}
      {showGeofencing && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Geofencing & Zone Management</h3>
            <button onClick={() => setShowGeofencing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPinned className="w-4 h-4 text-green-600" />
                <span className="font-medium">Active Geofences</span>
              </div>
              <p className="text-xs text-gray-600">{geofences.length} zones configured with automated alerts</p>
            </div>
            <div className="space-y-2">
              {geofences.slice(0, 5).map((gf) => (
                <div key={gf._id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <span>{gf.name}</span>
                  <span className={gf.isActive ? 'text-green-600' : 'text-gray-400'}>{gf.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Create Zone</button>
              <button className="btn-secondary text-xs">View All</button>
              <button className="btn-secondary text-xs">Alert Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Playback Panel */}
      {showHistoricalPlayback && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Historical Playback & Replay</h3>
            <button onClick={() => setShowHistoricalPlayback(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 mb-3">
              <button className="btn-secondary text-xs"><SkipBack className="w-3 h-3" /></button>
              <button className="btn-primary text-xs"><Play className="w-3 h-3" /></button>
              <button className="btn-secondary text-xs"><Pause className="w-3 h-3" /></button>
              <button className="btn-secondary text-xs"><SkipForward className="w-3 h-3" /></button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Playback Timeline</span>
                <span className="text-xs text-gray-500">Today, 8:00 AM - 6:00 PM</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Current: 12:30 PM</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Select Date</button>
              <button className="btn-secondary text-xs">Speed: 1x</button>
              <button className="btn-secondary text-xs">Export Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Language Panel */}
      {showMultiLanguage && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Multi-Language Support</h3>
            <button onClick={() => setShowMultiLanguage(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-primary/10 rounded-lg cursor-pointer border-2 border-primary">
                <div className="font-medium text-primary">English</div>
                <div className="text-xs text-gray-500">Default</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div className="font-medium">አማርኛ</div>
                <div className="text-xs text-gray-500">Amharic</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div className="font-medium">Afaan Oromoo</div>
                <div className="text-xs text-gray-500">Oromo</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <div className="font-medium">العربية</div>
                <div className="text-xs text-gray-500">Arabic</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Apply Language</button>
              <button className="btn-secondary text-xs">Add Language</button>
              <button className="btn-secondary text-xs">Translate All</button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Panel */}
      {showAccessibility && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Accessibility Features</h3>
            <button onClick={() => setShowAccessibility(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-primary" />
                <span>Screen Reader Support</span>
              </div>
              <button className="btn-secondary text-xs">Enable</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">A</span>
                <span>Text Size</span>
              </div>
              <div className="flex gap-1">
                <button className="btn-secondary text-xs px-2">A-</button>
                <button className="btn-secondary text-xs px-2">A+</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-800 rounded"></span>
                <span>High Contrast</span>
              </div>
              <button className="btn-secondary text-xs">Toggle</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-400 rounded"></span>
                <span>Focus Indicators</span>
              </div>
              <button className="btn-secondary text-xs">Enhance</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Integration Panel */}
      {showPaymentIntegration && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Payment System Integration</h3>
            <button onClick={() => setShowPaymentIntegration(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <CreditCard className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="font-medium">Telebirr</div>
                <div className="text-xs text-green-600">Connected</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <CreditCard className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-medium">CBE Birr</div>
                <div className="text-xs text-blue-600">Connected</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <CreditCard className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="font-medium">Amole</div>
                <div className="text-xs text-purple-600">Connected</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <CreditCard className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="font-medium">Cash</div>
                <div className="text-xs text-gray-500">Available</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Add Payment Method</button>
              <button className="btn-secondary text-xs">View Transactions</button>
              <button className="btn-secondary text-xs">Configure</button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media Panel */}
      {showSocialMedia && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Social Media Integration</h3>
            <button onClick={() => setShowSocialMedia(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Auto-Post Updates</span>
              </div>
              <p className="text-xs text-gray-600">Automatically share route updates and announcements to social media.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Facebook</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Telegram</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Twitter</span>
                <span className="text-orange-600">Pending</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Post Now</button>
              <button className="btn-secondary text-xs">Schedule</button>
              <button className="btn-secondary text-xs">Manage Accounts</button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tracking Panel */}
      {showInventoryTracking && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Real-Time Inventory Tracking</h3>
            <button onClick={() => setShowInventoryTracking(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-primary">{inventoryStats.totalAvailable || 0}</div>
                <div className="text-xs text-gray-500">Tickets Available</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{inventoryStats.totalSold || 0}</div>
                <div className="text-xs text-gray-500">Sold Today</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{inventoryStats.totalReserved || 0}</div>
                <div className="text-xs text-gray-500">Reserved</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">ETB {inventoryStats.totalRevenue ? Math.round(inventoryStats.totalRevenue).toLocaleString() : 0}</div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Manage Inventory</button>
              <button className="btn-secondary text-xs">View History</button>
              <button className="btn-secondary text-xs">Restock</button>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Maintenance Panel */}
      {showPredictiveMaintenance && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Predictive Maintenance</h3>
            <button onClick={() => setShowPredictiveMaintenance(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wrench2 className="w-4 h-4 text-purple-600" />
                <span className="font-medium">AI-Powered Predictions</span>
              </div>
              <p className="text-xs text-gray-600">Machine learning analyzes vehicle data to predict maintenance needs.</p>
            </div>
            <div className="space-y-2">
              {maintenancePredictions.slice(0, 5).map((pred) => (
                <div key={pred.vehicle} className={`flex items-center justify-between text-xs p-2 rounded ${
                  pred.prediction.urgency === 'HIGH' ? 'bg-red-50' :
                  pred.prediction.urgency === 'MEDIUM' ? 'bg-orange-50' :
                  'bg-green-50'
                }`}>
                  <span>{pred.plateNumber}</span>
                  <span className={`font-bold ${
                    pred.prediction.urgency === 'HIGH' ? 'text-red-600' :
                    pred.prediction.urgency === 'MEDIUM' ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    Due in {pred.prediction.daysUntilMaintenance} days
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Schedule Maintenance</button>
              <button className="btn-secondary text-xs">View All Predictions</button>
              <button className="btn-secondary text-xs">Train Model</button>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Comparison Panel */}
      {showFleetComparison && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Fleet Performance Comparison</h3>
            <button onClick={() => setShowFleetComparison(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-primary">92%</div>
                <div className="text-xs text-gray-500">Fleet A Efficiency</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">88%</div>
                <div className="text-xs text-gray-500">Fleet B Efficiency</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">95%</div>
                <div className="text-xs text-gray-500">Fleet C Efficiency</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Fuel Consumption (L/100km)</span>
                <div className="flex gap-2">
                  <span className="text-primary">Fleet A: 12.5</span>
                  <span className="text-green-600">Fleet B: 13.2</span>
                  <span className="text-blue-600">Fleet C: 11.8</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>On-Time Performance</span>
                <div className="flex gap-2">
                  <span className="text-primary">Fleet A: 94%</span>
                  <span className="text-green-600">Fleet B: 89%</span>
                  <span className="text-blue-600">Fleet C: 97%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Maintenance Cost/Year</span>
                <div className="flex gap-2">
                  <span className="text-primary">Fleet A: ETB 45K</span>
                  <span className="text-green-600">Fleet B: ETB 52K</span>
                  <span className="text-blue-600">Fleet C: ETB 38K</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Detailed Comparison</button>
              <button className="btn-secondary text-xs">Export Data</button>
              <button className="btn-secondary text-xs">Optimize Fleet</button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Reporting Panel */}
      {showAutomatedReporting && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Automated Reporting</h3>
            <button onClick={() => setShowAutomatedReporting(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="font-medium">Auto-Report Generation</span>
              </div>
              <p className="text-xs text-gray-600">Automatically generate and send reports via email or messaging.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Daily Performance Report</span>
                <span className="text-green-600">Active (6:00 PM)</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Weekly Summary</span>
                <span className="text-green-600">Active (Monday 9:00 AM)</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span>Monthly Analytics</span>
                <span className="text-green-600">Active (1st of month)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary text-xs">Create Report</button>
              <button className="btn-secondary text-xs">Schedule</button>
              <button className="btn-secondary text-xs">Recipients</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
