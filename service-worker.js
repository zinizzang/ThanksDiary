
const CACHE_NAME = 'jinijjang-cache-v1-3-5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{ if(k!==CACHE_NAME) return caches.delete(k); }))));
  self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(resp=>{
      return resp || fetch(e.request).then(response=>{
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(e.request, copy));
        return response;
      }).catch(()=>resp);
    })
  );
});
