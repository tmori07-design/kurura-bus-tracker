// GOトラッカー Cloudflare Pages Worker
// このファイルは自動生成されます。手動で編集しないでください。
// 元のファイル: functions/_shared/*.js, functions/api/*.js

// ===== shared.js =====
// 共通データ・ユーティリティ (Cloudflare Pages Functions版)

// 遠山郷線（E1）飯田駅前→和田 方面の全停留所
const BUS_STOPS = [
  // --- 飯田市中心部 ---
  { name: "飯田駅前", lat: 35.51904, lng: 137.82081, order: 0, dwellTime: 0 },
  { name: "飯田市役所", lat: 35.51516, lng: 137.82223, order: 2, dwellTime: 0 },
  { name: "中央広場", lat: 35.51539, lng: 137.82812, order: 3, dwellTime: 0 },
  { name: "東中央通り", lat: 35.51231, lng: 137.83434, order: 4, dwellTime: 0 },
  { name: "飯田橋", lat: 35.50848, lng: 137.83848, order: 5, dwellTime: 0 },
  // --- 喬木エリア ---
  { name: "寺所入口", lat: 35.50522, lng: 137.85055, order: 16, dwellTime: 0 },
  { name: "新井", lat: 35.50336, lng: 137.85876, order: 17, dwellTime: 30 },
  { name: "弁天", lat: 35.50102, lng: 137.86141, order: 18, dwellTime: 0 },
  { name: "北原", lat: 35.49428, lng: 137.86589, order: 19, dwellTime: 0 },
  { name: "楽珍館前", lat: 35.48716, lng: 137.88679, order: 20, dwellTime: 30 },
  { name: "富田辻", lat: 35.48516, lng: 137.88603, order: 21, dwellTime: 0 },
  { name: "第二小学校入口", lat: 35.48415, lng: 137.88907, order: 22, dwellTime: 0 },
  { name: "馬草田", lat: 35.48509, lng: 137.89389, order: 23, dwellTime: 0 },
  { name: "一本木", lat: 35.483234, lng: 137.896659, order: 24, dwellTime: 0 },
  { name: "大和知", lat: 35.48340, lng: 137.89968, order: 25, dwellTime: 0 },
  { name: "久保の下", lat: 35.48555, lng: 137.90060, order: 26, dwellTime: 0 },
  { name: "氏乗", lat: 35.48288, lng: 137.90785, order: 27, dwellTime: 0 },
  { name: "近藤商店前", lat: 35.48157, lng: 137.91018, order: 28, dwellTime: 0 },
  // --- 遠山入口（山間部）---
  { name: "小沢橋", lat: 35.44018, lng: 137.99171, order: 29, dwellTime: 0 },
  { name: "程野", lat: 35.43849, lng: 137.99107, order: 30, dwellTime: 0 },
  { name: "柄沢前", lat: 35.43564, lng: 137.98963, order: 31, dwellTime: 0 },
  { name: "宮の前", lat: 35.43370, lng: 137.98880, order: 32, dwellTime: 0 },
  { name: "東前", lat: 35.42463, lng: 137.98349, order: 33, dwellTime: 0 },
  { name: "うとどち", lat: 35.42070, lng: 137.98064, order: 34, dwellTime: 0 },
  { name: "行者", lat: 35.41258, lng: 137.97602, order: 35, dwellTime: 0 },
  { name: "上中郷", lat: 35.40924, lng: 137.97514, order: 36, dwellTime: 0 },
  { name: "新島", lat: 35.40771, lng: 137.97454, order: 37, dwellTime: 0 },
  { name: "コミュニティ前", lat: 35.40153, lng: 137.97258, order: 38, dwellTime: 0 },
  { name: "下中郷", lat: 35.39902, lng: 137.97133, order: 39, dwellTime: 0 },
  { name: "黒川前", lat: 35.39533, lng: 137.96908, order: 40, dwellTime: 0 },
  { name: "万場", lat: 35.38760, lng: 137.97020, order: 41, dwellTime: 0 },
  { name: "上町", lat: 35.38415, lng: 137.96847, order: 42, dwellTime: 0 },
  { name: "学校前", lat: 35.38204, lng: 137.96793, order: 43, dwellTime: 30 },
  // 学校前〜和田間の停留所は利用者がいないため省略
  // --- 和田周辺 ---
  { name: "和田", lat: 35.32274, lng: 137.93444, order: 65, dwellTime: 0 },
  { name: "地域交流センター", lat: 35.32283, lng: 137.93200, order: 66, dwellTime: 0 },
  { name: "郵便局前", lat: 35.32109, lng: 137.92969, order: 67, dwellTime: 0 },
  { name: "かぐらの湯", lat: 35.32109, lng: 137.92969, order: 68, dwellTime: 0 },
  // --- 和田→飯田方面のみの停留所 ---
  { name: "知久町１丁目", lat: 35.51414, lng: 137.82529, order: 69, dwellTime: 30 },
  { name: "知久町３丁目", lat: 35.51543, lng: 137.82274, order: 70, dwellTime: 30 },
  { name: "飯田病院前", lat: 35.51738, lng: 137.81917, order: 71, dwellTime: 0 },
];

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestStopIndex(lat, lng, stops) {
  let minDist = Infinity;
  let nearest = 0;
  for (let i = 0; i < stops.length; i++) {
    const d = haversineDistance(lat, lng, stops[i].lat, stops[i].lng);
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  }
  return nearest;
}

