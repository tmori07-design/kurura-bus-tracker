#!/usr/bin/env python3
"""くるらバストラッカー - バックエンドサーバー"""

import http.server
import json
import os
import re
import time
import math
import threading
from urllib.request import urlopen, Request
from urllib.error import URLError
from urllib.parse import urlparse, parse_qs, quote

PORT = 3000
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')

# 設定読み込み
def load_config():
    try:
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"google_maps_api_key": ""}

config = load_config()
GOOGLE_MAPS_API_KEY = config.get("google_maps_api_key", "")

# 遠山郷線(E1)のバス停データ（飯田駅→遠山郷(和田)の順）
BUS_STOPS = [
    {"name": "飯田駅前", "lat": 35.51475, "lng": 137.82098, "order": 0},
    {"name": "本町1丁目", "lat": 35.51320, "lng": 137.82200, "order": 1},
    {"name": "本町2丁目", "lat": 35.51180, "lng": 137.82250, "order": 2},
    {"name": "本町3丁目", "lat": 35.51050, "lng": 137.82310, "order": 3},
    {"name": "中央通り3丁目", "lat": 35.50920, "lng": 137.82380, "order": 4},
    {"name": "中央通り2丁目", "lat": 35.50780, "lng": 137.82450, "order": 5},
    {"name": "中央通り1丁目", "lat": 35.50640, "lng": 137.82520, "order": 6},
    {"name": "飯田インター前", "lat": 35.50300, "lng": 137.82800, "order": 7},
    {"name": "座光寺", "lat": 35.49500, "lng": 137.84200, "order": 8},
    {"name": "上郷", "lat": 35.48800, "lng": 137.85500, "order": 9},
    {"name": "天竜峡", "lat": 35.45600, "lng": 137.86400, "order": 10},
    {"name": "川路", "lat": 35.44200, "lng": 137.86800, "order": 11},
    {"name": "時又", "lat": 35.43500, "lng": 137.87200, "order": 12},
    {"name": "駄科", "lat": 35.42800, "lng": 137.87600, "order": 13},
    {"name": "毛賀", "lat": 35.42000, "lng": 137.88000, "order": 14},
    {"name": "鼎", "lat": 35.41200, "lng": 137.88500, "order": 15},
    {"name": "下山", "lat": 35.40500, "lng": 137.89000, "order": 16},
    {"name": "三穂", "lat": 35.39500, "lng": 137.89500, "order": 17},
    {"name": "喬木村役場前", "lat": 35.38500, "lng": 137.90000, "order": 18},
    {"name": "富田", "lat": 35.37500, "lng": 137.90500, "order": 19},
    {"name": "程野", "lat": 35.36500, "lng": 137.91000, "order": 20},
    {"name": "為栗", "lat": 35.35500, "lng": 137.92000, "order": 21},
    {"name": "下平", "lat": 35.34500, "lng": 137.93000, "order": 22},
    {"name": "平岡", "lat": 35.33500, "lng": 137.94000, "order": 23},
    {"name": "遠山口", "lat": 35.32500, "lng": 137.95000, "order": 24},
    {"name": "木沢", "lat": 35.31500, "lng": 137.96000, "order": 25},
    {"name": "和田（遠山郷）", "lat": 35.33110, "lng": 137.96920, "order": 26},
]

# ルーティング結果キャッシュ（同じ区間を何度も問い合わせないように）
route_cache = {}
route_cache_lock = threading.Lock()

# バスデータキャッシュ
bus_data_cache = {
    "lastUpdated": None,
    "buses": [],
    "stops": [],
    "isRunning": False
}
cache_lock = threading.Lock()


def haversine_distance(lat1, lng1, lat2, lng2):
    """2点間の直線距離を計算（km）"""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_nearest_stop_index(lat, lng, stops):
    """最寄りバス停のインデックスを返す"""
    min_dist = float('inf')
    nearest = 0
    for i, s in enumerate(stops):
        d = haversine_distance(lat, lng, s["lat"], s["lng"])
        if d < min_dist:
            min_dist = d
            nearest = i
    return nearest


def get_waypoints_between(bus_lat, bus_lng, target_stop_idx, stops):
    """バス現在地からターゲットバス停までの経由地点リストを返す。
    バスの進行方向を推定し、途中のバス停を順番に返す。"""
    bus_nearest = find_nearest_stop_index(bus_lat, bus_lng, stops)

    if bus_nearest == target_stop_idx:
        # バスがターゲット付近にいる場合
        return [], 0

    # バス→ターゲットの方向で途中のバス停を取得
    if bus_nearest < target_stop_idx:
        # 飯田→遠山郷方面
        waypoint_stops = stops[bus_nearest:target_stop_idx + 1]
    else:
        # 遠山郷→飯田方面
        waypoint_stops = stops[target_stop_idx:bus_nearest + 1][::-1]

    # 途中停車数
    num_intermediate_stops = abs(target_stop_idx - bus_nearest)

    return waypoint_stops, num_intermediate_stops


