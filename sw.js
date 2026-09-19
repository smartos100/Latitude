/* Latitude service worker: keeps the app working with no signal. Build 202609190002 */
var CORE='latitude-core-202609190002',RT='latitude-rt';
var SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
var RT_HOSTS=['fonts.googleapis.com','fonts.gstatic.com','tile.openstreetmap.org','gibs.earthdata.nasa.gov'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CORE).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CORE&&k!==RT}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
function trim(name,max){
  caches.open(name).then(function(c){c.keys().then(function(ks){if(ks.length>max) ks.slice(0,ks.length-max+40).forEach(function(k){c.delete(k)})})});
}
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var url=new URL(req.url);
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(function(r){
      if(r&&r.ok){var copy=r.clone();caches.open(CORE).then(function(c){c.put(req,copy)})}
      return r;
    }).catch(function(){
      return caches.match(req,{ignoreSearch:true}).then(function(m){return m||(req.mode==='navigate'?caches.match('index.html'):Response.error())});
    }));
    return;
  }
  if(RT_HOSTS.indexOf(url.hostname)>-1){
    e.respondWith(caches.open(RT).then(function(c){
      return c.match(req).then(function(hit){
        var net=fetch(req).then(function(r){
          if(r&&(r.ok||r.type==='opaque')){c.put(req,r.clone());trim(RT,600)}
          return r;
        }).catch(function(){return hit||Response.error()});
        return hit||net;
      });
    }));
  }
});
