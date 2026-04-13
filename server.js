const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

// 遠山郷線(E1)のバス停データ（飯田駅→遠山郷(和田)の順）
const BUS_STOPS = [
  { name: '飯田駅前', lat: 35.51475, lng: 137.82098, order: 0 },
  { name: '本町1丁目', lat: 35.51320, lng: 137.82200, order: 1 },
  { name: '本町2丁目', lat: 35.51180, lng: 137.82250, order: 2 },
  { name: '本町3丁目', lat: 35.51050, lng: 137.82310, order: 3 },
  { name: '中央通り3丁目', lat: 35.50920, lng: 137.82380, order: 4 },
  { name: '中央通り2丁目', lat: 35.50780, lng: 137.82450, order: 5 },
  { name: '中央通り1丁目', lat: 35.50640, lng: 137.82520, order: 6 },
  { name: '飯田インター前', lat: 35.50300, lng: 137.82800, order: 7 },
  { name: '座光寺', lat: 35.49500, lng: 137.84200, order: 8 },
  { name: '上郷', lat: 35.48800, lng: 137.85500, order: 9 },
  { name: '天竜峡', lat: 35.45600, lng: 137.86400, order: 10 },
  { name: '川路', lat: 35.44200, lng: 137.86800, order: 11 },
  { name: '時又', lat: 35.43500, lng: 137.87200, order: 12 },
  { name: '駄科', lat: 35.42800, lng: 137.87600, order: 13 },
  { name: '毛賀', lat: 35.42000, lng: 137.88000, order: 14 },
  { name: '鼎', lat: 35.41200, lng: 137.88500, order: 15 },
  { name: '下山', lat: 35.40500, lng: 137.89000, order: 16 },
  { name: '三穂', lat: 35.39500, lng: 137.89500, order: 17 },
  { name: '喬木村役場前', lat: 35.38500, lng: 137.90000, order: 18 },
  { name: '富田', lat: 35.37500, lng: 137.90500, order: 19 },
  { name: '程野', lat: 35.36500, lng: 137.91000, order: 20 },
  { name: '為栗', lat: 35.35500, lng: 137.92000, order: 21 },
  { name: '下平', lat: 35.34500, lng: 137.93000, order: 22 },
  { name: '平岡', lat: 35.33500, lng: 137.94000, order: 23 },
  { name: '遠山口', lat: 35.32500, lng: 137.95000, order: 24 },
  { name: '木沢', lat: 35.31500, lng: 137.96000, order: 25 },
  { name: '和田（遠山郷）', lat: 35.33110, lng: 137.96920, order: 26 },
];

// キャッシュ
let busDataCache = {
  lastUpdated: null,
  buses: [],
  stops: [],
  isRunning: false
};

// くるらからバス位置情報をスクレイピング
async function scrapeBusData() {
  try {
    // 両方向のマップページを取得
    const directions = ['E1'];
    const allBuses = [];

    for (const route of directions) {
      // まず location ページでバスが走っているか確認
      const locationUrl = `https://bus-kurura.jp/IBNAVI_location.php?plant=1&route=${route}`;
      const locationRes = await fetch(locationUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9'
        }
      });
      const locationHtml = await locationRes.text();

      // Cookieを保持
      const cookies = locationRes.headers.raw()['set-cookie'] || [];
      const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');

      // マップページを取得
      const mapUrl = `https://bus-kurura.jp/IBNAVI_map.php?plant=1&route=${route}`;
      const mapRes = await fetch(mapUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
          'Cookie': cookieStr
        }
      });
      const mapHtml = await mapRes.text();

      // GPS座標を抽出（var gps = [lat, lng]）
      const gpsMatch = mapHtml.match(/var\s+gps\s*=\s*\[([0-9.]+),\s*([0-9.]+)\]/);
      if (gpsMatch) {
        const lat = parseFloat(gpsMatch[1]);
        const lng = parseFloat(gpsMatch[2]);

        // デフォルト位置（飯田駅）でないかチェック
        if (lat !== 35.514751 || lng !== 137.816897) {
          allBuses.push({
            route: route,
            lat: lat,
            lng: lng,
            timestamp: new Date().toISOString()
          });
        }
      }

      // markersData からバス停座標を取得
      const markersMatch = mapHtml.match(/var\s+markersData\s*=\s*(\[[\s\S]*?\]);/);
      if (markersMatch) {
        try {
          const markersStr = markersMatch[1]
            .replace(/'/g, '"')
            .replace(/,\s*]/g, ']');
          const markers = JSON.parse(markersStr);
          if (markers.length > 0) {
            // 動的に取得したバス停データで更新
            busDataCache.stops = markers.map((m, i) => ({
              name: m[2] || `バス停${i + 1}`,
              lat: parseFloat(m[0]),
              lng: parseFloat(m[1]),
              order: i
            }));
          }
        } catch (e) {
          // パース失敗時はデフォルトのバス停データを使用
        }
      }
    }

    busDataCache.buses = allBuses;
    busDataCache.isRunning = allBuses.length > 0;
    busDataCache.lastUpdated = new Date().toISOString();

    return busDataCache;
  } catch (error) {
    console.error('スクレイピングエラー:', error.message);
    busDataCache.lastUpdated = new Date().toISOString();
    return busDataCache;
  }
}

