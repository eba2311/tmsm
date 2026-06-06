import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import api from '../lib/axios';
import { useAuthStore } from './useAuthStore';

export const useRealTimeData = (endpoint, socketEvent, queryKey, refetchInterval = 30000) => {
  const [socket, setSocket] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoint);
      return data.data || [];
    },
    refetchInterval,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    const newSocket = io('/tracking', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log(`Connected to ${endpoint} socket`);
    });

    newSocket.on(socketEvent, (newData) => {
      qc.setQueryData(queryKey, (oldData) => {
        if (Array.isArray(oldData)) {
          const existingIndex = oldData.findIndex(item => item._id === newData._id);
          if (existingIndex >= 0) {
            const updatedData = [...oldData];
            updatedData[existingIndex] = newData;
            return updatedData;
          } else {
            return [newData, ...oldData];
          }
        }
        return newData;
      });
    });

    newSocket.on('disconnect', () => {
      console.log(`Disconnected from ${endpoint} socket`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [endpoint, socketEvent, queryKey, qc]);

  const manualRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, socket, manualRefetch };
};

export const useRealTimeVehicleTracking = () => {
  return useRealTimeData('/vehicles/live', 'vehicle:update', ['vehicles-live'], 15000);
};

export const useRealTimeCapacity = () => {
  return useRealTimeData('/capacity/realtime', 'capacity:update', ['capacity-realtime'], 10000);
};

export const useRealTimeFuel = () => {
  return useRealTimeData('/fuel/live', 'fuel:update', ['fuel-live'], 30000);
};

export const useRealTimeMaintenance = () => {
  return useRealTimeData('/maintenance/live', 'maintenance:update', ['maintenance-live'], 60000);
};
