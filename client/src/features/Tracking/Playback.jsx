import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../lib/axios';
import { 
  History, Play, Pause, RotateCcw, Calendar, 
  Clock, MapPin, Gauge, Info, Filter, Download 
} from 'lucide-react';
import { format } from 'date-fns';

const playbackIcon = L.divIcon({
  className: 'amtms-playback-marker',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#C9920A;border:2px solid #fff;box-shadow:0 0 10px rgba(201,146,10,0.5)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapFocus({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions?.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
}

export default function HistoricalPlayback() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => (await api.get('/vehicles')).data.data || [],
  });

  const { data: rawHistory = [], isLoading } = useQuery({
    queryKey: ['historical-playback', selectedVehicle, date],
    queryFn: async () => {
      const { data } = await api.get(`/historical-playback/vehicle/${selectedVehicle}`, {
        params: { startDate: `${date}T00:00:00Z`, endDate: `${date}T23:59:59Z`, interval: '1min' }
      });
      return data.data || [];
    },
    enabled: !!selectedVehicle && !!date,
  });

  const historyPoints = useMemo(() => {
    return rawHistory.map(p => ({
      lat: p.location.coordinates[1],
      lng: p.location.coordinates[0],
      timestamp: new Date(p.timestamp),
      speed: p.speed || 0,
      heading: p.heading || 0
    })).filter(p => p.lat && p.lng);
  }, [rawHistory]);

  const polyline = useMemo(() => historyPoints.map(p => [p.lat, p.lng]), [historyPoints]);

  useEffect(() => {
    let interval;
    if (isPlaying && currentIndex < historyPoints.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex(prev => prev + 1);
      }, 500 / playbackSpeed);
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, historyPoints.length, playbackSpeed]);

  const currentPoint = historyPoints[currentIndex];

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Historical Playback
          </h1>
          <p className="page-subtitle">Replay vehicle routes and analyze historical telemetry</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={selectedVehicle} 
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="input !w-48"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map(v => (
              <option key={v._id} value={v._id}>{v.plateNumber}</option>
            ))}
          </select>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="input !w-40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4 bg-sidebar text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-gold" />
              Route Summary
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Total Points</p>
                <p className="text-xl font-bold">{historyPoints.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Date</p>
                <p className="text-sm font-medium">{format(new Date(date), 'MMMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-gold animate-pulse' : 'bg-etgreen'}`} />
                  <span className="text-xs">{isLoading ? 'Loading history...' : historyPoints.length > 0 ? 'Data loaded' : 'No data found'}</span>
                </div>
              </div>
            </div>
          </div>

          {currentPoint && (
            <div className="card p-4 animate-slide-up">
              <h3 className="font-semibold text-sidebar mb-4">Live Telemetry</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-500">Time</span>
                  </div>
                  <span className="text-xs font-bold text-sidebar">{format(currentPoint.timestamp, 'HH:mm:ss')}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-500">Speed</span>
                  </div>
                  <span className="text-xs font-bold text-sidebar">{currentPoint.speed} km/h</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs text-gray-500">Coords</span>
                  </div>
                  <span className="text-[10px] font-bold text-sidebar">{currentPoint.lat.toFixed(4)}, {currentPoint.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          <button className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-dashed">
            <Download className="w-4 h-4" /> Export Track Data
          </button>
        </div>

        {/* Map and Controls */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card !p-0 overflow-hidden h-[500px] relative">
            <MapContainer center={[6.0333, 37.5543]} zoom={12} className="h-full w-full z-0">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {polyline.length > 0 && <Polyline positions={polyline} color="#1B4F8A" weight={3} opacity={0.5} dashArray="10, 10" />}
              {currentPoint && (
                <Marker position={[currentPoint.lat, currentPoint.lng]} icon={playbackIcon}>
                  <Popup>
                    <div className="text-xs">
                      <strong>{format(currentPoint.timestamp, 'HH:mm:ss')}</strong>
                      <div>Speed: {currentPoint.speed} km/h</div>
                    </div>
                  </Popup>
                </Marker>
              )}
              <MapFocus positions={historyPoints} />
            </MapContainer>

            {/* Playback Progress */}
            <div className="absolute bottom-6 left-6 right-6 z-[500] flex items-center gap-4 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-card">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform"
                disabled={historyPoints.length === 0}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
              </button>
              
              <div className="flex-1 space-y-1">
                <input 
                  type="range"
                  min="0"
                  max={Math.max(0, historyPoints.length - 1)}
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  disabled={historyPoints.length === 0}
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                  <span>{historyPoints[0] ? format(historyPoints[0].timestamp, 'HH:mm') : '--:--'}</span>
                  <span>{currentPoint ? format(currentPoint.timestamp, 'HH:mm:ss') : 'Playback Ready'}</span>
                  <span>{historyPoints[historyPoints.length-1] ? format(historyPoints[historyPoints.length-1].timestamp, 'HH:mm') : '--:--'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l pl-4">
                <button 
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-sidebar transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <select 
                  value={playbackSpeed} 
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded"
                >
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                  <option value="8">8x</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
