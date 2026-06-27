import { get, post } from './request';

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
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function getLatest(type: string) {
  return get<ApiResponse<LotteryResult>>(`/lottery/latest/${type}`);
}

export function getHistory(type: string, limit = 20, offset = 0) {
  return get<ApiResponse<LotteryResult[]>>(`/lottery/history/${type}?limit=${limit}&offset=${offset}`);
}

export function getDetail(type: string, issue: string) {
  return get<ApiResponse<LotteryResult>>(`/lottery/detail/${type}/${issue}`);
}
