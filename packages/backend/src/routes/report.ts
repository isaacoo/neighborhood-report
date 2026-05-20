import { Router } from 'express';
import { AppDeps } from '../composition';
import { PricePeriod } from '@neighborhood-report/shared';
import { getSggInfo } from '../domain/sggCoordinates';

export function createReportRouter(deps: AppDeps): Router {
  const router = Router();

  router.get('/:regionCode', async (req, res, next) => {
    try {
      const regionCode = req.params.regionCode;
      const period = (req.query.period as PricePeriod) ?? '6m';
      const sggCode = regionCode.substring(0, 5);

      const regionName = (req.query.regionName as string | undefined) ?? '(미지정)';
      const parentRegionName = (req.query.parentRegionName as string | undefined) ?? '서울특별시';

      const sggInfo = getSggInfo(sggCode);
      const lat = parseFloat(req.query.lat as string) || sggInfo?.latitude || 37.5665;
      const lon = parseFloat(req.query.lon as string) || sggInfo?.longitude || 126.978;

      const [priceR, infraR, envR, safetyR] = await Promise.allSettled([
        deps.priceAnalyzer.analyzeSale(sggCode, period),
        deps.infraAnalyzer.analyze(sggCode, lat, lon),
        deps.environmentAnalyzer.analyze(parentRegionName, regionCode),
        deps.safetyAnalyzer.analyze(sggCode, lat, lon),
      ]);
      // Transit은 동기 (정적 데이터)
      const transit = deps.transitAnalyzer.analyze(regionCode, lat, lon);

      const price = priceR.status === 'fulfilled' ? priceR.value : undefined;
      const infra = infraR.status === 'fulfilled' ? infraR.value : undefined;
      const environment = envR.status === 'fulfilled' ? envR.value : undefined;
      const safety = safetyR.status === 'fulfilled' ? safetyR.value : undefined;

      const usedApis: string[] = [];
      if (price) usedApis.push('국토교통부 아파트 매매 실거래가');
      if (infra) usedApis.push('건강보험심사평가원 병원정보');
      if (environment) usedApis.push('한국환경공단 에어코리아');
      if (transit) usedApis.push('서울 열린데이터광장 지하철역 위치 (정적)');
      if (safety) usedApis.push('건강보험심사평가원 병원정보 (응급의료 proxy)');

      const scoreResult = deps.scoreEngine.calculate({
        price,
        infra,
        environment,
        transit,
        safety,
      });
      const report = deps.reportComposer.compose(
        { regionCode, regionName, parentRegionName },
        scoreResult,
        usedApis,
        { price, infra, environment, transit, safety },
      );

      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
