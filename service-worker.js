
self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open('td-static-v7').then(c=> c.addAll([
    '/', './', 'index.html','styles.css','app.js','manifest.json'
  ])));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.map(k=> k==='td-static-v7'? null : caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached=> cached || fetch(req).then(res=>{
      const copy = res.clone();
      caches.open('td-static-v7').then(c=> c.put(req, copy));
      return res;
    }).catch(()=> cached))
  );
});