def route_via_google_maps(origin_lat, origin_lng, dest_lat, dest_lng, waypoints):
    """Google Maps Directions APIでルーティング（渋滞考慮）"""
    if not GOOGLE_MAPS_API_KEY:
        return None

    origin = f"{origin_lat},{origin_lng}"
    dest = f"{dest_lat},{dest_lng}"

    url = (
        f"https://maps.googleapis.com/maps/api/directions/json"
        f"?origin={origin}"
        f"&destination={dest}"
        f"&departure_time=now"
        f"&traffic_model=best_guess"
    )

    # 途中のバス停をウェイポイントとして追加（最大23個制限）
    if waypoints and len(waypoints) > 2:
        # 始点・終点を除いた中間点をウェイポイントに
        mid_points = waypoints[1:-1]
        # 多すぎる場合は間引く
        if len(mid_points) > 10:
            step = len(mid_points) / 10
            mid_points = [mid_points[int(i * step)] for i in range(10)]
        wp_str = "|".join(f"via:{s['lat']},{s['lng']}" for s in mid_points)
        url += f"&waypoints={quote(wp_str, safe=':|,')}"

    url += f"&key={GOOGLE_MAPS_API_KEY}"

    try:
        req = Request(url, headers={'Accept': 'application/json'})
        res = urlopen(req, timeout=10)
        data = json.loads(res.read().decode('utf-8'))

        if data.get("status") != "OK" or not data.get("routes"):
            print(f"Google Maps APIエラー: {data.get('status')}")
            return None

        route = data["routes"][0]
        total_duration = 0
        total_distance = 0

        for leg in route["legs"]:
            # 渋滞考慮の所要時間があればそれを使う
            if "duration_in_traffic" in leg:
                total_duration += leg["duration_in_traffic"]["value"]
            else:
                total_duration += leg["duration"]["value"]
            total_distance += leg["distance"]["value"]

        return {
            "duration_seconds": total_duration,
            "duration_minutes": round(total_duration / 60),
            "distance_km": round(total_distance / 1000, 1),
            "source": "google_maps",
            "traffic_aware": "duration_in_traffic" in route["legs"][0]
        }
    except Exception as e:
        print(f"Google Maps APIエラー: {e}")
        return None


def route_via_osrm(origin_lat, origin_lng, dest_lat, dest_lng, waypoints):
    """OSRM（無料）でルーティング"""
    # OSRM座標はlng,lat順
    coords = [f"{origin_lng},{origin_lat}"]

    if waypoints and len(waypoints) > 2:
        mid_points = waypoints[1:-1]
        # 多すぎる場合は間引く
        if len(mid_points) > 15:
            step = len(mid_points) / 15
            mid_points = [mid_points[int(i * step)] for i in range(15)]
        for s in mid_points:
            coords.append(f"{s['lng']},{s['lat']}")

    coords.append(f"{dest_lng},{dest_lat}")
    coords_str = ";".join(coords)

    url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=false"

    try:
        req = Request(url, headers={
            'User-Agent': 'KururaTracker/1.0',
            'Accept': 'application/json'
        })
        res = urlopen(req, timeout=10)
        data = json.loads(res.read().decode('utf-8'))

        if data.get("code") != "Ok" or not data.get("routes"):
            print(f"OSRMエラー: {data.get('code')}")
            return None

        route = data["routes"][0]
        duration = route["duration"]  # 秒
        distance = route["distance"]  # メートル

        # バス停での停車時間を加算（各停留所30秒）
        if waypoints:
            num_stops = max(0, len(waypoints) - 2)
            duration += num_stops * 30

        return {
            "duration_seconds": round(duration),
            "duration_minutes": round(duration / 60),
            "distance_km": round(distance / 1000, 1),
            "source": "osrm",
            "traffic_aware": False
        }
    except Exception as e:
        print(f"OSRMエラー: {e}")
        return None


