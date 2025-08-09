
const CACHE_NAME = 'jinijjang-cache-v1-3-4';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{ if(k!==CACHE_NAME) return caches.delete(k); }))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp)=>{
      return resp || fetch(event.request).then((response)=>{
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request, copy));
        return response;
      }).catch(()=>resp);
    })
  );
});
