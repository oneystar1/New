import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { ArtSheet } from './art/ArtSheet';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.hash === '#art' ? <ArtSheet /> : <App />}
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
