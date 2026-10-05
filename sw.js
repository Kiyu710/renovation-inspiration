const CACHE_NAME = 'linggan-pages-v3';
const SHELL = ['index.html','styles.css','app.js','checklist.css','checklist.js','checklist-core.js','manifest.webmanifest','icon.svg'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('linggan-pages-')||k==='linggan-shell-v1')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));}
  return response;
 }).catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?await caches.match(new URL('index.html',self.registration.scope).href):Response.error())));
});
