const C='kuivaus-v12';
const F=['./','index.html','style.css','app.js','store.js','data.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 const u=new URL(e.request.url);
 const live=/\.(?:html|css|js)$/.test(u.pathname)||u.pathname.endsWith('/')||u.pathname.endsWith('/app');
 if(live){
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(cache=>cache.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
  return;
 }
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
