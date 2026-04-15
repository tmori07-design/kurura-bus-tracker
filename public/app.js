// くるらトラッカー - フロントエンド

let map;
let busMarkers = [];
let stopMarkers = [];
let selectedStopMarker = null;
let stops = [];
let refreshInterval = null;
let currentDirection = 'to-wada'; // 現在の方向選択
let routeLine = null; // ルートライン
let currentBuses = []; // 最新のバス位置

// 7:00飯田駅前発で通過（↓）する停留所（データに残っているもののみ）
const skippedToWada = [
  '地域交流センター', '郵便局前', 'かぐらの湯'
];

// 16:24かぐらの湯発で通過（↓）する停留所（データに残っているもののみ）
const skippedToIida = [
  '丸五商店前', '上新町', '中学校前', '押出', '酒屋前',
  '大島', '観音前', '日影沢', '畑上', '小道木'
];

// バスアイコン
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: '<div style="background:#e84393;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(232,67,147,0.5);border:2px solid white;">🚌</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

// バス停アイコン
const stopIcon = L.divIcon({
  className: 'stop-marker',
  html: '<div style="background:white;color:#e84393;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 1px 4px rgba(0,0,0,0.2);border:2px solid #e84393;font-weight:bold;">●</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// 初期化
async function init() {
  // Leafletマップ初期化（飯田駅付近）
  // fadeAnimation無効化: GoogleタイルでfitBounds直後にタイルがopacity:0のまま残るケースの対策
  map = L.map('map', { fadeAnimation: false }).setView([35.5147, 137.8210], 12);

  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google',
    maxZoom: 18,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }).addTo(map);

  // バス停データ取得
  await loadStops();

  // バス位置データ取得
  await updateBusData();

  // 10秒ごとに更新
  refreshInterval = setInterval(updateBusData, 10000);

  // イベントリスナー
  document.getElementById('btn-estimate').addEventListener('click', getEstimate);
  document.getElementById('btn-bus-location').addEventListener('click', showBusLocation);
  document.getElementById('direction-select').addEventListener('change', (e) => {
    currentDirection = e.target.value;
    updateStopDropdown();
    updateBusData();
  });

  // 方向に応じたバス停リスト初期化
  updateStopDropdown();
}

// 方向に応じたバス停ドロップダウン更新
function updateStopDropdown() {
  const select = document.getElementById('stop-select');
  select.innerHTML = '<option value="">-- バス停を選んでください --</option>';

  const iidaOnlyNames = ['知久町１丁目', '知久町３丁目', '飯田病院前'];

  let orderedStops;
  if (currentDirection === 'to-wada') {
    // 飯田→和田（7:00飯田駅前発）: 復路専用と通過停留所を除く
    orderedStops = stops
      .filter(s => s.order <= 68
        && !iidaOnlyNames.includes(s.name)
        && !skippedToWada.includes(s.name))
      .sort((a, b) => a.order - b.order);
  } else {
    // 和田→飯田（16:24かぐらの湯発）: 往路専用と通過停留所を除く
    const wadaOnlyNames = ['飯田市役所'];
    const commonStops = stops
      .filter(s => s.order <= 68
        && !wadaOnlyNames.includes(s.name)
        && !skippedToIida.includes(s.name))
      .sort((a, b) => b.order - a.order);

    // 中央広場の後に復路専用停留所（知久町・飯田病院前）を挿入
    orderedStops = [];
    for (const s of commonStops) {
      orderedStops.push(s);
      if (s.name === '中央広場') {
        for (const name of iidaOnlyNames) {
          const iidaStop = stops.find(st => st.name === name);
          if (iidaStop) orderedStops.push(iidaStop);
        }
      }
    }
  }

  orderedStops.forEach((stop) => {
    const option = document.createElement('option');
    option.value = stops.indexOf(stop);
    option.textContent = stop.name;
    select.appendChild(option);
  });

  // ルートラインを選択便の停車停留所のみに更新
  updateRouteLine(orderedStops);
}

