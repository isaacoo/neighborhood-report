/**
 * OpenStreetMap 정적 타일 URL 생성.
 * 무료, API 키 불필요. 줌 레벨 14 (동네 수준).
 *
 * 좌표가 없으면 null 반환 → fallback 그라데이션 사용.
 */
export function getMapTileUrl(
  latitude: number | null,
  longitude: number | null,
  zoom = 14,
  width = 400,
  height = 200,
): string | null {
  if (!latitude || !longitude || latitude === 0 || longitude === 0) return null;

  // OSM 타일 좌표 계산
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((longitude + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan((latitude * Math.PI) / 180) + 1 / Math.cos((latitude * Math.PI) / 180)) / Math.PI) / 2) * n,
  );

  // 단일 타일 256x256 사용 (간단한 preview)
  return `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;
}
