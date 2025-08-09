// SW 2.7.2-integrated-fix2 — cache-safe
const CACHE='td-2.7.2-integrated-fix2-1754752193';
const ASSETS=['./','index.html?v=2.7.2-integrated-fix2','styles.css?v=2.7.2-integrated-fix2','app.js?v=2.7.2-integrated-fix2','manifest.json','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url); if(u.origin===location.origin) e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
