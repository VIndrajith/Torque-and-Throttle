import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite dev server WebSocket warnings (HMR is disabled in the cloud container)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const msg = event.reason?.message || event.reason?.stack || String(event.reason || '');
      if (
        typeof msg === 'string' &&
        (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('ws:') || msg.includes('wss:'))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || event.error?.message || String(event || '');
      if (
        typeof msg === 'string' &&
        (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('failed to connect'))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
