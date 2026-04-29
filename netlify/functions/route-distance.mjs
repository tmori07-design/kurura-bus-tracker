// 固定ルートに基づく距離計算モジュール
// バスは事前生成済みのポリライン（public/routes.json と同じデータ）を必ず通る前提で
// 距離・到着時刻を算出する。Google Mapsの「最適ルート」には依存しない。

import { haversineDistance } from './shared.mjs';

// 事前生成済みルートポリライン（public/routes.json と同期）
// 編集時は両方を一致させること
const POLYLINES = {
  'to-wada': [
    "uhxwEocehY{@_AZk@z@aB|BkEP[Vi@RNbDjCnElDrAlAn@kApA_D^_A}@o@aE_DcCgBmBwAp@eBp@aBpAkChCyDlMk\\~K_ZfBaEbAw@xG{BnDy@~AAV?LyAj@}FrA}MVmC`@_Hh@{FhFk[zCkUjFm_@vAoErBwBhAi@`Ca@j@AhA@Dw@ZaGLyB@SrAJjAJd@FbCr@v@\\x@PLCjCr@vDg@b@_APgB_AiCw@gFAwAZcAn@mAb@Kp@^RfFf@`@zBa@vCgAzEeA`AQZ]EaBm@iE]}DLoC^aBhA}BP{EfAuDvCuGnB{CZyAf@yFnAcHp@}BJ{BVmJUiEByCnAgFdBgE~AcCfAmAxCgB~CL|@ER`@bBh@|@r@}@s@cBi@Sa@ZSfBsCxEuGfA}B^gBIaAOkB]g@_BmCsAyDScBFsEOsBOp@SGk@wA_@S[m@MkAUw@HM|@`BnEeA?aAxCm@BLBRXLZHTPXu@MqCpAgBXiBQ{@q@m@_@_B[}@w@i@aC}@}A_BkCNgAVoARkBkA{B_JAcAx@iAz@_Af@RnBt@bBoDdDiFf@g@nAEpHmFZiBCs@a@m@oB{AlEiG|BaCzAyA^eANw@nBmAzAcAr@iCr@eDp@kBZiArBkCn@}ATe@zBBbA]fCd@jABlAm@hCuC`Eu@n@mArAoAt@c@~B?dABzBi@nCm@lAaAz@q@vC_@fAi@hB{ANyCb@oDh@kA~@s@dDyAhAAz@AZMv@IbBaA`BXt@At@a@nCoCf@CvAj@xBt@dABnAQTq@b@yC`BaBzBkAvAYvCy@\\Az@{AfAcAXmAt@o@`Cs@zBMdAJ`@Hp@QjBgCfCmCn@oBWYWTcDjEy@b@Mg@~@u@xB{EbAqCf@}@hAq@zEmCh@A`@\\rA\\rB|@h@QpBmB@}AAk@j@{AHcBAgA^eAJs@g@u@yCeCcBsCoAoDB}@|@cBh@cA`AkDOgBaAyAaBs@a@iBU}CDcI@k@\\BTF`@t@j@pBf@tE?nAm@~AqAXaAGWUK{@hAoHfDee@dQgjC|IssAhAaMjAaFfBeEtAyBvEmEbGyC~CsArBWvBc@bAYdCPvA^`An@dB`BxAn@nDx@zCp@hAx@zAhChArAdAf@b@EnBaAy@b@mBh@~A~@z@IhAcAlAeAz@I~@\\jEtFjAn@x@E`Di@p@@vBr@xAfAjArBv@bCtBzBtA`Bx@rBnB`BtAXfBu@~BH~BfArApBhB|EhHrCjDLzBhAtBj@hBf@l@z@|AlIpA`HbAdBxAfAdBh@jBIhF{@nEsAzEP",
    "socwEomciYzCRj@Fr@PhCnA`@Nb@DnBBx@LvBl@lEnAtBn@hDv@hA\\hAXlBPt@JbCZ`@Pp@b@l@Vf@DX?~@A`@DrAb@rCt@f@Pb@R^Z^l@v@bBZj@JNVPPFRB^CxCy@LCBLBFCGCMHELGROX]RWVSb@Qb@M|A@NBRFd@X`@Zh@t@NZ^vA`@bBLZNRRRRHf@FRD\\PVZVn@P~@LZLPb@Vt@Lt@F|@IvAMf@K`@Q^Y`@m@XiA\\aBRe@P[\\_@ZQd@S~@It@ATBRFb@Pb@TRPb@NX?l@OnAYVCXBVJ~@n@|AfAh@\\`@Hh@@h@Q\\U|BmBh@_@b@S`@Kx@Aj@Hd@Ln@RXNVTX^fBnCVh@\\fAXbAPb@TZb@Xb@JxBP`Fb@",
    "up}vE{zaiYrAT`AXjAb@lAd@nAj@bAj@`Af@v@Pn@JbDj@bCt@xB|@~FpBdBj@`Ct@r@FfAB\\D^Jb@P~@l@p@\\`@FZ?pAIZGdAUXKh@GZAl@Fv@VhAj@^^Vd@`AnDTb@\\^hBfAjBdAtAfAbAx@rBnAhAh@b@Hj@CvFa@p@E`AFp@RlCtAz@l@|@h@f@^dA^bAZ`D|@b@Fn@@r@AVIb@Y`@c@x@q@TIp@KrA@~@HXLHHhA|@|A~@jAh@r@Vp@LVD~DnA~Al@rAf@rA^tA\\p@T`D|ArAp@hAh@ZH`@DpEVbBEb@Cl@At@Fj@Lp@\\z@n@`Ar@|@v@x@j@TR~@z@^d@pAbCn@lA^f@p@l@jCbBt@\\l@PXDj@?h@GvB]hASbAU`@Qd@Yr@s@bAoApB{Bf@[^K`@D|@f@|@h@GRAD@DDPHDTLUMIEAEEQ@EFSbB|@tDxBfBdAzBrAhBnA|AbA`At@~@f@vB`B\\VtAnAlArAxIfM|GtJhAxAfD`FbAdCt@~Bd@nBj@jCRfAh@pCN~@TnB@NB?HCDEEy@Au@BKHCPDFDB@?QJo@BQNm@Lg@@KDAJIPAh@DT?|@W\\@l@FLHVDv@AVJH?DWDg@L_ABg@Ge@EUA[By@Ai@CUEUC]E_@[y@aAeDWw@KSEe@EUm@o@GOASDYPm@NWVSp@[\\KvAMR?r@KVK^YJSBOAaDAg@Ec@Qy@CMBLDVLf@Dj@BlDCXELQRa@Te@HQDMB}@Bm@Hq@Vg@XMLUl@I`@?TBNJPZXNVBb@DTJPhBzFLf@@\\Jv@@h@Cj@?XB\\H\\@\\K|@KbAQhAc@nAm@zBI`@A^?j@D\\Pr@d@z@XZVRtAjBjAbAj@b@RJd@Tr@f@f@^`@Th@Rn@LrAX`Cp@l@RTJGNq@~Ai@fA{A|C{@~Aj@p@zAlBbBxBbA`BbAlB`AvBXv@`@W",
  ],
  'to-iida': [
    "atqvEalzhYa@VCIQe@s@aBaAmB}@{AeBaCaBuBs@w@IMLQTa@nBcEZm@jAoCm@W}Bm@uCq@cA_@k@c@}AcAq@_@yAmAg@o@o@}@m@g@k@_ASq@IgAH_Af@qBh@cBNw@NuALuAO_ABiBK}@Ce@Me@gByFSe@Ci@IOk@o@Ee@D[Vo@JQd@[l@U`@I|AIt@O\\OVWHO@SAgDAi@Ga@S{@m@wB_@mAi@aAESDk@n@yDDe@Go@Gk@WoA]y@OAm@Ji@NQRW|@Uh@SJSBYGYMy@i@[KY?WA_@KoAk@EGIBG@OEu@W[MKMaAkBw@wAy@w@{AwAmAy@y@kA[]e@_@QG_@Si@s@[YyAa@k@Ia@Hi@?kAEe@Hk@PcAd@o@Nc@PYXOTkAnCSl@I^Yv@gA|BSZa@Tu@Zq@`@QRM`@Yd@[`@MHKHKRUx@QhA]p@QRo@@o@Ky@SkCqAYUMW@WNo@`@sATeAJiACg@[i@k@e@o@_@c@Ua@WEOH]mBiAUI_@Aa@LSJe@f@sB~Bs@x@u@p@g@Z_@LaAReBZ_BTc@Be@Aa@Gs@UkAq@qBsAk@k@a@k@iA}By@uA]_@cA_AyAeAq@k@aCgBq@Wi@Iq@Ek@BcBFw@AyDUaASwFoCyB}@qBi@uCeAsC}@eCu@[Eo@Qy@[iB_AgAw@o@g@SOa@KcAEgA@k@Jk@Za@`@e@b@c@XSDcA?m@CqA[cCs@gA]i@Wi@_@cAo@[WiAi@cB{@i@M_ACgAFiF^a@?i@M}Ay@cBgAcA{@yAeAaB}@}@i@k@c@Y[Ui@e@kB]aAYe@WWsAm@iAYaAD}Bh@qBN_@C_@Mq@_@cAm@y@We@CkACg@IkFcBqGyBwB{@oBk@iDk@u@Oq@UmCwAyD{A_Co@y@MmGi@gAKi@O[WQWSg@_@sA_@eAa@u@_BaC[]YQmAa@mAOo@Bi@Nc@Vm@d@sBdB_@Rm@Ji@C]Ma@YuByAg@]]K[AUDwA\\a@J_@C{Ay@c@Qk@GkADc@Ho@Xs@r@_@bA_@jB[~@g@j@e@X_BXqBLmAKa@M_@YKQ_@_BWi@WW_@QSEk@Ic@_@Q[w@aDSo@]i@_@g@c@Yc@Wo@ImA@kA`@i@p@UVWNQHFTGUYFw@T_B`@_@?c@Oa@c@a@y@y@cBU[m@c@aBg@gEmA]CgA@a@Ae@K_@So@_@c@SsC]}C]uCy@kDw@oIgCwBi@g@EkBAc@I_@MeAk@mAg@u@Oa@EsCQ",
    "socwEomciY{EQoErAiFz@kBHeBi@yAgAcAeBm@wBc@iDq@aEk@kCm@{@iBg@uBk@{BiAaDIkHqCk@w@w@kCqAaCgBkAuCYqBv@kAM}BeBq@cBgA}AiCmCq@gB}@yBeB{AeDaAyCd@mAJiAg@gEqFy@e@iABy@n@{AxAy@J}Aw@AKPCj@KhB_AiB~@k@JQBs@c@YYk@q@wAgCkAaA}@[aGoAeBk@qBmBaAo@wA_@eCQsDdAcC\\oChAyFrCqD|Cs@|@sArBsAxCk@fB_A~E_Cr]{J`zA}P|gCoA~VPh@b@Vb@C\\[P{@E}Bc@uCu@wC_@O]CAj@GfBCtCD|AVhDl@rAhBx@v@fBMfCgB|D[b@WjAHpAzAdD~A|B|ChCRd@]lASv@H|Aq@bC@rB?Z_BbB}@j@YGoBw@q@Kc@_@_@Qq@N{ErCgAx@e@jAcBjE{@lBm@f@_@f@ZZpBkBjBsCT?LZeA|BuAnAw@vAc@l@kAz@wAUgET_ChAs@rBi@^_AzAYRo@@iD`AiErBiA|A]~Ce@b@uABgAOaDmAa@Km@\\_DrCg@Lq@Ms@Qc@F_At@g@FcATcBEqBn@wBhAu@~@_@rAY~DCfAUj@sBxAaAZoC^cAjA_Cz@kB`@kB\\wBGgADuAhAaBzByBZsA^kCxCiAb@_B[mBQaA\\{BCOz@mBrC{@vAc@pAe@|BiBhGaDbBg@|@Qp@a@x@wAtA}CbD_BjCs@|@STPTt@d@|@r@Nb@EzA[~@iFxDu@f@k@Fu@Bm@r@cDlF}@`Cc@Zu@Qw@k@k@EoAxA_@z@LfAvAxFn@dBhBv@tA_@~B[bABz@dAp@\\nChA^b@VlA\\jAp@l@H`Ai@rBcArAJ|CyAtDkBN[h@sAKi@VKl@Mr@SCg@sAYSe@s@OgASy@BSh@n@Tp@nEaA?cAxCq@Lp@`AZm@nBa@n@oA@[\\c@PoAIYj@@~JhBhGfBlCVh@NpBDz@g@lBcApB{FbIiAdBSJN\\LFhBp@b@^gAw@sAa@O]c@Fq@E}AOgARmChBiAvAaBlCcCnHa@~BLzEBxEUbISvAaA~C}@dGg@`GeDxF{CfHc@lCYtEmAhCYzBAdC^jDr@dEOpA{Cn@}DbAoCjAcANc@I_@u@AoCSmAy@K_@Zu@fBIn@NtB|@xEp@rBa@rBKVaA\\aBRkAOgBc@EBy@QmDkAs@MkAKsAKARMxBI~AWxEeEJ}CzAoBlCyArGeFv_@cAvIkAfH_ClMgBjMeAbOqC~XMxAW?_A@}@@kF|AyEfBq@r@cC~F_N`^cHjQ",
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
export function calculateRouteDistance(busLat, busLng, destLat, destLng, direction) {
  const coords = getDecodedRoute(direction);
  if (!coords || coords.length === 0) return null;

  const busIdx = findClosestPointIndex(busLat, busLng, coords);
  const destIdx = findClosestPointIndex(destLat, destLng, coords);

  // 進行方向と逆向き(destIdx < busIdx)なら、バスは目的地を通過済み
  const busPassed = destIdx < busIdx;
  const distanceKm = distanceAlongPolyline(coords, busIdx, destIdx);

  return { distanceKm, busPassed };
}