// 2点間の距離を計算（km）
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// バスから最寄りバス停までの到着予測時間を計算
function estimateArrival(busLat, busLng, stopLat, stopLng) {
  const distance = haversineDistance(busLat, busLng, stopLat, stopLng);
  // 山間路線の平均速度: 約25km/h
  const avgSpeedKmh = 25;
  const timeMinutes = (distance / avgSpeedKmh) * 60;
  return Math.round(timeMinutes);
}

// 静的ファイル配信
app.use(express.static(path.join(__dirname, 'public')));

// API: バス停一覧
app.get('/api/stops', (req, res) => {
  const stops = busDataCache.stops.length > 0 ? busDataCache.stops : BUS_STOPS;
  res.json(stops);
});

// API: バス位置情報を取得
app.get('/api/bus-location', async (req, res) => {
  // キャッシュが10秒以上古い場合は再取得
  const now = Date.now();
  const cacheAge = busDataCache.lastUpdated
    ? now - new Date(busDataCache.lastUpdated).getTime()
    : Infinity;

  if (cacheAge > 10000) {
    await scrapeBusData();
  }

  res.json(busDataCache);
});

// API: 到着時間予測
app.get('/api/estimate', async (req, res) => {
  const { stopIndex, lat, lng } = req.query;

  // 最新のバスデータを取得
  const now = Date.now();
  const cacheAge = busDataCache.lastUpdated
    ? now - new Date(busDataCache.lastUpdated).getTime()
    : Infinity;

  if (cacheAge > 10000) {
    await scrapeBusData();
  }

  const stops = busDataCache.stops.length > 0 ? busDataCache.stops : BUS_STOPS;

  // 指定されたバス停またはユーザーの現在地
  let targetLat, targetLng, targetName;
  if (stopIndex !== undefined) {
    const stop = stops[parseInt(stopIndex)];
    if (!stop) return res.status(400).json({ error: 'バス停が見つかりません' });
    targetLat = stop.lat;
    targetLng = stop.lng;
    targetName = stop.name;
  } else if (lat && lng) {
    targetLat = parseFloat(lat);
    targetLng = parseFloat(lng);
    targetName = '現在地付近';
  } else {
    return res.status(400).json({ error: 'stopIndex または lat/lng を指定してください' });
  }

  if (!busDataCache.isRunning || busDataCache.buses.length === 0) {
    return res.json({
      target: targetName,
      isRunning: false,
      message: '現在バスは運行していません',
      buses: []
    });
  }

  const estimates = busDataCache.buses.map(bus => {
    const minutes = estimateArrival(bus.lat, bus.lng, targetLat, targetLng);
    const distance = haversineDistance(bus.lat, bus.lng, targetLat, targetLng);
    return {
      route: bus.route,
      busLat: bus.lat,
      busLng: bus.lng,
      estimatedMinutes: minutes,
      distanceKm: Math.round(distance * 10) / 10,
      timestamp: bus.timestamp
    };
  });

  estimates.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);

  res.json({
    target: targetName,
    targetLat,
    targetLng,
    isRunning: true,
    estimates
  });
});

// 定期的にスクレイピング（30秒ごと）
setInterval(scrapeBusData, 30000);

app.listen(PORT, () => {
  console.log(`🚌 くるらバストラッカー起動: http://localhost:${PORT}`);
  // 初回スクレイピング
  scrapeBusData();
});
