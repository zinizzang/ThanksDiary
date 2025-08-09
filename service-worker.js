
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open('td-v271').then(c=>c.addAll([
    './','./index.html','./styles.css','./app.js','./manifest.json'
  ])));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=> k!=='td-v271' && caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request)));
  }
});