// ルートライン更新（選択便の停車停留所のみ）
function updateRouteLine(orderedStops) {
  if (routeLine) map.removeLayer(routeLine);
  if (orderedStops.length > 1) {
    const routeCoords = orderedStops.map(s => [s.lat, s.lng]);
    routeLine = L.polyline(routeCoords, {
      color: '#e84393',
      weight: 3,
      opacity: 0.5,
      dashArray: '8, 8'
    }).addTo(map);
  }
}

// バス停データ読み込み
async function loadStops() {
  try {
    const res = await fetch('/api/stops');
    stops = await res.json();

    // マップにバス停マーカーを追加
    stops.forEach((stop, i) => {
      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`<b>${stop.name}</b><br><button onclick="selectStop(${i})" style="margin-top:4px;padding:4px 8px;background:#e84393;color:white;border:none;border-radius:4px;cursor:pointer;">ここの到着時間を調べる</button>`);
      stopMarkers.push(marker);
    });

    // マップを路線全体にフィット（アニメーション無効 - Googleタイルで古いタイルが残るケースの対策）
    if (stops.length > 1) {
      const routeCoords = stops.map(s => [s.lat, s.lng]);
      map.fitBounds(L.latLngBounds(routeCoords).pad(0.1), { animate: false });
    }
  } catch (error) {
    console.error('バス停データ取得エラー:', error);
  }
}

// バス位置データ更新
async function updateBusData() {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const statusBar = document.getElementById('status-bar');
  const lastUpdated = document.getElementById('last-updated');
  const busInfo = document.getElementById('bus-info');
  const busList = document.getElementById('bus-list');

  try {
    const res = await fetch('/api/bus-location');
    const data = await res.json();

    // 既存バスマーカーを削除
    busMarkers.forEach(m => map.removeLayer(m));
    busMarkers = [];

    // 最新のバスリストを保存（バス現在地ボタンで使用）
    currentBuses = data.isRunning ? data.buses : [];

    if (data.isRunning && data.buses.length > 0) {
      // バス運行中
      statusBar.className = 'status-bar running';
      statusIcon.textContent = '🟢';
      statusText.textContent = `${data.buses.length}台のバスが運行中`;

      busInfo.classList.remove('hidden');
      busList.innerHTML = '';

      data.buses.forEach((bus, idx) => {
        const nearStop = bus.nearestStop || '不明';
        // バックエンドからの direction を使用（フォールバックで号車表示）
        let dirLabel;
        if (bus.direction === 'to-wada') dirLabel = '飯田→和田';
        else if (bus.direction === 'to-iida') dirLabel = '和田→飯田';
        else dirLabel = `${idx + 1}号車`;

        // マーカー追加
        const marker = L.marker([bus.lat, bus.lng], { icon: busIcon })
          .addTo(map)
          .bindPopup(`<b>遠山郷線 ${dirLabel}</b><br>最寄り: ${nearStop}<br>更新: ${new Date(bus.timestamp).toLocaleTimeString('ja-JP')}`);
        busMarkers.push(marker);

        // バスカード追加
        const card = document.createElement('div');
        card.className = 'bus-card';
        card.innerHTML = `
          <span class="bus-icon">🚌</span>
          <div class="bus-detail">
            <div class="bus-route">遠山郷線 ${dirLabel}</div>
            <div class="bus-pos">最寄り: ${nearStop}</div>
          </div>
        `;
        card.addEventListener('click', () => {
          map.setView([bus.lat, bus.lng], 15);
          marker.openPopup();
        });
        busList.appendChild(card);
      });
    } else {
      // バス非運行
      statusBar.className = 'status-bar stopped';
      statusIcon.textContent = '🟡';
      statusText.textContent = '現在バスは運行していません';
      busInfo.classList.add('hidden');
    }

    // 更新時刻
    if (data.lastUpdated) {
      const time = new Date(data.lastUpdated).toLocaleTimeString('ja-JP');
      lastUpdated.textContent = `更新: ${time}`;
    }
  } catch (error) {
    statusBar.className = 'status-bar stopped';
    statusIcon.textContent = '🔴';
    statusText.textContent = 'サーバー接続エラー';
    console.error('バスデータ取得エラー:', error);
  }
}

