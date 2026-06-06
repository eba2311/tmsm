import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../hooks/useAuthStore';

const alertTypes = {
  SUCCESS: { icon: CheckCircle, bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' },
  WARNING: { icon: AlertTriangle, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-800' },
  ERROR: { icon: AlertCircle, bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' },
  INFO: { icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' }
};

export const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [socket, setSocket] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    const newSocket = io('/notifications', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    newSocket.on('alert:new', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep only last 10 alerts
    });

    newSocket.on('alert:clear', (alertId) => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    if (socket) {
      socket.emit('alert:dismiss', { alertId });
    }
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    if (socket) {
      socket.emit('alert:clearAll');
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <div className="flex justify-end mb-2">
        <button
          onClick={clearAllAlerts}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear all
        </button>
      </div>
      {alerts.map((alert) => {
        const AlertIcon = alertTypes[alert.type]?.icon || Info;
        const styles = alertTypes[alert.type] || alertTypes.INFO;

        return (
          <div
            key={alert.id}
            className={`${styles.bgColor} ${styles.borderColor} ${styles.textColor} border rounded-lg p-4 shadow-lg transform transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-start gap-3">
              <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                <p className="text-sm opacity-90">{alert.message}</p>
                {alert.action && (
                  <button
                    onClick={() => {
                      qc.invalidateQueries({ queryKey: [alert.action.queryKey] });
                      dismissAlert(alert.id);
                    }}
                    className="mt-2 text-xs font-medium underline hover:no-underline"
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs opacity-70 mt-2">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AlertBadge = ({ count, type = 'WARNING' }) => {
  const styles = alertTypes[type] || alertTypes.WARNING;
  const AlertIcon = alertTypes[type]?.icon || alertTypes.INFO.icon;
  
  if (count === 0) return null;

  return (
    <span className={`${styles.bgColor} ${styles.textColor} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
      {count}
      <AlertIcon className="w-3 h-3" />
    </span>
  );
};

export const useAlertSystem = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    const newSocket = io('/notifications', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendAlert = (alert) => {
    if (socket) {
      socket.emit('alert:send', alert);
    }
  };

  return { sendAlert, socket };
};