// JSONレスポンスを構築 (Cloudflare Workers用 Response オブジェクト)
function jsonResponse(data, status = 200, cacheSeconds = 0) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };
  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, s-maxage=${cacheSeconds}, max-age=${cacheSeconds}`;
  }
  return new Response(JSON.stringify(data), { status, headers });
}

// ===== kurura.js =====
// くるら(bus-kurura.jp) スクレイピング共通モジュール (Cloudflare版)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://bus-kurura.jp';

async function newSession() {
  const res = await fetch(`${BASE}/IBNAVI_strains.php?plant=1&route=E1`, {
    headers: { 'User-Agent': UA },
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  const html = await res.text();
  return { cookie, strainsHtml: html };
}

function parseRunningBuses(html) {
  const buses = [];
  const re = /arrow=(7_[12])&timetableCD=(\d+)&vehiclenum=(\d+)&mintime=([^&]+)&maxtime=([^&"]+)/g;
  const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const arrow = m[1];
    const timetableCD = m[2];
    const vehiclenum = m[3];
    const mintime = decodeURIComponent(m[4].replace(/\+/g, ' '));
    const maxtime = decodeURIComponent(m[5].replace(/\+/g, ' '));
    const key = `${vehiclenum}-${timetableCD}`;
    if (seen.has(key)) continue;
    seen.add(key);
    buses.push({ arrow, timetableCD, vehiclenum, mintime, maxtime });
  }
  return buses;
}

// 対象便のみを抽出:
//   7:00 飯田駅前→和田       arrow=7_1, timetableCD=71016
//   16:24 かぐらの湯→飯田駅前 arrow=7_2, timetableCD=72016
function isTargetDeparture(r) {
  if (r.arrow === '7_1' && r.timetableCD === '71016') return true;
  if (r.arrow === '7_2' && r.timetableCD === '72016') return true;
  return false;
}

async function fetchBusGps(bus) {
  const { cookie } = await newSession();

  const form = new URLSearchParams();
  form.append('VeNum', bus.vehiclenum);
  form.append('timetableCD', bus.timetableCD);
  form.append('mintime', bus.mintime);
  form.append('maxtime', bus.maxtime);

  await fetch(`${BASE}/IBNAVI_session.php`, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': `${BASE}/IBNAVI_location.php?plant=1&route=E1`,
    },
    body: form.toString(),
  });

  const mapRes = await fetch(`${BASE}/IBNAVI_map.php?plant=1&route=E1&arrow=`, {
    headers: {
      'User-Agent': UA,
      'Cookie': cookie,
    },
  });
  const mapHtml = await mapRes.text();

  const gpsMatch = mapHtml.match(/var\s+gps\s*=\s*\[([0-9.]+)\s*,\s*([0-9.]+)\]/);
  if (!gpsMatch) return null;
  const lat = parseFloat(gpsMatch[1]);
  const lng = parseFloat(gpsMatch[2]);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  const defaultLat = 35.514751, defaultLng = 137.816897;
  if (Math.abs(lat - defaultLat) < 0.0001 && Math.abs(lng - defaultLng) < 0.0001) {
    return null;
  }
  return { lat, lng };
}

// --- インメモリキャッシュ ---
// Cloudflare Workers は短時間で同じインスタンスが再利用されることがある。
// 10秒間キャッシュすることで、くるらへの重複リクエストを防ぐ。
let busCache = { data: null, expiry: 0 };
const CACHE_TTL_MS = 10_000;

async function fetchActiveBuses() {
  const now = Date.now();
  if (busCache.data && now < busCache.expiry) {
    return busCache.data;
  }

  const { strainsHtml } = await newSession();
  const running = parseRunningBuses(strainsHtml).filter(isTargetDeparture);

  const out = [];
  for (const r of running) {
    try {
      const gps = await fetchBusGps(r);
      if (!gps) continue;
      const direction = r.arrow === '7_1' ? 'to-wada' : 'to-iida';
      out.push({
        route: 'E1',
        vehicleNum: r.vehiclenum,
        timetableCD: r.timetableCD,
        mintime: r.mintime,
        direction,
        lat: gps.lat,
        lng: gps.lng,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}
  }

  busCache = { data: out, expiry: now + CACHE_TTL_MS };
  return out;
}

// ===== route-distance.js =====
// 固定ルートに基づく距離計算モジュール
// バスは事前生成済みのポリライン（public/routes.json と同じデータ）を必ず通る前提で
// 距離・到着時刻を算出する。Google Mapsの「最適ルート」には依存しない。

// 事前生成済みルートポリライン（public/routes.json と同期）
// 編集時は両方を一致させること
const POLYLINES = {
  'to-wada': [
    "uhxwEocehY{@_AZk@z@aB|BkEP[Vi@RNbDjCnElDrAlAn@kApA_D^_A}@o@aE_DcCgBmBwAp@eBp@aBpAkChCyDlMk\\~K_ZfBaEbAw@xG{BnDy@~AAV?LyAj@}FrA}MVmC`@_Hh@{FhFk[zCkUjFm_@vAoErBwBhAi@`Ca@j@AhA@Dw@ZaGLyB@SrAJjAJd@FbCr@v@\\x@PLCjCr@vDg@b@_APgB_AiCw@gFAwAZcAn@mAb@Kp@^RfFf@`@zBa@vCgAzEeA`AQZ]EaBm@iE]}DLoC^aBhA}BP{EfAuDvCuGnB{CZyAf@yFnAcHp@}BJ{BVmJUiEByCnAgFdBgE~AcCfAmAxCgB~CL|@ER`@bBh@|@r@}@s@cBi@Sa@ZSfBsCxEuGfA}B^gBIaAOkB]g@_BmCsAyDScB?mJ\\_@zALp@s@rACf@mAr@_BJw@KcC`@c@`AqBBgAWo@q@w@e@{BsBqA}Am@y@aAg@WkCRkA^k@Ju@QsAwAsBqIFcAtAaBd@Yf@^jBf@`BwDrDuFXQtAI~EoDpAoAPaBIo@eAcAu@e@QURUr@}@f@aAlBgCxByBvA}A`@oAf@}@lB}@r@e@Lg@fAcD`@qCz@{BhCuDd@aB^QnAHl@MhAUfCl@lAKdAo@nAeBx@k@xCa@`@Wl@kAzAwA`AU~BDrDk@~Cw@bAkAfAc@hC]tA{@|@o@Tk@NeEl@uCt@_AvBiApBo@bBDjB]~@u@b@GdB^vBmA|BqBbExA|CJd@c@NgBn@iBlCmB~DmAlAe@n@AxAoBh@_@Vw@Z{@nAw@lC]hBIn@Pf@BjA{@zAeCxByB\\eBWOk@~@cDtDg@LEi@hA_AbCaG`AcCxDgChBeAp@ObAp@xAV`Br@|CoCKeBt@aCCiCl@kB?i@mE}D{CeGIqAVkA`AuAtA}Ea@sBcAgAaA[Ya@UwB[aEBuCFgB@k@\\BTFHFh@pAd@vBZ`EAhAo@pAmBV}@c@EiAlA_IrAiQpI_oAtEkq@pH_jAnDui@x@sHdBkGtDsGlAsAxDmCtFeCtB}@bCS~Cy@~CZhA^fA~@`BxAhBh@lGrAxB`B~AnC`B~AlBi@x@c@oB`Ac@DSDb@\\p@\\\\Dr@Q`BcBz@e@bA@bAv@|DbFfA`@hBUdCYzC~@jBhBx@xBp@`BnCrCvB`ExBzApADtBu@pC^zAhAtAjCz@jCt@x@zGbCtDNxBpAnCh@hAf@`@p@rB~LpAvEvAbBpB~@hBF`Dg@pCi@hAe@xBa@`ER",
    "socwEomciYzCRj@Fr@PhCnA`@Nb@DnBBx@LvBl@lEnAtBn@hDv@hA\\hAXlBPt@JbCZ`@Pp@b@l@Vf@DX?~@A`@DrAb@rCt@f@Pb@R^Z^l@v@bBZj@JNVPPFRB^CxCy@LCBLBFCGCMHELGROX]RWVSb@Qb@M|A@NBRFd@X`@Zh@t@NZ^vA`@bBLZNRRRRHf@FRD\\PVZVn@P~@LZLPb@Vt@Lt@F|@IvAMf@K`@Q^Y`@m@XiA\\aBRe@P[\\_@ZQd@S~@It@ATBRFb@Pb@TRPb@NX?l@OnAYVCXBVJ~@n@|AfAh@\\`@Hh@@h@Q\\U|BmBh@_@b@S`@Kx@Aj@Hd@Ln@RXNVTX^fBnCVh@\\fAXbAPb@TZb@Xb@JxBP`Fb@",
    "up}vE{zaiYrAT`AXjAb@lAd@nAj@bAj@`Af@v@Pn@JbDj@bCt@xB|@~FpBdBj@`Ct@r@FfAB\\D^Jb@P~@l@p@\\`@FZ?pAIZGdAUXKh@GZAl@Fv@VhAj@^^Vd@`AnDTb@\\^hBfAjBdAtAfAbAx@rBnAhAh@b@Hj@CvFa@p@E`AFp@RlCtAz@l@|@h@f@^dA^bAZ`D|@b@Fn@@r@AVIb@Y`@c@x@q@TIp@KrA@~@HXLHHhA|@|A~@jAh@r@Vp@LVD~DnA~Al@rAf@rA^tA\\p@T`D|ArAp@hAh@ZH`@DpEVbBEb@Cl@At@Fj@Lp@\\z@n@`Ar@|@v@x@j@TR~@z@^d@pAbCn@lA^f@p@l@jCbBt@\\l@PXDj@?h@GvB]hASbAU`@Qd@Yr@s@bAoApB{Bf@[^K`@D|@f@|@h@GRAD@DDPHDTLUMIEAEEQ@EFSbB|@tDxBfBdAzBrAhBnA|AbA`At@~@f@vB`B\\VtAnAlArAxIfM|GtJhAxAfD`FbAdCt@~Bd@nBj@jCRfAh@pCN~@TnB@NB?HCDEEy@Au@BKHCPDFDB@?QJo@BQNm@Lg@@KDAJIPAh@DT?|@W\\@l@FLHVDv@AVJH?DWDg@L_ABg@Ge@EUA[By@Ai@CUEUC]E_@[y@aAeDWw@KSEe@EUm@o@GOASDYPm@NWVSp@[\\KvAMR?r@KVK^YJSBOAaDAg@Ec@Qy@CMBLDVLf@Dj@BlDCXELQRa@Te@HQDMB}@Bm@Hq@Vg@XMLUl@I`@?TBNJPZXNVBb@DTJPhBzFLf@@\\Jv@@h@Cj@?XB\\H\\@\\K|@KbAQhAc@nAm@zBI`@A^?j@D\\Pr@d@z@XZVRtAjBjAbAj@b@RJd@Tr@f@f@^`@Th@Rn@LrAX`Cp@l@RTJGNq@~Ai@fA{A|C{@~Aj@p@zAlBbBxBbA`BbAlB`AvBXv@`@W",
  ],
  'to-iida': [
    "atqvEalzhYa@VCIQe@s@aBaAmB}@{AeBaCaBuBs@w@IMLQTa@nBcEZm@jAoCm@W}Bm@uCq@cA_@k@c@}AcAq@_@yAmAg@o@o@}@m@g@k@_ASq@IgAH_Af@qBh@cBNw@NuALuAO_ABiBK}@Ce@Me@gByFSe@Ci@IOk@o@Ee@D[Vo@JQd@[l@U`@I|AIt@O\\OVWHO@SAgDAi@Ga@S{@m@wB_@mAi@aAESDk@n@yDDe@Go@Gk@WoA]y@OAm@Ji@NQRW|@Uh@SJSBYGYMy@i@[KY?WA_@KoAk@EGIBG@OEu@W[MKMaAkBw@wAy@w@{AwAmAy@y@kA[]e@_@QG_@Si@s@[YyAa@k@Ia@Hi@?kAEe@Hk@PcAd@o@Nc@PYXOTkAnCSl@I^Yv@gA|BSZa@Tu@Zq@`@QRM`@Yd@[`@MHKHKRUx@QhA]p@QRo@@o@Ky@SkCqAYUMW@WNo@`@sATeAJiACg@[i@k@e@o@_@c@Ua@WEOH]mBiAUI_@Aa@LSJe@f@sB~Bs@x@u@p@g@Z_@LaAReBZ_BTc@Be@Aa@Gs@UkAq@qBsAk@k@a@k@iA}By@uA]_@cA_AyAeAq@k@aCgBq@Wi@Iq@Ek@BcBFw@AyDUaASwFoCyB}@qBi@uCeAsC}@eCu@[Eo@Qy@[iB_AgAw@o@g@SOa@KcAEgA@k@Jk@Za@`@e@b@c@XSDcA?m@CqA[cCs@gA]i@Wi@_@cAo@[WiAi@cB{@i@M_ACgAFiF^a@?i@M}Ay@cBgAcA{@yAeAaB}@}@i@k@c@Y[Ui@e@kB]aAYe@WWsAm@iAYaAD}Bh@qBN_@C_@Mq@_@cAm@y@We@CkACg@IkFcBqGyBwB{@oBk@iDk@u@Oq@UmCwAyD{A_Co@y@MmGi@gAKi@O[WQWSg@_@sA_@eAa@u@_BaC[]YQmAa@mAOo@Bi@Nc@Vm@d@sBdB_@Rm@Ji@C]Ma@YuByAg@]]K[AUDwA\\a@J_@C{Ay@c@Qk@GkADc@Ho@Xs@r@_@bA_@jB[~@g@j@e@X_BXqBLmAKa@M_@YKQ_@_BWi@WW_@QSEk@Ic@_@Q[w@aDSo@]i@_@g@c@Yc@Wo@ImA@kA`@i@p@UVWNQHFTGUYFw@T_B`@_@?c@Oa@c@a@y@y@cBU[m@c@aBg@gEmA]CgA@a@Ae@K_@So@_@c@SsC]}C]uCy@kDw@oIgCwBi@g@EkBAc@I_@MeAk@mAg@u@Oa@EsCQ",
    "socwEomciY{EQoErAiFz@kBHeBi@yAgAcAeBm@wBc@iDq@aEk@kCm@{@iBg@uBk@{BiAaDIkHqCk@w@w@kCm@wAc@i@gBkAuCYqBv@kAM}BeBq@cBgA}AiCmCq@gB}@yBeB{AoBw@u@IyCd@mAJiAg@gEqFy@e@iABy@n@{AxAy@J}Aw@AKPCj@KhB_AiB~@k@JQBs@c@YYk@q@wAgCkAaA}@[aGoAeBk@qBmBaAo@wA_@eCQsDdAcC\\oChAyFrCqD|Cs@|@sArBsAxCk@fB_A~E_Cr]gEjn@sDtj@cJnsAyEls@oA~VPh@b@Vb@C\\[P{@E}Bc@uCu@wC_@O]CAj@GfBCtCD|AVhDl@rAhBx@v@fBDt@SpAgB|D[b@WjAHpAzAdD~A|B|ChCRd@]lASv@H|Aq@bCIh@JhA?Z_BbB}@j@YGoBw@q@Kc@_@_@Qq@N{ErCgAx@e@jAcBjE{@lBm@f@_@f@HXP@pBkBjBsCT?LZa@rAc@h@uAnAw@vAc@l@kAz@wAUgET_ChAs@rBi@^_AzAYRo@@iD`AcBp@eB`AiA|A]~Ce@b@uABgAOaDmAa@Km@\\oArAoA~@g@Lq@Ms@Qc@F_At@g@FcAT{@@g@GqBn@wBhAu@~@_@rAY~DCfAUj@sBxAaAZoC^cAjA_Cz@kB`@kB\\wBGgADuAhAy@z@g@~@yBZsA^kCxCiAb@_B[mBQaA\\{BCOz@mBrC{@vAc@pAe@|BiBhGaDbBg@|@Qp@a@x@wAtA}CbD_BjCs@|@STPTt@d@|@r@Nb@EzA[~@iFxDu@f@k@Fu@Bm@r@cDlF}@`Cc@Zu@Qw@k@k@EoAxA_@z@LfAvAxFn@dBr@d@t@PtA_@~B[bABz@dAp@\\nChA^b@VlA\\jAp@l@H`Ai@rBcArALrCwAvDa@RkA@[h@kAGo@NArB?jItAnDP~@jBlCRjANxAM`Bq@bB}@zAkClD_CvDy@v@R`@dAXz@d@^\\_@]{@e@eAYSa@}@Du@IiBC}@`@}BdBwAlBwAjCuB|G]pCXzGc@hN{AxFaAhHKvB[xAaEhHcCfGSxEa@lBo@fA_@`BMnCFfB^fDp@nDGh@[\\gEx@mD|@wB`AcAFSI]cAAcDGW]]w@HkApC@vA^jCt@xCd@bBg@|BQPuBb@aAB}Ac@{@KIJo@]w@]cCs@qBSsAKARMxB[`GEv@iAAk@@aC`@gCzAu@dAs@dBeAdF}Flc@y@~GqAnH{CnQgA~IeAdOsA|Mk@|FMxAW?_A@_@?u@DsFhBiEbBw@hAcDjIaNf^kFvM",
    "_rwwEspfhYw@pBM^lA|@bBnAz@l@~BfB}BrFiFnM}DjJeA`C_ArB]t@MXWU[]o@o@c@w@k@gAGWJKd@o@DIaA{@]Sc@b@EASSCC",
  ],
};