// バスの現在地を表示（方向に合うバスを優先、無ければ先頭のバスへ）
function showBusLocation() {
  if (currentBuses.length === 0) {
    alert('現在バスは運行していません');
    return;
  }

  const bus = currentBuses.find(b => b.direction === currentDirection) || currentBuses[0];
  const idx = busMarkers.length > 0
    ? currentBuses.indexOf(bus)
    : -1;

  map.setView([bus.lat, bus.lng], 15);
  if (idx >= 0 && busMarkers[idx]) {
    busMarkers[idx].openPopup();
  }
}

// バス停選択（マップポップアップから）
function selectStop(index) {
  document.getElementById('stop-select').value = index;
  getEstimate();
}
// window に公開
window.selectStop = selectStop;

// 到着予測を取得
async function getEstimate() {
  const select = document.getElementById('stop-select');
  const stopIndex = select.value;

  if (stopIndex === '') {
    alert('バス停を選択してください');
    return;
  }

  const resultDiv = document.getElementById('estimate-result');
  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = '<p class="loading" style="text-align:center;color:#999;">計算中...</p>';

  // 選択されたバス停をハイライト
  if (selectedStopMarker) map.removeLayer(selectedStopMarker);
  const stop = stops[parseInt(stopIndex)];
  selectedStopMarker = L.circleMarker([stop.lat, stop.lng], {
    radius: 15,
    color: '#e84393',
    fillColor: '#e84393',
    fillOpacity: 0.2,
    weight: 2
  }).addTo(map);
  map.setView([stop.lat, stop.lng], 14);

  try {
    const res = await fetch(`/api/estimate?stopIndex=${stopIndex}`);
    const data = await res.json();
    renderEstimate(data);
  } catch (error) {
    resultDiv.innerHTML = '<p style="color:red;">エラーが発生しました</p>';
  }
}

// 到着予測結果を表示
function renderEstimate(data) {
  const resultDiv = document.getElementById('estimate-result');

  if (!data.isRunning) {
    resultDiv.innerHTML = `
      <div class="estimate-no-bus">
        <div class="icon">😴</div>
        <div class="message">現在バスは運行していません</div>
        <div class="sub">運行時間内に再度お試しください</div>
      </div>
    `;
    return;
  }

  if (data.estimates.length === 0) {
    resultDiv.innerHTML = `
      <div class="estimate-no-bus">
        <div class="icon">🔍</div>
        <div class="message">バスが見つかりません</div>
      </div>
    `;
    return;
  }

  const nearest = data.estimates[0];

  const stopsInfo = nearest.numStops > 0
    ? `${nearest.numStops}停留所先`
    : '付近';

  // 到着時刻（現在時刻 + 予測分数）
  const arrival = new Date(Date.now() + nearest.estimatedMinutes * 60 * 1000);
  const hh = arrival.getHours();
  const mm = String(arrival.getMinutes()).padStart(2, '0');

  resultDiv.innerHTML = `
    <div class="estimate-target">📍 ${data.target} への到着予測</div>
    <div class="estimate-time">
      約 ${hh}:${mm} <span class="unit">着</span>
    </div>
    <div class="estimate-meta">
      <span class="meta-item">🚏 ${stopsInfo}</span>
      <span class="meta-item">📐 道路距離 約${nearest.distanceKm}km</span>
    </div>
    <div class="estimate-detail">
      更新: ${new Date(nearest.timestamp).toLocaleTimeString('ja-JP')}
    </div>
    ${data.estimates.length > 1 ? `
      <div style="margin-top:10px;font-size:12px;color:#999;">
        他 ${data.estimates.length - 1} 台のバスも運行中
      </div>
    ` : ''}
  `;
}

// Haversine距離計算（km）
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', init);
