const CACHE_NAME = 'viaje-covenas-v1';
const urlsToCache = [
  '/Viaje-a-cove-as/',
  '/Viaje-a-cove-as/index.html',
  '/Viaje-a-cove-as/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Activa inmediatamente el nuevo SW
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker activándose...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Toma control inmediato
});

// Interceptar solicitudes de red
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }
        
        // Si no está en cache, pedirlo a la red
        return fetch(event.request).then(function(response) {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function() {
          // Si falla la red, mostrar página offline básica
          return new Response(
            '<!DOCTYPE html><html><head><title>Sin conexión</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#000;color:#fff}h1{color:#ff6b6b}</style></head><body><h1>Sin conexión a Internet</h1><p>Esta página no está disponible offline</p><button onclick="window.location.reload()">Reintentar</button></body></html>',
            { 
              headers: { 
                'Content-Type': 'text/html' 
              } 
            }
          );
        });
      })
  );
});