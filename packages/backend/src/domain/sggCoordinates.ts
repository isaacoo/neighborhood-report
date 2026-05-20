/**
 * 행안부 법정동코드 sggCode(5자리) → 시군구 대표 좌표 + HIRA sgguCd 매핑.
 *
 * 행안부 법정동코드 API가 좌표를 제공하지 않아 시군구 단위 대표 좌표를 사용한다.
 * HIRA(심평원)는 고유 6자리 sgguCd를 사용하므로 별도 매핑 필요 (실제 API 호출로 검증된 매핑).
 *
 * MVP: 서울 25개 자치구만 등록. Post-MVP: 전국 확장.
 */

export interface SggInfo {
  name: string;
  latitude: number;
  longitude: number;
  /** HIRA 병원정보 API용 sgguCd (실제 응답 기반 검증 매핑) */
  hiraSgguCd: string | null;
  /** 에어코리아 API용 시도명 */
  sidoName: string;
}

const SGG_TABLE: Record<string, SggInfo> = {
  '11110': { name: '서울특별시 종로구',     latitude: 37.5735, longitude: 126.9788, hiraSgguCd: '110016', sidoName: '서울' },
  '11140': { name: '서울특별시 중구',       latitude: 37.5641, longitude: 126.9979, hiraSgguCd: '110017', sidoName: '서울' },
  '11170': { name: '서울특별시 용산구',     latitude: 37.5326, longitude: 126.9905, hiraSgguCd: '110014', sidoName: '서울' },
  '11200': { name: '서울특별시 성동구',     latitude: 37.5634, longitude: 127.0367, hiraSgguCd: '110011', sidoName: '서울' },
  '11215': { name: '서울특별시 광진구',     latitude: 37.5384, longitude: 127.0822, hiraSgguCd: '110023', sidoName: '서울' },
  '11230': { name: '서울특별시 동대문구',   latitude: 37.5744, longitude: 127.0395, hiraSgguCd: '110007', sidoName: '서울' },
  '11260': { name: '서울특별시 중랑구',     latitude: 37.6066, longitude: 127.0925, hiraSgguCd: '110019', sidoName: '서울' },
  '11290': { name: '서울특별시 성북구',     latitude: 37.5894, longitude: 127.0167, hiraSgguCd: '110012', sidoName: '서울' },
  '11305': { name: '서울특별시 강북구',     latitude: 37.6396, longitude: 127.0257, hiraSgguCd: '110024', sidoName: '서울' },
  '11320': { name: '서울특별시 도봉구',     latitude: 37.6688, longitude: 127.0471, hiraSgguCd: '110006', sidoName: '서울' },
  '11350': { name: '서울특별시 노원구',     latitude: 37.6543, longitude: 127.0568, hiraSgguCd: '110022', sidoName: '서울' },
  '11380': { name: '서울특별시 은평구',     latitude: 37.6027, longitude: 126.9291, hiraSgguCd: '110015', sidoName: '서울' },
  '11410': { name: '서울특별시 서대문구',   latitude: 37.5791, longitude: 126.9368, hiraSgguCd: '110010', sidoName: '서울' },
  '11440': { name: '서울특별시 마포구',     latitude: 37.5663, longitude: 126.9013, hiraSgguCd: '110009', sidoName: '서울' },
  '11470': { name: '서울특별시 양천구',     latitude: 37.5169, longitude: 126.8665, hiraSgguCd: '110020', sidoName: '서울' },
  '11500': { name: '서울특별시 강서구',     latitude: 37.5509, longitude: 126.8495, hiraSgguCd: '110003', sidoName: '서울' },
  '11530': { name: '서울특별시 구로구',     latitude: 37.4954, longitude: 126.8874, hiraSgguCd: '110005', sidoName: '서울' },
  '11545': { name: '서울특별시 금천구',     latitude: 37.4569, longitude: 126.8954, hiraSgguCd: '110025', sidoName: '서울' },
  '11560': { name: '서울특별시 영등포구',   latitude: 37.5264, longitude: 126.8962, hiraSgguCd: '110013', sidoName: '서울' },
  '11590': { name: '서울특별시 동작구',     latitude: 37.5124, longitude: 126.9393, hiraSgguCd: '110008', sidoName: '서울' },
  '11620': { name: '서울특별시 관악구',     latitude: 37.4784, longitude: 126.9516, hiraSgguCd: '110004', sidoName: '서울' },
  '11650': { name: '서울특별시 서초구',     latitude: 37.4837, longitude: 127.0324, hiraSgguCd: '110021', sidoName: '서울' },
  '11680': { name: '서울특별시 강남구',     latitude: 37.5172, longitude: 127.0473, hiraSgguCd: '110001', sidoName: '서울' },
  '11710': { name: '서울특별시 송파구',     latitude: 37.5145, longitude: 127.1059, hiraSgguCd: '110018', sidoName: '서울' },
  '11740': { name: '서울특별시 강동구',     latitude: 37.5301, longitude: 127.1238, hiraSgguCd: '110002', sidoName: '서울' },
};

export function getSggInfo(sggCode: string): SggInfo | null {
  return SGG_TABLE[sggCode] ?? null;
}

export function extractSidoFromParent(parentRegionName: string): string {
  const sidoMap: Record<string, string> = {
    서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구',
    인천광역시: '인천', 광주광역시: '광주', 대전광역시: '대전',
    울산광역시: '울산', 세종특별자치시: '세종',
    경기도: '경기', 강원도: '강원', 강원특별자치도: '강원',
    충청북도: '충북', 충청남도: '충남',
    전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남',
    경상북도: '경북', 경상남도: '경남',
    제주특별자치도: '제주',
  };
  const first = parentRegionName.split(' ')[0];
  return sidoMap[first] ?? '서울';
}
