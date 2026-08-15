/*!
 * 茴禧花坊薪資表 · Service Worker
 * 版權所有 © 2026 CTM. All rights reserved.
 * 未經授權不得重製、散布或作商業使用。
 */
/* Service Worker
   改版時把 VERSION 加一，使用者下次開啟就會拿到新版 */
var VERSION = "huixi-v20";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(VERSION).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === VERSION ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(ev){
  var req = ev.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);

  /* 雲端同步一律走網路，不進快取 */
  if(url.origin !== location.origin) return;

  if(req.mode === "navigate" || req.destination === "document"){
    /* 網頁：優先取新版，離線時退回快取 */
    ev.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(VERSION).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  /* 其他靜態檔：先用快取 */
  ev.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(VERSION).then(function(c){ c.put(req, copy); });
        return res;
      });
    })
  );
});
