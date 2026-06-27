import type { LotteryRules, PrizeTableItem } from '../types';

const DISCLAIMER = '以上玩法规则仅供参考，具体以中国福利彩票发行管理中心公布的官方规则为准。彩票开奖号码为随机产生，历史数据不代表未来趋势。请理性购彩，量力而行。';

const ssqRules: LotteryRules = {
  type: 'ssq',
  name: '双色球',
  description:
    '双色球是中国福利彩票的一种玩法，投注者从红色球号码区（1-33）中选择6个号码，从蓝色球号码区（1-16）中选择1个号码，组成一注进行投注。',
  drawSchedule: '每周二、四、日 21:15 开奖',
  bettingRules: [
    '从红色球号码区（1-33）中选择6个号码，从蓝色球号码区（1-16）中选择1个号码，组成一注',
    '每注金额为人民币2元',
    '可进行单式投注、复式投注、胆拖投注',
    '复式投注：红球可选7-20个，蓝球可选2-16个',
    '胆拖投注：选择1-5个胆码，再选择若干拖码，胆码与拖码总数不少于7个',
    '可在投注站或官方授权渠道购买',
  ],
  drawRules: [
    '每周二、四、日开奖',
    '开奖时间为21:15',
    '开奖过程在公证人员监督下进行',
    '通过摇奖器随机产生6个红色球号码和1个蓝色球号码',
    '开奖结果通过电视、网络、投注站等渠道公布',
  ],
  prizeRules: [
    '一等奖：6个红球 + 1个蓝球，奖金为浮动奖金，最高1000万元',
    '二等奖：6个红球 + 0个蓝球，奖金为浮动奖金',
    '三等奖：5个红球 + 1个蓝球，固定奖金3000元',
    '四等奖：5个红球 + 0个蓝球 或 4个红球 + 1个蓝球，固定奖金200元',
    '五等奖：4个红球 + 0个蓝球 或 3个红球 + 1个蓝球，固定奖金10元',
    '六等奖：2个红球 + 1个蓝球 或 1个红球 + 1个蓝球 或 0个红球 + 1个蓝球，固定奖金5元',
    '当期奖金减去固定奖总奖金后，按一等奖70%、二等奖30%的比例分配',
    '单注奖金最高限额为1000万元（追加投注除外）',
  ],
  claimGuide: {
    location:
      '中奖金额1万元以下可在投注站兑奖；1万元以上需到当地福利彩票发行中心或指定兑奖地点兑奖；100万元以上需到省级福利彩票发行中心兑奖',
    deadline: '自开奖之日起60个自然日内',
    documents: ['中奖彩票原件', '本人有效身份证件', '银行卡（大额奖金）'],
  },
  disclaimer: DISCLAIMER,
};

const ssqPrizes: PrizeTableItem[] = [
  { level: '一等奖', condition: '6个红球 + 1个蓝球', prize: '浮动奖金', note: '最高1000万元' },
  { level: '二等奖', condition: '6个红球 + 0个蓝球', prize: '浮动奖金', note: '当期奖金的30%' },
  { level: '三等奖', condition: '5个红球 + 1个蓝球', prize: '3000元', note: '固定奖' },
  { level: '四等奖', condition: '5个红球 + 0个蓝球 或 4个红球 + 1个蓝球', prize: '200元', note: '固定奖' },
  { level: '五等奖', condition: '4个红球 + 0个蓝球 或 3个红球 + 1个蓝球', prize: '10元', note: '固定奖' },
  { level: '六等奖', condition: '2个红球 + 1个蓝球 或 1个红球 + 1个蓝球 或 0个红球 + 1个蓝球', prize: '5元', note: '固定奖' },
];

