import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Precache static assets generated by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Cache static resources (CSS, JS, Images)
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'image',
  new StaleWhileRevalidate()
);

// Cache pages
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst()
);

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});