def estimate_with_routing(bus_lat, bus_lng, target_lat, target_lng,
                          target_stop_idx, stops):
    """ルーティングAPIを使った到着時間推定"""
    # 経由バス停を取得
    waypoints, num_stops = get_waypoints_between(
        bus_lat, bus_lng, target_stop_idx, stops)

    # キャッシュキー（バス位置を0.001度単位で丸めてキャッシュ）
    cache_key = (
        round(bus_lat, 3), round(bus_lng, 3),
        round(target_lat, 3), round(target_lng, 3)
    )

    with route_cache_lock:
        cached = route_cache.get(cache_key)
        if cached and time.time() - cached["cached_at"] < 60:
            result = dict(cached["result"])
            result["num_stops"] = num_stops
            result["cached"] = True
            return result

    # Google Maps → OSRM → フォールバック の優先順で試行
    result = None

    if GOOGLE_MAPS_API_KEY:
        result = route_via_google_maps(
            bus_lat, bus_lng, target_lat, target_lng, waypoints)

    if result is None:
        result = route_via_osrm(
            bus_lat, bus_lng, target_lat, target_lng, waypoints)

    if result is None:
        # 両方失敗した場合：バス停経由の道路距離を概算
        route_distance = 0
        points = [(bus_lat, bus_lng)]
        for s in (waypoints if waypoints else []):
            points.append((s["lat"], s["lng"]))
        points.append((target_lat, target_lng))
        for i in range(len(points) - 1):
            route_distance += haversine_distance(
                points[i][0], points[i][1],
                points[i + 1][0], points[i + 1][1])
        # 直線距離の1.3倍を道路距離とし、平均25km/hで計算
        road_distance = route_distance * 1.3
        duration_min = round((road_distance / 25) * 60)
        # バス停停車時間を加算
        duration_min += round(num_stops * 0.5)
        result = {
            "duration_seconds": duration_min * 60,
            "duration_minutes": duration_min,
            "distance_km": round(road_distance, 1),
            "source": "fallback",
            "traffic_aware": False
        }

    # キャッシュ保存
    with route_cache_lock:
        route_cache[cache_key] = {
            "result": result,
            "cached_at": time.time()
        }
        # キャッシュが大きくなりすぎないように古いものを削除
        if len(route_cache) > 100:
            oldest = min(route_cache, key=lambda k: route_cache[k]["cached_at"])
            del route_cache[oldest]

    result["num_stops"] = num_stops
    result["cached"] = False
    return result


def scrape_bus_data():
    """くるらからバス位置情報をスクレイピング"""
    global bus_data_cache
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ja,en;q=0.9'
        }

        all_buses = []

        # locationページを取得
        location_url = 'https://bus-kurura.jp/IBNAVI_location.php?plant=1&route=E1'
        req = Request(location_url, headers=headers)
        location_res = urlopen(req, timeout=10)
        location_html = location_res.read().decode('utf-8', errors='ignore')

        # Cookieを取得
        cookie_header = location_res.headers.get('Set-Cookie', '')

        # mapページを取得
        map_url = 'https://bus-kurura.jp/IBNAVI_map.php?plant=1&route=E1'
        map_headers = dict(headers)
        if cookie_header:
            map_headers['Cookie'] = cookie_header.split(';')[0]

        req = Request(map_url, headers=map_headers)
        map_res = urlopen(req, timeout=10)
        map_html = map_res.read().decode('utf-8', errors='ignore')

        # GPS座標を抽出
        gps_match = re.search(r'var\s+gps\s*=\s*\[([0-9.]+),\s*([0-9.]+)\]', map_html)
        if gps_match:
            lat = float(gps_match.group(1))
            lng = float(gps_match.group(2))

            # デフォルト位置（飯田駅）でないかチェック
            if not (abs(lat - 35.514751) < 0.0001 and abs(lng - 137.816897) < 0.0001):
                all_buses.append({
                    "route": "E1",
                    "lat": lat,
                    "lng": lng,
                    "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S')
                })

        # markersDataを抽出
        markers_match = re.search(r'var\s+markersData\s*=\s*(\[[\s\S]*?\]);', map_html)
        if markers_match:
            try:
                markers_str = markers_match.group(1)
                markers_str = markers_str.replace("'", '"')
                markers_str = re.sub(r',\s*]', ']', markers_str)
                markers = json.loads(markers_str)
                if len(markers) > 0:
                    with cache_lock:
                        bus_data_cache["stops"] = [
                            {"name": m[2] if len(m) > 2 else f"バス停{i+1}",
                             "lat": float(m[0]),
                             "lng": float(m[1]),
                             "order": i}
                            for i, m in enumerate(markers)
                        ]
            except (json.JSONDecodeError, IndexError, ValueError):
                pass

        with cache_lock:
            bus_data_cache["buses"] = all_buses
            bus_data_cache["isRunning"] = len(all_buses) > 0
            bus_data_cache["lastUpdated"] = time.strftime('%Y-%m-%dT%H:%M:%S')

    except (URLError, Exception) as e:
        print(f"スクレイピングエラー: {e}")
        with cache_lock:
            bus_data_cache["lastUpdated"] = time.strftime('%Y-%m-%dT%H:%M:%S')