// Google Maps Encoded Polyline をデコードして [lat, lng] 配列に変換
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const len = encoded.length;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// デコード済み座標のキャッシュ（同じ実行コンテキスト内で再利用）
const decodedCache = {};

function getDecodedRoute(direction) {
  if (!decodedCache[direction]) {
    const segments = POLYLINES[direction];
    if (!segments) return null;
    decodedCache[direction] = segments.flatMap(seg => decodePolyline(seg));
  }
  return decodedCache[direction];
}

// ポリライン上で指定座標に最も近い点のインデックスを返す
function findClosestPointIndex(lat, lng, coords) {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    const d = haversineDistance(lat, lng, coords[i][0], coords[i][1]);
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ポリライン上の二点間の累積距離(km)を計算
function distanceAlongPolyline(coords, startIdx, endIdx) {
  const a = Math.min(startIdx, endIdx);
  const b = Math.max(startIdx, endIdx);
  let total = 0;
  for (let i = a; i < b; i++) {
    total += haversineDistance(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  return total;
}

// バス位置から目的地までの「実際のバスルート」上の距離を計算
//
// 返り値: { distanceKm, busPassed } または null
//   distanceKm: ポリライン上の累積距離(km)
//   busPassed:  true なら バスはすでに目的地を通過済み
//
// 注意: ポリラインは進行方向順に並んでいる
//   to-wada: 飯田駅前(0) → かぐらの湯(N)
//   to-iida: かぐらの湯(0) → 飯田駅前(N)
function calculateRouteDistance(busLat, busLng, destLat, destLng, direction) {
  const coords = getDecodedRoute(direction);
  if (!coords || coords.length === 0) return null;

  const busIdx = findClosestPointIndex(busLat, busLng, coords);
  const destIdx = findClosestPointIndex(destLat, destLng, coords);

  // 進行方向と逆向き(destIdx < busIdx)なら、バスは目的地を通過済み
  const busPassed = destIdx < busIdx;
  const distanceKm = distanceAlongPolyline(coords, busIdx, destIdx);

  return { distanceKm, busPassed };
}

// ===== route-waypoints.js =====
// 実走ルート上の経由点シーケンス
// バス停 + 信号交差点 + 国道152号沿いの中継点 を順序通りに並べたもの。
// Google Directions API に渡すことで、Googleの「最適ルート」ではなく
// 実際のバス経路に沿った走行時間（渋滞考慮）を取得する。

// to-wada (飯田駅前→かぐらの湯)
const WAYPOINTS_TO_WADA = [
  // 飯田市内
  { name: "飯田駅前", loc: "35.51904,137.82081", lat: 35.51904, lng: 137.82081, isStop: true, dwellTime: 0 },
  { name: "飯田市役所", loc: "35.51516,137.82223", lat: 35.51516, lng: 137.82223, isStop: true, dwellTime: 0 },
  { name: "中央広場", loc: "35.51539,137.82812", lat: 35.51539, lng: 137.82812, isStop: true, dwellTime: 0 },
  { name: "東中央通り", loc: "35.51231,137.83434", lat: 35.51231, lng: 137.83434, isStop: true, dwellTime: 0 },
  { name: "飯田橋", loc: "35.50848,137.83848", lat: 35.50848, lng: 137.83848, isStop: true, dwellTime: 0 },
  { name: "寺所入口", loc: "35.50522,137.85055", lat: 35.50522, lng: 137.85055, isStop: true, dwellTime: 0 },
  // 喬木エリア
  { name: "新井", loc: "35.50336,137.85876", lat: 35.50336, lng: 137.85876, isStop: true, dwellTime: 30 },
  { name: "弁天", loc: "35.50102,137.86141", lat: 35.50102, lng: 137.86141, isStop: true, dwellTime: 0 },
  { name: "北原", loc: "35.49428,137.86589", lat: 35.49428, lng: 137.86589, isStop: true, dwellTime: 0 },
  { name: "楽珍館前", loc: "35.48716,137.88679", lat: 35.48716, lng: 137.88679, isStop: true, dwellTime: 30 },
  { name: "富田辻", loc: "35.48516,137.88603", lat: 35.48516, lng: 137.88603, isStop: true, dwellTime: 0 },
  { name: "第二小学校入口", loc: "35.48415,137.88907", lat: 35.48415, lng: 137.88907, isStop: true, dwellTime: 0 },
  { name: "馬草田", loc: "35.48509,137.89389", lat: 35.48509, lng: 137.89389, isStop: true, dwellTime: 0 },
  { name: "一本木", loc: "35.483234,137.896659", lat: 35.483234, lng: 137.896659, isStop: true, dwellTime: 0 },
  { name: "大和知", loc: "35.48340,137.89968", lat: 35.48340, lng: 137.89968, isStop: true, dwellTime: 0 },
  { name: "久保の下", loc: "35.48555,137.90060", lat: 35.48555, lng: 137.90060, isStop: true, dwellTime: 0 },
  { name: "氏乗", loc: "35.48288,137.90785", lat: 35.48288, lng: 137.90785, isStop: true, dwellTime: 0 },
  { name: "近藤商店前", loc: "35.48157,137.91018", lat: 35.48157, lng: 137.91018, isStop: true, dwellTime: 0 },
  // 山間部
  { name: "小沢橋", loc: "35.44018,137.99171", lat: 35.44018, lng: 137.99171, isStop: true, dwellTime: 0 },
  { name: "程野", loc: "35.43849,137.99107", lat: 35.43849, lng: 137.99107, isStop: true, dwellTime: 0 },
  { name: "柄沢前", loc: "35.43564,137.98963", lat: 35.43564, lng: 137.98963, isStop: true, dwellTime: 0 },
  { name: "宮の前", loc: "35.43370,137.98880", lat: 35.43370, lng: 137.98880, isStop: true, dwellTime: 0 },
  { name: "東前", loc: "35.42463,137.98349", lat: 35.42463, lng: 137.98349, isStop: true, dwellTime: 0 },
  { name: "うとどち", loc: "35.42070,137.98064", lat: 35.42070, lng: 137.98064, isStop: true, dwellTime: 0 },
  { name: "行者", loc: "35.41258,137.97602", lat: 35.41258, lng: 137.97602, isStop: true, dwellTime: 0 },
  { name: "上中郷", loc: "35.40924,137.97514", lat: 35.40924, lng: 137.97514, isStop: true, dwellTime: 0 },
  { name: "新島", loc: "35.40771,137.97454", lat: 35.40771, lng: 137.97454, isStop: true, dwellTime: 0 },
  { name: "コミュニティ前", loc: "35.40153,137.97258", lat: 35.40153, lng: 137.97258, isStop: true, dwellTime: 0 },
  { name: "下中郷", loc: "35.39902,137.97133", lat: 35.39902, lng: 137.97133, isStop: true, dwellTime: 0 },
  { name: "黒川前", loc: "35.39533,137.96908", lat: 35.39533, lng: 137.96908, isStop: true, dwellTime: 0 },
  { name: "万場", loc: "35.38760,137.97020", lat: 35.38760, lng: 137.97020, isStop: true, dwellTime: 0 },
  { name: "上町", loc: "35.38415,137.96847", lat: 35.38415, lng: 137.96847, isStop: true, dwellTime: 0 },
  { name: "学校前", loc: "35.38204,137.96793", lat: 35.38204, lng: 137.96793, isStop: true, dwellTime: 30 },
  // 国道152号沿い (停留所削除区間)
  { name: "152号_診療所前付近", loc: "35.38081,137.96746", lat: 35.38081, lng: 137.96746, isStop: false },
  { name: "152号_中村入口付近", loc: "35.37068,137.96429", lat: 35.37068, lng: 137.96429, isStop: false },
  { name: "152号_八名瀬付近", loc: "35.35679,137.95838", lat: 35.35679, lng: 137.95838, isStop: false },
  { name: "152号_本谷口付近", loc: "35.34562,137.95237", lat: 35.34562, lng: 137.95237, isStop: false },
  { name: "152号_木沢付近", loc: "35.34005,137.95322", lat: 35.34005, lng: 137.95322, isStop: false },
  { name: "152号_大島付近", loc: "35.32552,137.94769", lat: 35.32552, lng: 137.94769, isStop: false },
  { name: "和田", loc: "35.32274,137.93444", lat: 35.32274, lng: 137.93444, isStop: true, dwellTime: 0 },
  { name: "地域交流センター", loc: "35.32283,137.93200", lat: 35.32283, lng: 137.93200, isStop: true, dwellTime: 0 },
  { name: "郵便局前", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
  { name: "かぐらの湯", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
];

// to-iida (かぐらの湯→飯田駅前)
const WAYPOINTS_TO_IIDA = [
  { name: "かぐらの湯", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
  { name: "郵便局前", loc: "35.32109,137.92969", lat: 35.32109, lng: 137.92969, isStop: true, dwellTime: 0 },
  { name: "地域交流センター", loc: "35.32283,137.93200", lat: 35.32283, lng: 137.93200, isStop: true, dwellTime: 0 },
  { name: "和田", loc: "35.32274,137.93444", lat: 35.32274, lng: 137.93444, isStop: true, dwellTime: 0 },
  // 国道152号沿い (停留所削除区間)
  { name: "152号_大島付近", loc: "35.32552,137.94769", lat: 35.32552, lng: 137.94769, isStop: false },
  { name: "152号_木沢付近", loc: "35.34005,137.95322", lat: 35.34005, lng: 137.95322, isStop: false },
  { name: "152号_本谷口付近", loc: "35.34562,137.95237", lat: 35.34562, lng: 137.95237, isStop: false },
  { name: "152号_八名瀬付近", loc: "35.35679,137.95838", lat: 35.35679, lng: 137.95838, isStop: false },
  { name: "152号_中村入口付近", loc: "35.37068,137.96429", lat: 35.37068, lng: 137.96429, isStop: false },
  { name: "152号_診療所前付近", loc: "35.38081,137.96746", lat: 35.38081, lng: 137.96746, isStop: false },
  { name: "学校前", loc: "35.38204,137.96793", lat: 35.38204, lng: 137.96793, isStop: true, dwellTime: 30 },
  { name: "上町", loc: "35.38415,137.96847", lat: 35.38415, lng: 137.96847, isStop: true, dwellTime: 0 },
  { name: "万場", loc: "35.38760,137.97020", lat: 35.38760, lng: 137.97020, isStop: true, dwellTime: 0 },
  { name: "黒川前", loc: "35.39533,137.96908", lat: 35.39533, lng: 137.96908, isStop: true, dwellTime: 0 },
  { name: "下中郷", loc: "35.39902,137.97133", lat: 35.39902, lng: 137.97133, isStop: true, dwellTime: 0 },
  { name: "コミュニティ前", loc: "35.40153,137.97258", lat: 35.40153, lng: 137.97258, isStop: true, dwellTime: 0 },
  { name: "新島", loc: "35.40771,137.97454", lat: 35.40771, lng: 137.97454, isStop: true, dwellTime: 0 },
  { name: "上中郷", loc: "35.40924,137.97514", lat: 35.40924, lng: 137.97514, isStop: true, dwellTime: 0 },
  { name: "行者", loc: "35.41258,137.97602", lat: 35.41258, lng: 137.97602, isStop: true, dwellTime: 0 },
  { name: "うとどち", loc: "35.42070,137.98064", lat: 35.42070, lng: 137.98064, isStop: true, dwellTime: 0 },
  { name: "東前", loc: "35.42463,137.98349", lat: 35.42463, lng: 137.98349, isStop: true, dwellTime: 0 },
  { name: "宮の前", loc: "35.43370,137.98880", lat: 35.43370, lng: 137.98880, isStop: true, dwellTime: 0 },
  { name: "柄沢前", loc: "35.43564,137.98963", lat: 35.43564, lng: 137.98963, isStop: true, dwellTime: 0 },
  { name: "程野", loc: "35.43849,137.99107", lat: 35.43849, lng: 137.99107, isStop: true, dwellTime: 0 },
  { name: "小沢橋", loc: "35.44018,137.99171", lat: 35.44018, lng: 137.99171, isStop: true, dwellTime: 0 },
  { name: "近藤商店前", loc: "35.48157,137.91018", lat: 35.48157, lng: 137.91018, isStop: true, dwellTime: 0 },
  { name: "氏乗", loc: "35.48288,137.90785", lat: 35.48288, lng: 137.90785, isStop: true, dwellTime: 0 },
  { name: "久保の下", loc: "35.48555,137.90060", lat: 35.48555, lng: 137.90060, isStop: true, dwellTime: 0 },
  { name: "大和知", loc: "35.48340,137.89968", lat: 35.48340, lng: 137.89968, isStop: true, dwellTime: 0 },
  { name: "一本木", loc: "35.483234,137.896659", lat: 35.483234, lng: 137.896659, isStop: true, dwellTime: 0 },
  { name: "馬草田", loc: "35.48509,137.89389", lat: 35.48509, lng: 137.89389, isStop: true, dwellTime: 0 },
  { name: "第二小学校入口", loc: "35.48415,137.88907", lat: 35.48415, lng: 137.88907, isStop: true, dwellTime: 0 },
  { name: "富田辻", loc: "35.48516,137.88603", lat: 35.48516, lng: 137.88603, isStop: true, dwellTime: 0 },
  { name: "楽珍館前", loc: "35.48716,137.88679", lat: 35.48716, lng: 137.88679, isStop: true, dwellTime: 30 },
  { name: "北原", loc: "35.49428,137.86589", lat: 35.49428, lng: 137.86589, isStop: true, dwellTime: 0 },
  { name: "弁天", loc: "35.50102,137.86141", lat: 35.50102, lng: 137.86141, isStop: true, dwellTime: 0 },
  { name: "新井", loc: "35.50336,137.85876", lat: 35.50336, lng: 137.85876, isStop: true, dwellTime: 30 },
  { name: "寺所入口", loc: "35.50522,137.85055", lat: 35.50522, lng: 137.85055, isStop: true, dwellTime: 0 },
  { name: "飯田橋", loc: "35.50848,137.83848", lat: 35.50848, lng: 137.83848, isStop: true, dwellTime: 0 },
  { name: "東中央通り", loc: "35.51231,137.83434", lat: 35.51231, lng: 137.83434, isStop: true, dwellTime: 0 },
  { name: "中央広場", loc: "35.51539,137.82812", lat: 35.51539, lng: 137.82812, isStop: true, dwellTime: 0 },
  // 飯田市内 信号交差点 (実際の経路を強制するため必須)
  { name: "中央交差点信号", loc: "中央交差点 飯田市", isStop: false },
  { name: "銀座4,5丁目信号", loc: "銀座 飯田市", isStop: false },
  { name: "知久町１丁目", loc: "35.51414,137.82529", lat: 35.51414, lng: 137.82529, isStop: true, dwellTime: 30 },
  { name: "知久町３丁目", loc: "35.51543,137.82274", lat: 35.51543, lng: 137.82274, isStop: true, dwellTime: 30 },
  { name: "飯田病院前", loc: "35.51738,137.81917", lat: 35.51738, lng: 137.81917, isStop: true, dwellTime: 0 },
  { name: "元町交差点", loc: "元町交差点 飯田市", isStop: false },
  { name: "飯田駅南交差点", loc: "飯田駅南交差点 飯田市", isStop: false },
  { name: "飯田駅前", loc: "35.51904,137.82081", lat: 35.51904, lng: 137.82081, isStop: true, dwellTime: 0 },
];

const WAYPOINTS = {
  'to-wada': WAYPOINTS_TO_WADA,
  'to-iida': WAYPOINTS_TO_IIDA,
};

// 指定座標に最も近い経由点インデックスを返す（座標を持つ点のみ対象）
function findClosestIdx(lat, lng, sequence) {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < sequence.length; i++) {
    const p = sequence[i];
    if (p.lat == null || p.lng == null) continue; // 信号交差点等の名前のみは除外
    const d = haversineDistance(lat, lng, p.lat, p.lng);
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// バス位置と目的地の間の経由点を返す（進行方向順）
//
// 返り値: {
//   waypoints: [{ name, loc }, ...],   // origin/destinationを除く中間経由点
//   busPassed: boolean                 // バスが目的地を通過済みか
// } | null
//
// 23点を超える場合は信号交差点を優先的に残しつつバス停をサンプリング
function getWaypointsForGoogle(direction, busLat, busLng, destLat, destLng) {
  const sequence = WAYPOINTS[direction];
  if (!sequence) return null;

  const busIdx = findClosestIdx(busLat, busLng, sequence);
  const destIdx = findClosestIdx(destLat, destLng, sequence);

  if (destIdx <= busIdx) {
    return { waypoints: [], busPassed: true };
  }

  // バスとデスティネーションの間の経由点（両端は除外）
  let intermediates = sequence.slice(busIdx + 1, destIdx);

  // 23点制限への対応: 信号交差点(isStop=false)は必ず残し、停留所をサンプリング
  if (intermediates.length > 23) {
    const must = intermediates.filter(p => !p.isStop);
    const stops = intermediates.filter(p => p.isStop);
    const remain = 23 - must.length;
    let sampled;
    if (remain <= 0) {
      sampled = must.slice(0, 23);
    } else if (stops.length <= remain) {
      sampled = [...must, ...stops];
    } else {
      const step = stops.length / remain;
      const picked = Array.from({ length: remain }, (_, i) => stops[Math.floor(i * step)]);
      sampled = [...must, ...picked];
    }
    // シーケンス順に並べ直す
    sampled.sort((a, b) => sequence.indexOf(a) - sequence.indexOf(b));
    intermediates = sampled;
  }

  return {
    waypoints: intermediates.map(p => ({ name: p.name, loc: p.loc })),
    busPassed: false,
  };
}

// 進行方向順での「バス → 目的地」間の中間停留所情報を返す
//
// 返り値: {
//   dwellSeconds: number,  // 中間停留所の合計停車時間
//   numStops: number,      // 中間停留所の数
//   busPassed: boolean,    // バスがすでに目的地を通過済みか
// } | null
//
// バグ修正の目的:
//   従来は BUS_STOPS 配列のインデックス順で計算していたが、to-iida 方向では
//   知久町・飯田病院前(配列の最後)が訪問順では最後に来るため、
//   配列スライスでは「全停留所」を巻き込んで停車時間を二重計上していた。
function getJourneyInfo(direction, busLat, busLng, destLat, destLng) {
  const sequence = WAYPOINTS[direction];
  if (!sequence) return null;

  const busIdx = findClosestIdx(busLat, busLng, sequence);
  const destIdx = findClosestIdx(destLat, destLng, sequence);

  if (destIdx <= busIdx) {
    return { dwellSeconds: 0, numStops: 0, busPassed: true };
  }

  // バスとデスティネーションの間の経由点 (両端は除外)
  const intermediates = sequence.slice(busIdx + 1, destIdx);

  let dwellSeconds = 0;
  let numStops = 0;
  for (const p of intermediates) {
    if (!p.isStop) continue; // 信号交差点や152号中継点は除外
    dwellSeconds += p.dwellTime || 0;
    numStops += 1;
  }

  return { dwellSeconds, numStops, busPassed: false };
}

// ===== handlers =====
// /api/stops - バス停一覧を返す (Cloudflare Pages Functions)

async function handleStops() {
  return jsonResponse(BUS_STOPS, 200, 3600); // 1時間キャッシュ (静的データ)
}

// /api/config - 設定情報を返す (Cloudflare Pages Functions)

async function handleConfig({ env }) {
  const hasKey = !!env.GOOGLE_MAPS_API_KEY;
  return jsonResponse({
    hasGoogleMapsKey: hasKey,
    routingSource: hasKey ? 'google' : 'osrm',
  });
}

// /api/bus-location - 運行中バスのGPS位置を返す (Cloudflare Pages Functions)

function detectDirection(lat, lng) {
  const idx = findNearestStopIndex(lat, lng, BUS_STOPS);
  const stop = BUS_STOPS[idx];
  return { nearestStopIndex: idx, nearestStop: stop.name, order: stop.order };
}

async function handleBusLocation() {
  try {
    const active = await fetchActiveBuses();
    const buses = active.map(b => {
      const d = detectDirection(b.lat, b.lng);
      return {
        ...b,
        nearestStop: d.nearestStop,
        nearestStopIndex: d.nearestStopIndex,
        stopOrder: d.order,
      };
    });

    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses,
      busCount: buses.length,
      isRunning: buses.length > 0,
    }, 200, 10); // 10秒CDNキャッシュ
  } catch (e) {
    return jsonResponse({
      lastUpdated: new Date().toISOString(),
      buses: [],
      busCount: 0,
      isRunning: false,
      error: e.message,
    }, 200, 0);
  }
}

// /api/estimate - 到着予測 (実際のバスルート + 渋滞考慮) (Cloudflare Pages Functions)

const AVG_BUS_SPEED_KMH = 30;

// Google Directions API + 渋滞考慮 (実際のバスルート上を強制経由)
async function estimateViaGoogleTraffic(bus, destLat, destLng, dwellSecondsTotal, apiKey) {
  if (!apiKey) return null;

  const wp = getWaypointsForGoogle(bus.direction, bus.lat, bus.lng, destLat, destLng);
  if (!wp) return null;
  if (wp.busPassed) return { busPassed: true };

  const distResult = calculateRouteDistance(bus.lat, bus.lng, destLat, destLng, bus.direction);
  const distanceKm = distResult ? distResult.distanceKm : null;

  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${bus.lat},${bus.lng}&destination=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
  if (wp.waypoints.length > 0) {
    const wpStr = wp.waypoints.map(p => 'via:' + encodeURIComponent(p.loc)).join('|');
    url += `&waypoints=${wpStr}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) return null;

  const route = data.routes[0];
  let totalDuration = 0;
  let hasAnyTraffic = false;
  for (const leg of route.legs) {
    const dur = leg.duration?.value || 0;
    const traf = leg.duration_in_traffic?.value;
    if (traf != null) {
      totalDuration += traf;
      hasAnyTraffic = true;
    } else {
      totalDuration += dur;
    }
  }
  const totalSeconds = totalDuration + dwellSecondsTotal;

  return {
    duration_minutes: Math.max(0, Math.round(totalSeconds / 60)),
    distance_km: distanceKm != null ? Math.round(distanceKm * 10) / 10 : Math.round(route.legs.reduce((s, l) => s + l.distance.value, 0) / 100) / 10,
    source: 'google-traffic-on-fixed-route',
    traffic_aware: hasAnyTraffic,
    bus_passed: false,
  };
}

function estimateAlongFixedRoute(busLat, busLng, destLat, destLng, direction, dwellSecondsTotal) {
  const result = calculateRouteDistance(busLat, busLng, destLat, destLng, direction);
  if (!result) return null;
  const { distanceKm, busPassed } = result;
  const travelMinutes = (distanceKm / AVG_BUS_SPEED_KMH) * 60;
  const totalMinutes = travelMinutes + dwellSecondsTotal / 60;
  return {
    duration_minutes: Math.max(0, Math.round(totalMinutes)),
    distance_km: Math.round(distanceKm * 10) / 10,
    source: 'fixed-route',
    traffic_aware: false,
    bus_passed: busPassed,
  };
}

function fallbackEstimate(busLat, busLng, destLat, destLng, dwellSecondsTotal) {
  const dist = haversineDistance(busLat, busLng, destLat, destLng);
  const roadDist = dist * 1.3;
  const minutes = Math.round((roadDist / AVG_BUS_SPEED_KMH) * 60) + Math.round(dwellSecondsTotal / 60);
  return {
    duration_minutes: minutes,
    distance_km: Math.round(roadDist * 10) / 10,
    source: 'fallback',
    traffic_aware: false,
    bus_passed: false,
  };
}

async function handleEstimate({ request, env }) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const stops = BUS_STOPS;

  let targetLat, targetLng, targetName, targetStopIdx;

  if (params.stopIndex != null) {
    const idx = parseInt(params.stopIndex, 10);
    if (idx < 0 || idx >= stops.length) {
      return jsonResponse({ error: 'バス停が見つかりません' }, 400);
    }
    targetLat = stops[idx].lat;
    targetLng = stops[idx].lng;
    targetName = stops[idx].name;
    targetStopIdx = idx;
  } else if (params.lat && params.lng) {
    targetLat = parseFloat(params.lat);
    targetLng = parseFloat(params.lng);
    targetName = '現在地付近';
    targetStopIdx = findNearestStopIndex(targetLat, targetLng, stops);
  } else {
    return jsonResponse({ error: 'stopIndex または lat/lng を指定してください' }, 400);
  }

  let buses = [];
  try {
    buses = await fetchActiveBuses();
  } catch (e) {}

  if (buses.length === 0) {
    return jsonResponse({
      target: targetName,
      isRunning: false,
      message: '現在バスは運行していません',
      estimates: [],
    });
  }

  const apiKey = env.GOOGLE_MAPS_API_KEY;
  const estimates = [];
  for (const bus of buses) {
    const journey = getJourneyInfo(bus.direction, bus.lat, bus.lng, targetLat, targetLng);
    const dwellSecondsTotal = journey?.dwellSeconds || 0;
    const numStops = journey?.numStops || 0;
    const busAlreadyPassed = journey?.busPassed || false;

    let routing = null;
    try {
      routing = await estimateViaGoogleTraffic(bus, targetLat, targetLng, dwellSecondsTotal, apiKey);
    } catch (_) {
      routing = null;
    }
    if (!routing) {
      routing = estimateAlongFixedRoute(
        bus.lat, bus.lng, targetLat, targetLng, bus.direction, dwellSecondsTotal
      );
    }
    if (!routing) {
      routing = fallbackEstimate(
        bus.lat, bus.lng, targetLat, targetLng, dwellSecondsTotal
      );
    }
    if (busAlreadyPassed) routing.bus_passed = true;

    estimates.push({
      route: bus.route,
      busLat: bus.lat,
      busLng: bus.lng,
      estimatedMinutes: routing.duration_minutes,
      distanceKm: routing.distance_km,
      numStops,
      source: routing.source,
      trafficAware: routing.traffic_aware,
      busPassed: routing.bus_passed || false,
      timestamp: bus.timestamp,
    });
  }

  estimates.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);

  return jsonResponse({
    target: targetName,
    targetLat,
    targetLng,
    isRunning: true,
    estimates,
  });
}

// ===== ルーター =====
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/stops') return await handleStops();
      if (path === '/api/config') return await handleConfig({ env });
      if (path === '/api/bus-location') return await handleBusLocation();
      if (path === '/api/estimate') return await handleEstimate({ request, env });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 静的ファイルへのフォールバック
    return env.ASSETS.fetch(request);
  }
};
