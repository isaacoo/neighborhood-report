import { Router } from 'express';
import { AppDeps } from '../composition';
import { MAX_SEARCH_QUERY_LENGTH } from '@neighborhood-report/shared';

export function createSearchRouter(deps: AppDeps): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const query = (req.query.q as string | undefined)?.trim();
      if (!query) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '검색어를 입력해주세요.' },
        });
      }
      if (query.length > MAX_SEARCH_QUERY_LENGTH) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `검색어는 ${MAX_SEARCH_QUERY_LENGTH}자 이내로 입력해주세요.` },
        });
      }
      const results = await deps.regionCodeClient.search(query);
      const suggestions =
        results.length === 0 ? ['상위 행정구역명으로 검색해보세요', '동/읍/면 단위 이름을 입력해보세요'] : [];
      res.json({ success: true, data: { results, suggestions } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