def periodic_scrape():
    """30秒ごとにスクレイピング"""
    while True:
        scrape_bus_data()
        time.sleep(30)


class BusTrackerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/api/stops':
            self.handle_stops()
        elif self.path == '/api/bus-location':
            self.handle_bus_location()
        elif self.path.startswith('/api/estimate'):
            self.handle_estimate()
        elif self.path == '/api/config':
            self.handle_config()
        else:
            super().do_GET()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def handle_config(self):
        """クライアントに設定情報（APIキーの有無など）を返す"""
        self.send_json({
            "hasGoogleMapsKey": bool(GOOGLE_MAPS_API_KEY),
            "routingSource": "google_maps" if GOOGLE_MAPS_API_KEY else "osrm"
        })

    def handle_stops(self):
        with cache_lock:
            stops = bus_data_cache["stops"] if bus_data_cache["stops"] else BUS_STOPS
        self.send_json(stops)

    def handle_bus_location(self):
        with cache_lock:
            last = bus_data_cache["lastUpdated"]
        if last is None:
            scrape_bus_data()

        with cache_lock:
            self.send_json(bus_data_cache)

    def handle_estimate(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        with cache_lock:
            stops = list(bus_data_cache["stops"] if bus_data_cache["stops"] else BUS_STOPS)
            data = dict(bus_data_cache)

        stop_index = params.get('stopIndex', [None])[0]
        lat = params.get('lat', [None])[0]
        lng = params.get('lng', [None])[0]

        target_stop_idx = None
        if stop_index is not None:
            idx = int(stop_index)
            if idx < 0 or idx >= len(stops):
                self.send_json({"error": "バス停が見つかりません"}, 400)
                return
            target_lat = stops[idx]["lat"]
            target_lng = stops[idx]["lng"]
            target_name = stops[idx]["name"]
            target_stop_idx = idx
        elif lat and lng:
            target_lat = float(lat)
            target_lng = float(lng)
            target_name = "現在地付近"
            # 最寄りバス停をターゲットとする
            target_stop_idx = find_nearest_stop_index(target_lat, target_lng, stops)
        else:
            self.send_json({"error": "stopIndex または lat/lng を指定してください"}, 400)
            return

        if not data["isRunning"] or len(data["buses"]) == 0:
            self.send_json({
                "target": target_name,
                "isRunning": False,
                "message": "現在バスは運行していません",
                "estimates": []
            })
            return

        estimates = []
        for bus in data["buses"]:
            # ルーティングAPIで到着時間を推定
            routing = estimate_with_routing(
                bus["lat"], bus["lng"],
                target_lat, target_lng,
                target_stop_idx, stops
            )

            estimates.append({
                "route": bus["route"],
                "busLat": bus["lat"],
                "busLng": bus["lng"],
                "estimatedMinutes": routing["duration_minutes"],
                "distanceKm": routing["distance_km"],
                "numStops": routing["num_stops"],
                "source": routing["source"],
                "trafficAware": routing.get("traffic_aware", False),
                "timestamp": bus["timestamp"]
            })

        estimates.sort(key=lambda x: x["estimatedMinutes"])

        self.send_json({
            "target": target_name,
            "targetLat": target_lat,
            "targetLng": target_lng,
            "isRunning": True,
            "estimates": estimates
        })

    def log_message(self, format, *args):
        if '/api/' in (args[0] if args else ''):
            return
        super().log_message(format, *args)


if __name__ == '__main__':
    # バックグラウンドでスクレイピング開始
    scrape_thread = threading.Thread(target=periodic_scrape, daemon=True)
    scrape_thread.start()

    routing_mode = "Google Maps (渋滞考慮)" if GOOGLE_MAPS_API_KEY else "OSRM (道路距離)"
    print(f"🚌 くるらバストラッカー起動: http://localhost:{PORT}")
    print(f"   遠山郷線(E1)のバス位置をリアルタイム追跡します")
    print(f"   ルーティング: {routing_mode}")
    print(f"   Ctrl+C で停止")

    server = http.server.HTTPServer(('', PORT), BusTrackerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバー停止")
        server.server_close()
