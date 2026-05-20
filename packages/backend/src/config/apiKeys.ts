/** 공공 API 설정 */
export const API_CONFIG = {
  /** 공통 인증키 */
  serviceKey: process.env.DATA_GO_KR_API_KEY || '',

  /** 국토교통부 아파트 매매 실거래가 */
  molitAptTrade: {
    baseUrl: process.env.MOLIT_APT_TRADE_URL || 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade',
  },

  /** 국토교통부 아파트 전월세 실거래가 */
  molitAptRent: {
    baseUrl: process.env.MOLIT_APT_RENT_URL || 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent',
  },

  /** 한국환경공단 에어코리아 대기오염정보 */
  airkorea: {
    baseUrl: process.env.AIRKOREA_URL || 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc',
  },

  /** 기상청 단기예보 */
  kmaForecast: {
    baseUrl: process.env.KMA_SHORT_FORECAST_URL || 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0',
  },

  /** 행정안전부 법정동코드 */
  regionCode: {
    baseUrl: process.env.MOIS_REGION_CODE_URL || 'https://apis.data.go.kr/1741000/StanReginCd',
  },

  /** 건강보험심사평가원 병원정보 */
  hiraHospital: {
    baseUrl: process.env.HIRA_HOSPITAL_URL || 'https://apis.data.go.kr/B551182/hospInfoServicev2',
  },
} as const;
