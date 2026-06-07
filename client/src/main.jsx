import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './index.css';
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1, refetchOnWindowFocus: false },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;color:red;">Error: Root element not found</div>';
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { fontFamily: 'Inter', fontSize: 14, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
                success: { style: { background: '#2D7D3A', color: '#fff' } },
                error: { style: { background: '#B5251A', color: '#fff' } },
              }}
            />
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

