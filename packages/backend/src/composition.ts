import { RegionCodeClient } from './clients/RegionCodeClient';
import { MolitTradeClient } from './clients/MolitTradeClient';
import { AirKoreaClient } from './clients/AirKoreaClient';
import { HiraHospitalClient } from './clients/HiraHospitalClient';
import { MemoryCacheManager } from './cache/MemoryCacheManager';
import { PriceAnalyzer } from './domain/PriceAnalyzer';
import { InfraAnalyzer } from './domain/InfraAnalyzer';
import { EnvironmentAnalyzer } from './domain/EnvironmentAnalyzer';
import { TransitAnalyzer } from './domain/TransitAnalyzer';
import { SafetyAnalyzer } from './domain/SafetyAnalyzer';
import { ScoreEngine } from './domain/ScoreEngine';
import { ReportComposer } from './domain/ReportComposer';
import { ComparisonEngine } from './domain/ComparisonEngine';

export interface AppDeps {
  regionCodeClient: RegionCodeClient;
  molitTradeClient: MolitTradeClient;
  airKoreaClient: AirKoreaClient;
  hiraHospitalClient: HiraHospitalClient;
  cache: MemoryCacheManager;
  priceAnalyzer: PriceAnalyzer;
  infraAnalyzer: InfraAnalyzer;
  environmentAnalyzer: EnvironmentAnalyzer;
  transitAnalyzer: TransitAnalyzer;
  safetyAnalyzer: SafetyAnalyzer;
  scoreEngine: ScoreEngine;
  reportComposer: ReportComposer;
  comparisonEngine: ComparisonEngine;
}

export function createAppDeps(): AppDeps {
  const cache = new MemoryCacheManager();
  const regionCodeClient = new RegionCodeClient();
  const molitTradeClient = new MolitTradeClient();
  const airKoreaClient = new AirKoreaClient();
  const hiraHospitalClient = new HiraHospitalClient();

  const priceAnalyzer = new PriceAnalyzer(molitTradeClient, cache);
  const infraAnalyzer = new InfraAnalyzer(hiraHospitalClient, cache);
  const environmentAnalyzer = new EnvironmentAnalyzer(airKoreaClient, cache);
  const transitAnalyzer = new TransitAnalyzer();
  const safetyAnalyzer = new SafetyAnalyzer(hiraHospitalClient, cache);
  const scoreEngine = new ScoreEngine();
  const reportComposer = new ReportComposer();
  const comparisonEngine = new ComparisonEngine();

  return {
    regionCodeClient,
    molitTradeClient,
    airKoreaClient,
    hiraHospitalClient,
    cache,
    priceAnalyzer,
    infraAnalyzer,
    environmentAnalyzer,
    transitAnalyzer,
    safetyAnalyzer,
    scoreEngine,
    reportComposer,
    comparisonEngine,
  };
}
