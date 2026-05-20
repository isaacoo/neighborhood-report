import axios from 'axios';
import type {
  RegionSearchResult,
  Report,
  PricePeriod,
  PriceSummary,
  InfraResult,
  EnvironmentResult,
  SafetyResult,
} from '@neighborhood-report/shared';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const http = axios.create({ baseURL, timeout: 30000 });

export interface SearchData {
  results: RegionSearchResult[];
  suggestions: string[];
}

export interface TransitSummary {
  regionCode: string;
  nearestStations: Array<{ name: string; lines: string[]; distance: number }>;
  countWithin500m: number;
  countWithin1km: number;
  countWithin2km: number;
  dataSource: string;
  dataTimestamp: string;
}

export interface ReportWithSummaries extends Report {
  summaries?: {
    price?: PriceSummary;
    infra?: InfraResult;
    environment?: EnvironmentResult;
    transit?: TransitSummary;
    safety?: SafetyResult;
  };
}

export interface CompareData {
  reports: ReportWithSummaries[];
  highlights: Record<string, string>;
  strengthsWeaknesses: Array<{
    regionCode: string;
    strongest: string | null;
    weakest: string | null;
  }>;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

export async function searchRegions(query: string): Promise<SearchData> {
  const res = await http.get<ApiSuccess<SearchData>>('/search', { params: { q: query } });
  return res.data.data;
}

export async function getReport(
  regionCode: string,
  options: {
    period?: PricePeriod;
    regionName: string;
    parentRegionName: string;
    lat?: number | null;
    lon?: number | null;
  },
): Promise<ReportWithSummaries> {
  const res = await http.get<ApiSuccess<ReportWithSummaries>>(`/report/${regionCode}`, {
    params: {
      period: options.period ?? '6m',
      regionName: options.regionName,
      parentRegionName: options.parentRegionName,
      lat: options.lat ?? '',
      lon: options.lon ?? '',
    },
  });
  return res.data.data;
}

export async function compareCandidates(
  candidates: Array<{
    regionCode: string;
    regionName: string;
    parentRegionName: string;
    latitude?: number | null;
    longitude?: number | null;
  }>,
  period: PricePeriod = '6m',
  sortBy?: string,
): Promise<CompareData> {
  const res = await http.post<ApiSuccess<CompareData>>('/compare', {
    candidates,
    period,
    sortBy,
  });
  return res.data.data;
}
