// This is the service worker template
self.__WB_MANIFEST; // Workbox injects the precache manifest here

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
});

self.addEventListener('fetch', (event) => {
  console.log('Service worker fetching...', event.request.url);
});
