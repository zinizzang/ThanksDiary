// very simple cache with version bump
const CACHE='td-2-7-1';
const ASSETS=[
  '/', 'index.html','styles.css','app.js',
  'images/star-yellow.svg','images/brain.svg','images/check.svg','images/search.svg','images/mirror.svg','images/folder.svg','images/tag.svg','images/lock.svg','images/box.svg'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if (url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
  }
});