const d3Rules: LotteryRules = {
  type: 'd3',
  name: '福彩3D',
  description:
    '福彩3D是中国福利彩票的一种数字型玩法，投注者从000-999中选择一个3位数作为投注号码进行投注。',
  drawSchedule: '每日 21:15 开奖',
  bettingRules: [
    '从000-999中选择一个3位数作为投注号码',
    '每注金额为人民币2元',
    '投注方式分为单选、组选3、组选6',
    '单选：投注号码与开奖号码按位全部相同',
    '组选3：投注号码与开奖号码相同（允许有2个数字相同），不排序',
    '组选6：投注号码与开奖号码相同（3个数字均不同），不排序',
    '可进行直选、复式、胆拖等投注方式',
  ],
  drawRules: [
    '每日开奖',
    '开奖时间为21:15',
    '开奖过程在公证人员监督下进行',
    '通过摇奖器随机产生3个数字（0-9）',
    '开奖结果通过电视、网络、投注站等渠道公布',
  ],
  prizeRules: [
    '单选：投注号码与开奖号码按位全部相同，奖金1040元',
    '组选3：投注号码与开奖号码相同（含2个相同数字），奖金346元',
    '组选6：投注号码与开奖号码相同（3个数字均不同），奖金173元',
    '1D：猜中1个指定位置的数字，奖金10元',
    '2D：猜中2个指定位置的数字，奖金104元',
    '奖金固定，不浮动',
  ],
  claimGuide: {
    location:
      '中奖金额1万元以下可在投注站兑奖；1万元以上需到当地福利彩票发行中心兑奖',
    deadline: '自开奖之日起60个自然日内',
    documents: ['中奖彩票原件', '本人有效身份证件'],
  },
  disclaimer: DISCLAIMER,
};

const d3Prizes: PrizeTableItem[] = [
  { level: '单选', condition: '3位数字与开奖号码按位全部相同', prize: '1040元', note: '固定奖' },
  { level: '组选3', condition: '3位数字与开奖号码相同（含2个相同数字），不排序', prize: '346元', note: '固定奖' },
  { level: '组选6', condition: '3位数字与开奖号码相同（3个数字均不同），不排序', prize: '173元', note: '固定奖' },
  { level: '1D', condition: '猜中1个指定位置的数字', prize: '10元', note: '固定奖' },
  { level: '2D', condition: '猜中2个指定位置的数字', prize: '104元', note: '固定奖' },
];

const qlcRules: LotteryRules = {
  type: 'qlc',
  name: '七乐彩',
  description:
    '七乐彩是中国福利彩票的一种乐透型玩法，投注者从01-30中选择7个号码组成一注进行投注。',
  drawSchedule: '每周一、三、五 21:15 开奖',
  bettingRules: [
    '从01-30中选择7个号码组成一注',
    '每注金额为人民币2元',
    '可进行单式投注、复式投注（8-16个号码）',
    '胆拖投注：选择1-6个胆码，再选择若干拖码',
    '可在投注站或官方授权渠道购买',
  ],
  drawRules: [
    '每周一、三、五开奖',
    '开奖时间为21:15',
    '开奖过程在公证人员监督下进行',
    '通过摇奖器随机产生7个基本号码和1个特别号码',
    '特别号码从剩余23个号码中产生',
    '开奖结果通过电视、网络、投注站等渠道公布',
  ],
  prizeRules: [
    '一等奖：7个基本号码全中，奖金为浮动奖金',
    '二等奖：中6个基本号码 + 特别号码，奖金为浮动奖金',
    '三等奖：中6个基本号码，奖金为浮动奖金',
    '四等奖：中5个基本号码 + 特别号码，固定奖金200元',
    '五等奖：中5个基本号码，固定奖金50元',
    '六等奖：中4个基本号码 + 特别号码，固定奖金10元',
    '七等奖：中4个基本号码，固定奖金5元',
    '单注奖金最高限额为500万元',
  ],
  claimGuide: {
    location:
      '中奖金额1万元以下可在投注站兑奖；1万元以上需到当地福利彩票发行中心兑奖；大额奖金需到省级中心兑奖',
    deadline: '自开奖之日起60个自然日内',
    documents: ['中奖彩票原件', '本人有效身份证件', '银行卡（大额奖金）'],
  },
  disclaimer: DISCLAIMER,
};

