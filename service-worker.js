
/* ThanksDiary SW v2.7.0 - cache safe */
const VERSION = 'v2.7.0';
const STATIC_CACHE = `td-static-${VERSION}`;
const ALLOW_CACHE = ['.css','.js','.png','.jpg','.jpeg','.webp','.svg','.woff2','.woff','.ttf','.ico','manifest.json'];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>!k.includes(VERSION)).map(k=>caches.delete(k)));
    await clients.claim();
  })());
});

self.addEventListener('message', (e)=>{
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // HTML/navigation -> network first
  if (req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html')){
    event.respondWith((async ()=>{
      try{
        const net = await fetch(req);
        return net;
      }catch(err){
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('./index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Only cache allowed extensions
  if (!ALLOW_CACHE.some(ext => url.pathname.endsWith(ext))) return;

  // stale-while-revalidate
  event.respondWith((async ()=>{
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then(res => {
      cache.put(req, res.clone()).catch(()=>{});
      return res;
    }).catch(()=>cached);
    return cached || fetchPromise;
  })());
});
