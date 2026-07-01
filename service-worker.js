// 只缓存 App 外壳（HTML/CSS/JS/图标），不缓存基金数据本身，保证数据始终是最新请求
const CACHE_NAME = "fund-tracker-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  const url = event.request.url;
  // 天天基金估值 + 东方财富历史净值都永远走网络，不缓存，保证实时性/准确性
  if(url.indexOf("fundgz.1234567.com.cn") !== -1 || url.indexOf("fund.eastmoney.com") !== -1){
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request);
    })
  );
});
