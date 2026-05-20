/**
 * 서울 주요 지하철역 좌표 (MVP).
 * 후보지 좌표 기준 반경별 역 수를 세서 교통 접근성 점수로 사용.
 *
 * 출처: 서울 열린데이터광장 지하철역 위치 정보 (공공 데이터).
 * Post-MVP: API 연동으로 전국 확장 + 노선 정보까지.
 *
 * 대표 역만 등록 (~50개). 동일 좌표의 환승역은 1번만.
 */

export interface Station {
  name: string;
  lines: string[];
  latitude: number;
  longitude: number;
}

export const SEOUL_STATIONS: Station[] = [
  { name: '서울역',     lines: ['1','4','경의중앙','공항철도'], latitude: 37.5547, longitude: 126.9707 },
  { name: '시청',       lines: ['1','2'], latitude: 37.5650, longitude: 126.9779 },
  { name: '종각',       lines: ['1'],     latitude: 37.5701, longitude: 126.9826 },
  { name: '종로3가',    lines: ['1','3','5'], latitude: 37.5715, longitude: 126.9919 },
  { name: '동대문',     lines: ['1','4'], latitude: 37.5715, longitude: 127.0094 },
  { name: '청량리',     lines: ['1','경의중앙','분당','수인분당'], latitude: 37.5800, longitude: 127.0466 },

  { name: '을지로입구', lines: ['2'], latitude: 37.5660, longitude: 126.9826 },
  { name: '동대문역사문화공원', lines: ['2','4','5'], latitude: 37.5651, longitude: 127.0091 },
  { name: '왕십리',     lines: ['2','5','경의중앙','분당','수인분당'], latitude: 37.5612, longitude: 127.0376 },
  { name: '잠실',       lines: ['2','8'], latitude: 37.5132, longitude: 127.1000 },
  { name: '강변',       lines: ['2'],     latitude: 37.5354, longitude: 127.0946 },
  { name: '건대입구',   lines: ['2','7'], latitude: 37.5403, longitude: 127.0703 },
  { name: '강남',       lines: ['2','신분당'], latitude: 37.4979, longitude: 127.0276 },
  { name: '교대',       lines: ['2','3'], latitude: 37.4934, longitude: 127.0144 },
  { name: '사당',       lines: ['2','4'], latitude: 37.4768, longitude: 126.9817 },
  { name: '신도림',     lines: ['1','2'], latitude: 37.5089, longitude: 126.8911 },
  { name: '홍대입구',   lines: ['2','경의중앙','공항철도'], latitude: 37.5572, longitude: 126.9245 },
  { name: '합정',       lines: ['2','6'], latitude: 37.5495, longitude: 126.9136 },
  { name: '신촌',       lines: ['2'],     latitude: 37.5556, longitude: 126.9367 },

  { name: '약수',       lines: ['3','6'], latitude: 37.5544, longitude: 127.0107 },
  { name: '교대',       lines: ['3','2'], latitude: 37.4934, longitude: 127.0144 },
  { name: '고속터미널', lines: ['3','7','9'], latitude: 37.5045, longitude: 127.0048 },
  { name: '압구정',     lines: ['3'],     latitude: 37.5273, longitude: 127.0286 },
  { name: '도곡',       lines: ['3','분당','수인분당'], latitude: 37.4904, longitude: 127.0454 },
  { name: '대치',       lines: ['3'],     latitude: 37.4940, longitude: 127.0631 },
  { name: '연신내',     lines: ['3','6'], latitude: 37.6189, longitude: 126.9210 },

  { name: '명동',       lines: ['4'],     latitude: 37.5611, longitude: 126.9863 },
  { name: '회현',       lines: ['4'],     latitude: 37.5589, longitude: 126.9785 },
  { name: '삼각지',     lines: ['4','6'], latitude: 37.5345, longitude: 126.9731 },
  { name: '이수(총신대입구)', lines: ['4','7'], latitude: 37.4868, longitude: 126.9817 },
  { name: '노원',       lines: ['4','7'], latitude: 37.6543, longitude: 127.0610 },

  { name: '광화문',     lines: ['5'],     latitude: 37.5715, longitude: 126.9764 },
  { name: '여의도',     lines: ['5','9'], latitude: 37.5215, longitude: 126.9243 },
  { name: '공덕',       lines: ['5','6','경의중앙','공항철도'], latitude: 37.5446, longitude: 126.9519 },
  { name: '왕십리',     lines: ['5'],     latitude: 37.5612, longitude: 127.0376 },
  { name: '천호',       lines: ['5','8'], latitude: 37.5384, longitude: 127.1233 },
  { name: '오목교',     lines: ['5'],     latitude: 37.5240, longitude: 126.8753 },

  { name: '망원',       lines: ['6'],     latitude: 37.5559, longitude: 126.9105 },
  { name: '월드컵경기장',lines:['6'],     latitude: 37.5683, longitude: 126.8975 },
  { name: '이태원',     lines: ['6'],     latitude: 37.5345, longitude: 126.9947 },
  { name: '한강진',     lines: ['6'],     latitude: 37.5390, longitude: 127.0024 },
  { name: '효창공원앞', lines: ['6','경의중앙'], latitude: 37.5394, longitude: 126.9614 },

  { name: '상봉',       lines: ['7','경의중앙','경춘'], latitude: 37.5961, longitude: 127.0856 },
  { name: '뚝섬유원지', lines: ['7'],     latitude: 37.5305, longitude: 127.0671 },
  { name: '논현',       lines: ['7','신분당'], latitude: 37.5113, longitude: 127.0218 },
  { name: '학동',       lines: ['7'],     latitude: 37.5142, longitude: 127.0319 },
  { name: '강남구청',   lines: ['7','수인분당'], latitude: 37.5174, longitude: 127.0410 },
  { name: '청담',       lines: ['7'],     latitude: 37.5191, longitude: 127.0530 },

  { name: '석촌',       lines: ['8','9'], latitude: 37.5050, longitude: 127.1056 },
  { name: '암사',       lines: ['8'],     latitude: 37.5523, longitude: 127.1276 },

  { name: '국회의사당', lines: ['9'],     latitude: 37.5283, longitude: 126.9173 },
  { name: '신논현',     lines: ['9','신분당'], latitude: 37.5045, longitude: 127.0252 },
  { name: '선정릉',     lines: ['9','수인분당'], latitude: 37.5103, longitude: 127.0463 },
  { name: '봉은사',     lines: ['9'],     latitude: 37.5147, longitude: 127.0565 },
  { name: '삼성중앙',   lines: ['9'],     latitude: 37.5125, longitude: 127.0503 },
];