const qlcPrizes: PrizeTableItem[] = [
  { level: '一等奖', condition: '7个基本号码全中', prize: '浮动奖金', note: '最高500万元' },
  { level: '二等奖', condition: '6个基本号码 + 特别号码', prize: '浮动奖金', note: '当期奖金的20%' },
  { level: '三等奖', condition: '6个基本号码', prize: '浮动奖金', note: '当期奖金的10%' },
  { level: '四等奖', condition: '5个基本号码 + 特别号码', prize: '200元', note: '固定奖' },
  { level: '五等奖', condition: '5个基本号码', prize: '50元', note: '固定奖' },
  { level: '六等奖', condition: '4个基本号码 + 特别号码', prize: '10元', note: '固定奖' },
  { level: '七等奖', condition: '4个基本号码', prize: '5元', note: '固定奖' },
];

const kl8Rules: LotteryRules = {
  type: 'kl8',
  name: '快乐8',
  description:
    '快乐8是中国福利彩票的一种基诺型玩法，投注者从1-80中选择1-10个号码进行投注，开奖时从1-80中随机产生20个开奖号码。',
  drawSchedule: '每日 21:30 开奖',
  bettingRules: [
    '从1-80中选择1-10个号码进行投注',
    '玩法包括"选一"、"选二"、"选三"、"选四"、"选五"、"选六"、"选七"、"选八"、"选九"、"选十"',
    '每注金额为人民币2元',
    '可进行单式投注、复式投注、胆拖投注',
    '开奖时从1-80中随机产生20个开奖号码',
    '根据投注号码与开奖号码的匹配个数确定中奖等级',
  ],
  drawRules: [
    '每日开奖',
    '开奖时间为21:30',
    '开奖过程在公证人员监督下进行',
    '通过摇奖器随机产生20个开奖号码（1-80）',
    '开奖结果通过电视、网络、投注站等渠道公布',
  ],
  prizeRules: [
    '"选十"中10个：浮动奖金，最高500万元',
    '"选十"中9个：8000元',
    '"选十"中8个：800元',
    '"选十"中0个：2元（全不中返本）',
    '"选九"中9个：30万元',
    '"选九"中0个：2元（全不中返本）',
    '其他玩法按匹配个数对应固定奖金',
    '单注奖金最高限额为500万元',
  ],
  claimGuide: {
    location:
      '中奖金额1万元以下可在投注站兑奖；1万元以上需到当地福利彩票发行中心兑奖；大额奖金需到省级中心兑奖',
    deadline: '自开奖之日起60个自然日内',
    documents: ['中奖彩票原件', '本人有效身份证件', '银行卡（大额奖金）'],
  },
  disclaimer: DISCLAIMER,
};

const kl8Prizes: PrizeTableItem[] = [
  { level: '选十中10', condition: '投注10个号码，中10个开奖号码', prize: '浮动奖金', note: '最高500万元' },
  { level: '选十中9', condition: '投注10个号码，中9个开奖号码', prize: '8000元', note: '固定奖' },
  { level: '选十中8', condition: '投注10个号码，中8个开奖号码', prize: '800元', note: '固定奖' },
  { level: '选十中0', condition: '投注10个号码，中0个开奖号码', prize: '2元', note: '全不中返本' },
  { level: '选九中9', condition: '投注9个号码，中9个开奖号码', prize: '30万元', note: '固定奖' },
  { level: '选九中8', condition: '投注9个号码，中8个开奖号码', prize: '2000元', note: '固定奖' },
  { level: '选九中0', condition: '投注9个号码，中0个开奖号码', prize: '2元', note: '全不中返本' },
  { level: '选一中1', condition: '投注1个号码，中1个开奖号码', prize: '4.6元', note: '固定奖' },
];

const rulesMap: Record<string, LotteryRules> = {
  ssq: ssqRules,
  d3: d3Rules,
  qlc: qlcRules,
  kl8: kl8Rules,
};

const prizesMap: Record<string, PrizeTableItem[]> = {
  ssq: ssqPrizes,
  d3: d3Prizes,
  qlc: qlcPrizes,
  kl8: kl8Prizes,
};

export function getRules(type: string): LotteryRules {
  const rules = rulesMap[type];
  if (!rules) {
    throw new Error(`Unsupported lottery type: ${type}`);
  }
  return rules;
}

export function getPrizeTable(type: string): PrizeTableItem[] {
  const prizes = prizesMap[type];
  if (!prizes) {
    throw new Error(`Unsupported lottery type: ${type}`);
  }
  return prizes;
}
