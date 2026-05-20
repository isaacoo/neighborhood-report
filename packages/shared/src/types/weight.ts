/** 카테고리별 가중치 */
export interface CategoryWeight {
  category: string;
  weight: number;
  isRequired: boolean;
}

/** 가중치 프리셋 */
export interface WeightPreset {
  id: string;
  name: string;
  description: string;
  weights: CategoryWeight[];
}

/** 가중치 설정 */
export interface WeightConfig {
  version: string;
  weights: CategoryWeight[];
  presets: WeightPreset[];
  updatedAt: string;
}
