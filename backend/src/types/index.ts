export type LotteryType = 'ssq' | 'd3' | 'qlc' | 'kl8';

export type Intent =
  | 'latest_draw'
  | 'history_query'
  | 'omission_query'
  | 'trend_query'
  | 'distribution_query'
  | 'hotcold_query'
  | 'rules_query'
  | 'prize_query'
  | 'schedule_query'
  | 'comparison_query'
  | 'basic_info'
  | 'greeting'
  | 'prediction'
  | 'recommendation'
  | 'unknown';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  data?: any;
  type: 'text' | 'chart' | 'data';
  disclaimer: string;
}

export interface SessionData {
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities: Record<string, any>;
}

export interface LotteryResult {
  id: number;
  type: string;
  issue: string;
  draw_date: string;
  red_balls: string[];
  blue_ball?: string;
  bonus_balls?: string[];
  prize_pool?: string;
  sales_amount?: string;
  created_at: string;
}

export interface TrendData {
  issue: string;
  draw_date: string;
  red_balls: string[];
  blue_ball?: string;
  bonus_balls?: string[];
}

export interface OmissionItem {
  number: string;
  missed: number;
  maxMissed: number;
  avgMissed: number;
}

export interface OmissionData {
  type: string;
  omission: OmissionItem[];
  disclaimer: string;
}

export interface DistributionItem {
  number: string;
  count: number;
}

export interface DistributionData {
  type: string;
  distribution: DistributionItem[];
  disclaimer: string;
}

export interface HotColdItem {
  number: string;
  count: number;
}

export interface HotColdData {
  type: string;
  periods: number;
  hot: HotColdItem[];
  cold: HotColdItem[];
  disclaimer: string;
}

export interface AnalysisPair {
  pair: string;
  probability: number;
  count: number;
}

export interface SumDistributionItem {
  range: string;
  count: number;
}

export interface OddEvenDistributionItem {
  odd: number;
  even: number;
  count: number;
}

export interface BigSmallDistributionItem {
  big: number;
  small: number;
  count: number;
}

export interface ZoneDistributionItem {
  zone: string;
  count: number;
  percentage: number;
}

export interface AnalysisHotItem {
  number: string;
  count: number;
  trend: 'up' | 'down' | 'flat';
}

export interface AnalysisOmissionItem {
  number: string;
  missed: number;
  maxMissed: number;
}

export interface AnalysisHotColdMapItem {
  number: string;
  count: number;
  status: 'hot' | 'cold' | 'warm';
}

export interface AnalysisSumAnalysis {
  range: string;
  count: number;
  avgSum: number;
  distribution: SumDistributionItem[];
}

export interface AnalysisOddEvenRatio {
  odd: number;
  even: number;
  distribution: OddEvenDistributionItem[];
}

export interface AnalysisBigSmallRatio {
  big: number;
  small: number;
  distribution: BigSmallDistributionItem[];
}

export interface AnalysisConsecutiveAnalysis {
  hasConsecutive: number;
  noConsecutive: number;
  avgConsecutivePerDraw: number;
}

export interface AnalysisData {
  type: string;
  periods: number;
  topHot: AnalysisHotItem[];
  omissionRank: AnalysisOmissionItem[];
  hotColdMap: AnalysisHotColdMapItem[];
  pairAnalysis: AnalysisPair[];
  sumAnalysis: AnalysisSumAnalysis;
  oddEvenRatio: AnalysisOddEvenRatio;
  bigSmallRatio: AnalysisBigSmallRatio;
  consecutiveAnalysis: AnalysisConsecutiveAnalysis;
  zoneDistribution: ZoneDistributionItem[];
  insight: string;
  disclaimer: string;
}

export interface ClaimGuide {
  location: string;
  deadline: string;
  documents: string[];
}

export interface LotteryRules {
  type: string;
  name: string;
  description: string;
  drawSchedule: string;
  bettingRules: string[];
  drawRules: string[];
  prizeRules: string[];
  claimGuide: ClaimGuide;
  disclaimer: string;
}

export interface PrizeTableItem {
  level: string;
  condition: string;
  prize: string;
  note?: string;
}

export interface LotteryRule {
  id: number;
  type: string;
  title: string;
  content: string;
  section?: string;
  sort_order: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}