import { get } from './request';

export interface TrendData {
  issue: string;
  draw_date: string;
  red_balls: string[];
  blue_ball?: string;
  bonus_balls?: string[];
}

export interface OmissionData {
  type: string;
  omission: Array<{ number: string; missed: number; maxMissed: number; avgMissed: number }>;
}

export interface DistributionData {
  type: string;
  distribution: Array<{ number: string; count: number }>;
}

export interface HotColdData {
  type: string;
  periods: number;
  hot: Array<{ number: string; count: number }>;
  cold: Array<{ number: string; count: number }>;
}

export interface AnalysisData {
  type: string;
  periods: number;
  topHot: Array<{ number: string; count: number; trend: 'up' | 'down' | 'flat' }>;
  omissionRank: Array<{ number: string; missed: number; maxMissed: number }>;
  hotColdMap: Array<{ number: string; count: number; status: 'hot' | 'cold' | 'warm' }>;
  pairAnalysis: Array<{ pair: string; probability: number; count: number }>;
  sumAnalysis: { range: string; count: number; avgSum: number; distribution: Array<{ range: string; count: number }> };
  oddEvenRatio: { odd: number; even: number; distribution: Array<{ odd: number; even: number; count: number }> };
  bigSmallRatio: { big: number; small: number; distribution: Array<{ big: number; small: number; count: number }> };
  consecutiveAnalysis: { hasConsecutive: number; noConsecutive: number; avgConsecutivePerDraw: number };
  zoneDistribution: Array<{ zone: string; count: number; percentage: number }>;
  insight: string;
  disclaimer: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function getTrend(type: string, periods: number) {
  return get<ApiResponse<TrendData[]>>(`/tools/trend/${type}/${periods}`);
}
export function getOmission(type: string, periods: number = 50) {
  return get<ApiResponse<OmissionData>>(`/tools/omission/${type}?periods=${periods}`);
}
export function getDistribution(type: string, periods: number = 50) {
  return get<ApiResponse<DistributionData>>(`/tools/distribution/${type}?periods=${periods}`);
}
export function getHotCold(type: string, periods: number) {
  return get<ApiResponse<HotColdData>>(`/tools/hotcold/${type}/${periods}`);
}
export function getAnalysis(type: string, periods: number) {
  return get<ApiResponse<AnalysisData>>(`/tools/analysis/${type}/${periods}`);
}
