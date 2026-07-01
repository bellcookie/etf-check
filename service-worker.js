// 只缓存图标等几乎不变的静态资源；index.html 和数据接口永远直接走网络，
// 保证每次更新代码后打开 App 都是最新版本，不会被旧缓存卡住。
const CACHE_NAME = "fund-tracker-shell-v2";
const SHELL_FILES = [
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
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
  const req = event.request;
  const url = req.url;

  // 页面主文件（index.html / 导航请求）永远直接走网络，绝不使用缓存，
  // 这样每次代码更新后打开 App 都能立刻拿到最新版本
  if(req.mode === "navigate" || url.indexOf("index.html") !== -1 || url.endsWith("/") ){
    event.respondWith(fetch(req).catch(function(){ return caches.match("./manifest.json"); }));
    return;
  }

  // 天天基金估值 + 东方财富历史净值/估值图 都永远走网络，不缓存，保证实时性/准确性
  if(url.indexOf("fundgz.1234567.com.cn") !== -1 || url.indexOf("fund.eastmoney.com") !== -1 || url.indexOf("dfcfw.com") !== -1){
    return;
  }

  // 其余（图标等静态资源）：缓存优先
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req);
    })
  );
});
