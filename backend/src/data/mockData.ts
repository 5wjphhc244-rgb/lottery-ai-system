import { getRealDataFromSearch } from './lotteryScraper';

export const mockData: Record<string, any[]> = {
  ssq: getRealDataFromSearch('ssq'),
  d3: getRealDataFromSearch('d3'),
  qlc: getRealDataFromSearch('qlc'),
  kl8: getRealDataFromSearch('kl8'),
};

export default mockData;
