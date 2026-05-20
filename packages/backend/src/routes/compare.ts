import { Router } from 'express';
import { AppDeps } from '../composition';
import { PricePeriod, Report } from '@neighborhood-report/shared';
import { getSggInfo } from '../domain/sggCoordinates';

export function createCompareRouter(deps: AppDeps): Router {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const { candidates, period = '6m', sortBy } = req.body as {
        candidates: Array<{
          regionCode: string;
          regionName: string;
          parentRegionName: string;
          latitude?: number;
          longitude?: number;
        }>;
        period?: PricePeriod;
        sortBy?: string;
      };

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '최소 1개 후보지를 전달해주세요.' },
        });
      }

      const reports: Report[] = await Promise.all(
        candidates.map(async (c) => {
          const sggCode = c.regionCode.substring(0, 5);
          const sggInfo = getSggInfo(sggCode);
          const lat = c.latitude && c.latitude !== 0 ? c.latitude : sggInfo?.latitude ?? 37.5665;
          const lon = c.longitude && c.longitude !== 0 ? c.longitude : sggInfo?.longitude ?? 126.978;

          const [priceR, infraR, envR, safetyR] = await Promise.allSettled([
            deps.priceAnalyzer.analyzeSale(sggCode, period),
            deps.infraAnalyzer.analyze(sggCode, lat, lon),
            deps.environmentAnalyzer.analyze(c.parentRegionName, c.regionCode),
            deps.safetyAnalyzer.analyze(sggCode, lat, lon),
          ]);
          const transit = deps.transitAnalyzer.analyze(c.regionCode, lat, lon);

          const price = priceR.status === 'fulfilled' ? priceR.value : undefined;
          const infra = infraR.status === 'fulfilled' ? infraR.value : undefined;
          const environment = envR.status === 'fulfilled' ? envR.value : undefined;
          const safety = safetyR.status === 'fulfilled' ? safetyR.value : undefined;

          const usedApis: string[] = [];
          if (price) usedApis.push('국토교통부 아파트 매매 실거래가');
          if (infra) usedApis.push('건강보험심사평가원 병원정보');
          if (environment) usedApis.push('한국환경공단 에어코리아');
          if (transit) usedApis.push('서울 지하철역 위치 (정적)');
          if (safety) usedApis.push('건강보험심사평가원 병원정보 (응급의료 proxy)');

          const scoreResult = deps.scoreEngine.calculate({
            price,
            infra,
            environment,
            transit,
            safety,
          });
          return deps.reportComposer.compose(
            { regionCode: c.regionCode, regionName: c.regionName, parentRegionName: c.parentRegionName },
            scoreResult,
            usedApis,
            { price, infra, environment, transit, safety },
          );
        }),
      );

      const sorted = sortBy ? deps.comparisonEngine.sortByCategory(reports, sortBy) : reports;
      const highlights = deps.comparisonEngine.highlightsByCategory(sorted);
      const sw = sorted.map((r) => ({
        regionCode: r.regionCode,
        ...deps.comparisonEngine.identifyStrengthWeakness(r),
      }));

      res.json({
        success: true,
        data: {
          reports: sorted,
          highlights,
          strengthsWeaknesses: sw,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
