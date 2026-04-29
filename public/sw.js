// GOトラッカー Service Worker
// 戦略:
//   - アプリ本体(HTML/CSS/JS/アイコン/ルートデータ)はキャッシュしてオフラインでも起動可
//   - APIリクエスト(/api/*)はネットワーク優先＋失敗時はキャッシュ(直前データを表示)
//   - 地図タイル(Google)はキャッシュして電波が悪い場所でも見えるように

const APP_CACHE = 'go-tracker-app-v3';
const RUNTIME_CACHE = 'go-tracker-runtime-v3';
const TILE_CACHE = 'go-tracker-tiles-v3';

const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/routes.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// インストール時: アプリ本体をプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => ![APP_CACHE, RUNTIME_CACHE, TILE_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// fetch: リクエスト種別ごとに戦略を変える
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. APIリクエスト: ネットワーク優先 → 失敗時キャッシュ
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  // 2. Google Maps タイル: キャッシュ優先 (古くても表示できるように)
  if (url.hostname.endsWith('google.com') && url.pathname.includes('/vt')) {
    event.respondWith(cacheFirst(req, TILE_CACHE));
    return;
  }

  // 3. 同一オリジンの静的ファイル: キャッシュ優先 → 失敗時ネットワーク
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, APP_CACHE));
    return;
  }

  // 4. その他CDN(unpkg等): ネットワーク優先 → キャッシュ
  event.respondWith(networkFirst(req, RUNTIME_CACHE));
});

async function networkFirst(req, cacheName) {
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) {
    // バックグラウンドで更新も試みる
    fetch(req).then((fresh) => {
      if (fresh && fresh.status === 200) {
        caches.open(cacheName).then((cache) => cache.put(req, fresh));
      }
    }).catch(() => {});
    return cached;
  }
  const fresh = await fetch(req);
  if (fresh && fresh.status === 200) {
    const cache = await caches.open(cacheName);
    cache.put(req, fresh.clone());
  }
  return fresh;
}
