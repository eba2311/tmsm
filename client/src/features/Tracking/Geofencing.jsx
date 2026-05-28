import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  Shield, Map as MapIcon, Plus, Trash2, Edit2, 
  Bell, CheckCircle, XCircle, MapPin, Bus, AlertTriangle,
  Layers, MousePointer2, X, Info
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

export default function Geofencing() {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFence, setSelectedFence] = useState(null);
  const [newFence, setNewFence] = useState({
    name: '',
    type: 'CIRCLE',
    coordinates: [[6.0333, 37.5543]], // Default to Arba Minch
    radius: 1000, // in meters
    alertOnEntry: true,
    alertOnExit: true,
    assignedVehicles: [],
  });

  const qc = useQueryClient();

  const { data: geofences = [], isLoading } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const { data } = await api.get('/geofencing');
      return data.data || [];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data.data || [];
    },
  });

  const createFence = useMutation({
    mutationFn: (data) => api.post('/geofencing', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence created successfully');
      setIsAdding(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create geofence'),
  });

  const deleteFence = useMutation({
    mutationFn: (id) => api.delete(`/geofencing/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence deleted');
      setSelectedFence(null);
    },
  });

  const handleMapClick = (e) => {
    if (isAdding) {
      if (newFence.type === 'CIRCLE') {
        setNewFence({ ...newFence, coordinates: [[e.latlng.lat, e.latlng.lng]] });
      } else {
        setNewFence({ ...newFence, coordinates: [...newFence.coordinates, [e.latlng.lat, e.latlng.lng]] });
      }
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Geofencing & Territory
          </h1>
          <p className="page-subtitle">Define virtual boundaries and real-time alert triggers</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Geofence
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geofence List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sidebar">Active Zones</h3>
              <span className="badge-info">{geofences.length} Total</span>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {geofences.map((fence) => (
                <div
                  key={fence.id}
                  onClick={() => setSelectedFence(fence)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedFence?.id === fence.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sidebar text-sm">{fence.name}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase
                      ${fence.type === 'CIRCLE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {fence.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Bus className="w-3 h-3" />
                      {fence.assignedVehicles?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell className={`w-3 h-3 ${fence.alertOnEntry ? 'text-green-500' : 'text-gray-300'}`} />
                      Entry
                    </span>
                    <span className="flex items-center gap-1">
                      <Bell className={`w-3 h-3 ${fence.alertOnExit ? 'text-red-500' : 'text-gray-300'}`} />
                      Exit
                    </span>
                  </div>
                </div>
              ))}
              
              {geofences.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Layers className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No geofences created yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4 bg-sidebar text-white shadow-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-gold" />
              Recent Violations
            </h3>
            <div className="space-y-2">
              <div className="text-[10px] bg-white/10 p-2 rounded-lg border border-white/5">
                <p className="font-medium text-gold">AM-3-12345 Exited Zone</p>
                <p className="text-white/60">Main Terminal • 2 mins ago</p>
              </div>
              <div className="text-[10px] bg-white/10 p-2 rounded-lg border border-white/5">
                <p className="font-medium text-gold">AM-3-67890 Entered Restricted</p>
                <p className="text-white/60">Workshop Area • 15 mins ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden h-[550px] relative border-2 border-gray-100 shadow-xl">
            <MapContainer 
              center={[6.0333, 37.5543]} 
              zoom={13} 
              className="h-full w-full z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapEvents />
              
              {/* Existing Geofences */}
              {geofences.map(fence => (
                fence.type === 'CIRCLE' ? (
                  <Circle
                    key={fence.id}
                    center={[fence.coordinates[0][0], fence.coordinates[0][1]]}
                    radius={fence.radius}
                    pathOptions={{
                      color: selectedFence?.id === fence.id ? '#1B4F8A' : '#C9920A',
                      fillOpacity: 0.2
                    }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold">{fence.name}</p>
                        <p>{fence.assignedVehicles?.length || 0} Vehicles assigned</p>
                      </div>
                    </Popup>
                  </Circle>
                ) : (
                  <Polygon
                    key={fence.id}
                    positions={fence.coordinates}
                    pathOptions={{
                      color: selectedFence?.id === fence.id ? '#1B4F8A' : '#C9920A',
                      fillOpacity: 0.2
                    }}
                  />
                )
              ))}

              {/* New Geofence (Drawing) */}
              {isAdding && (
                newFence.type === 'CIRCLE' ? (
                  <Circle 
                    center={[newFence.coordinates[0][0], newFence.coordinates[0][1]]}
                    radius={newFence.radius}
                    pathOptions={{ color: '#1B4F8A', dashArray: '5, 5' }}
                  />
                ) : (
                  <Polygon 
                    positions={newFence.coordinates}
                    pathOptions={{ color: '#1B4F8A', dashArray: '5, 5' }}
                  />
                )
              )}
            </MapContainer>
            
            {/* Map Interaction Legend */}
            {isAdding && (
              <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur p-3 rounded-xl shadow-lg border border-primary/20 max-w-xs animate-slide-in">
                <div className="flex items-center gap-2 mb-1 text-primary font-bold text-sm">
                  <MousePointer2 className="w-4 h-4" /> Create Mode
                </div>
                <p className="text-[10px] text-gray-500">
                  {newFence.type === 'CIRCLE' 
                    ? "Click map to set the center point of the circular zone."
                    : "Click map to add corners to your polygonal territory."}
                </p>
              </div>
            )}
          </div>

          {isAdding && (
            <div className="card p-6 animate-slide-up border-2 border-primary/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-sidebar">New Geofence Configuration</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Zone Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Arba Minch Main Terminal"
                      className="input"
                      value={newFence.name}
                      onChange={(e) => setNewFence({ ...newFence, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Zone Type</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setNewFence({ ...newFence, type: 'CIRCLE' })}
                        className={`btn-secondary flex-1 text-xs ${newFence.type === 'CIRCLE' ? 'bg-primary text-white border-primary' : ''}`}
                      >
                        Circular
                      </button>
                      <button 
                        onClick={() => setNewFence({ ...newFence, type: 'POLYGON', coordinates: [] })}
                        className={`btn-secondary flex-1 text-xs ${newFence.type === 'POLYGON' ? 'bg-primary text-white border-primary' : ''}`}
                      >
                        Polygonal
                      </button>
                    </div>
                  </div>
                  {newFence.type === 'CIRCLE' && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Radius (meters)</label>
                      <input 
                        type="number" 
                        className="input"
                        value={newFence.radius}
                        onChange={(e) => setNewFence({ ...newFence, radius: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Alert Triggers</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setNewFence({ ...newFence, alertOnEntry: !newFence.alertOnEntry })}
                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${newFence.alertOnEntry ? 'border-etgreen bg-etgreen/5 text-etgreen' : 'border-gray-100 text-gray-400'}`}
                      >
                        Entry Alert
                      </button>
                      <button 
                        onClick={() => setNewFence({ ...newFence, alertOnExit: !newFence.alertOnExit })}
                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${newFence.alertOnExit ? 'border-etred bg-etred/5 text-etred' : 'border-gray-100 text-gray-400'}`}
                      >
                        Exit Alert
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Assign Vehicles</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                      {vehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            const exists = newFence.assignedVehicles.includes(v.id);
                            setNewFence({
                              ...newFence,
                              assignedVehicles: exists
                                ? newFence.assignedVehicles.filter(id => id !== v.id)
                                : [...newFence.assignedVehicles, v.id]
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            newFence.assignedVehicles.includes(v.id)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {v.plateNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  disabled={!newFence.name || newFence.coordinates.length === 0}
                  onClick={() => createFence.mutate(newFence)}
                  className="btn-primary flex-1 shadow-lg shadow-primary/20"
                >
                  Confirm & Create Territory
                </button>
              </div>
            </div>
          )}

          {selectedFence && !isAdding && (
            <div className="card p-6 animate-fade-in border-2 border-primary/5 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-sidebar">{selectedFence.name}</h3>
                  <p className="text-sm text-gray-500">Zone Details & Configuration</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this territory?')) {
                        deleteFence.mutate(selectedFence.id);
                      }
                    }}
                    className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400">Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell className={`w-5 h-5 ${selectedFence.alertOnEntry ? 'text-etgreen' : 'text-gray-300'}`} />
                        <span className="text-sm font-medium">Alert on Entry</span>
                      </div>
                      <span className={`text-[10px] font-bold ${selectedFence.alertOnEntry ? 'text-etgreen' : 'text-gray-400'}`}>
                        {selectedFence.alertOnEntry ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell className={`w-5 h-5 ${selectedFence.alertOnExit ? 'text-etred' : 'text-gray-300'}`} />
                        <span className="text-sm font-medium">Alert on Exit</span>
                      </div>
                      <span className={`text-[10px] font-bold ${selectedFence.alertOnExit ? 'text-etred' : 'text-gray-400'}`}>
                        {selectedFence.alertOnExit ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400">Assigned Fleet</h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                    {selectedFence.assignedVehicles?.map(v => (
                      <div key={v.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                        <Bus className="w-3 h-3" />
                        {v.plateNumber}
                      </div>
                    ))}
                    {(!selectedFence.assignedVehicles || selectedFence.assignedVehicles.length === 0) && (
                      <div className="flex items-center gap-2 text-gray-400 italic text-sm">
                        <Info className="w-4 h-4" /> No vehicles assigned.
                      </div>
                    )}
                  </div>
                  <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-2">
                    <Edit2 className="w-3 h-3" /> Manage Assignments
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
