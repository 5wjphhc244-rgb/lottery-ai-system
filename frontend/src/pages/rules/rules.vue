<template>
  <view class="container">
    <!-- 类型标签 -->
    <view class="tab-bar">
      <view
        v-for="item in lotteryTypes"
        :key="item.type"
        class="tab-item"
        :class="{ active: currentType === item.type }"
        @click="switchType(item.type)"
      >
        <text class="tab-text">{{ item.name }}</text>
      </view>
    </view>

    <!-- 警告横幅 -->
    <view class="warning-banner">
      <view class="warning-icon">
        <view class="icon-warn"></view>
      </view>
      <text class="warning-text">未成年人禁止购彩</text>
    </view>

    <view class="prominent-text">
      <text>理性购彩，量力而行</text>
    </view>

    <!-- 手风琴内容 -->
    <view class="accordion">
      <view
        v-for="(section, index) in currentRules"
        :key="index"
        class="accordion-item"
        :class="{ expanded: expandedIndex === index }"
      >
        <view class="accordion-header" @click="toggleSection(index)">
          <view class="accordion-header-left">
            <view class="accordion-num">{{ index + 1 }}</view>
            <text class="accordion-title">{{ section.title }}</text>
          </view>
          <view class="accordion-icon" :class="{ rotated: expandedIndex === index }">
            <view class="icon-chevron"></view>
          </view>
        </view>
        <view v-if="expandedIndex === index" class="accordion-body">
          <!-- 纯文本内容 -->
          <template v-if="section.type === 'text'">
            <text class="body-text">{{ section.content }}</text>
          </template>
          <!-- 列表内容 -->
          <template v-if="section.type === 'list'">
            <view
              v-for="(item, i) in section.items"
              :key="i"
              class="list-item"
            >
              <view class="list-bullet"></view>
              <text class="list-text">{{ item }}</text>
            </view>
          </template>
          <!-- 表格内容 -->
          <template v-if="section.type === 'table'">
            <view class="prize-table">
              <view class="table-row header-row">
                <view
                  v-for="(header, h) in section.headers"
                  :key="h"
                  class="table-cell header-cell"
                >
                  <text>{{ header }}</text>
                </view>
              </view>
              <view
                v-for="(row, r) in section.rows"
                :key="r"
                class="table-row"
                :class="{ 'row-alt': r % 2 === 1 }"
              >
                <view
                  v-for="(cell, c) in row"
                  :key="c"
                  class="table-cell"
                >
                  <text>{{ cell }}</text>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view>

    <!-- 快捷导航 -->
    <view class="nav-links">
      <view class="nav-item" @click="goToPage('/pages/analysis/analysis')">
        <view class="nav-icon icon-analysis"></view>
        <text class="nav-text">综合分析</text>
      </view>
      <view class="nav-item" @click="goToPage('/pages/tools/trend')">
        <view class="nav-icon icon-chart"></view>
        <text class="nav-text">走势图</text>
      </view>
      <view class="nav-item" @click="goToPage('/pages/tools/hotcold')">
        <view class="nav-icon icon-hot"></view>
        <text class="nav-text">冷热分析</text>
      </view>
    </view>

    <Disclaimer />
    <AdBanner />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Disclaimer from '@/components/Disclaimer.vue';
import AdBanner from '@/components/AdBanner.vue';

interface RuleSection {
  title: string;
  type: 'text' | 'list' | 'table';
  content?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
}

const lotteryTypes = [
  { type: 'ssq', name: '双色球' },
  { type: 'd3', name: '福彩3D' },
  { type: 'qlc', name: '七乐彩' },
  { type: 'kl8', name: '快乐8' },
];

const currentType = ref('ssq');
const expandedIndex = ref(0);

const rulesData: Record<string, RuleSection[]> = {
  ssq: [
    {
      title: '玩法介绍',
      type: 'text',
      content: '双色球是中国福利彩票的一种大盘玩法。投注区分为红色球号码区和蓝色球号码区，每注投注号码由6个红色球号码和1个蓝色球号码组成。红色球号码从1-33中选择，蓝色球号码从1-16中选择。'
    },
    {
      title: '投注规则',
      type: 'list',
      items: [
        '单式投注：从红色球号码中选择6个号码，从蓝色球号码中选择1个号码，组合为一注投注号码。',
        '复式投注：从红色球号码中选择7-20个号码，或从蓝色球号码中选择2-16个号码，组合成多注投注号码。',
        '胆拖投注：在红色球号码中选择1-5个号码作为胆码，再选取若干个号码作为拖码，胆码与拖码之和不少于7个。',
        '每注2元人民币，多倍投注最高99倍。'
      ]
    },
    {
      title: '开奖规则',
      type: 'text',
      content: '每周二、四、日开奖。开奖时从33个红色球号码中随机摇出6个，从16个蓝色球号码中随机摇出1个。开奖过程通过电视直播。'
    },
    {
      title: '奖金设置',
      type: 'table',
      headers: ['奖级', '中奖条件', '奖金'],
      rows: [
        ['一等奖', '6红 + 1蓝', '浮动，最高1000万'],
        ['二等奖', '6红 + 0蓝', '浮动'],
        ['三等奖', '5红 + 1蓝', '3000元'],
        ['四等奖', '5红 + 0蓝 / 4红 + 1蓝', '200元'],
        ['五等奖', '4红 + 0蓝 / 3红 + 1蓝', '10元'],
        ['六等奖', '2红 + 1蓝 / 1红 + 1蓝 / 0红 + 1蓝', '5元']
      ]
    },
    {
      title: '中奖条件',
      type: 'text',
      content: '根据投注号码与当期开奖号码的相符情况确定中奖资格。红色球号码顺序不限，蓝色球号码必须正确。一等奖、二等奖奖金按注均分，单注封顶500万元（追加可达1000万元）。'
    },
    {
      title: '兑奖指南',
      type: 'list',
      items: [
        '兑奖有效期为自开奖之日起60个自然日。',
        '单注中奖金额1万元以下，可在省内任意福彩销售网点兑奖。',
        '单注中奖金额1万元以上，须到市中心或省中心兑奖。',
        '兑奖时须携带中奖彩票及本人有效身份证件。',
        '超过兑奖期限视为弃奖，奖金纳入彩票公益金。'
      ]
    }
  ],
  d3: [
    {
      title: '玩法介绍',
      type: 'text',
      content: '福彩3D是中国福利彩票的一种小盘数字玩法。投注号码由000-999之间任意一个三位数组成，分为单选、组选三、组选六等多种投注方式。'
    },
    {
      title: '投注规则',
      type: 'list',
      items: [
        '单选投注：投注号码与开奖号码按位全部相同即中奖。',
        '组选三投注：开奖号码中有任意两位数字相同，投注号码与开奖号码相同（顺序不限）即中奖。',
        '组选六投注：开奖号码中三位数字各不相同，投注号码与开奖号码相同（顺序不限）即中奖。',
        '每注2元，可选择多倍投注。'
      ]
    },
    {
      title: '开奖规则',
      type: 'text',
      content: '每天开奖一次（除春节等特殊情况），开奖时间约为每日21:15。开奖号码为三个数字，从0-9中各摇出一个。'
    },
    {
      title: '奖金设置',
      type: 'table',
      headers: ['投注方式', '中奖条件', '奖金'],
      rows: [
        ['单选', '三位数字及位置完全相同', '1040元'],
        ['组选三', '两位相同数字，顺序不限', '346元'],
        ['组选六', '三位不同数字，顺序不限', '173元'],
        ['1D', '猜中一位数字', '10元'],
        ['猜1D', '猜中一个指定位置数字', '2元']
      ]
    },
    {
      title: '中奖条件',
      type: 'text',
      content: '单选投注号码与开奖号码的排列完全一致。组选投注号码与开奖号码的数字相同（顺序不限），组选三要求开奖号码有重复数字，组选六要求开奖号码无重复数字。'
    },
    {
      title: '兑奖指南',
      type: 'list',
      items: [
        '兑奖有效期为自开奖之日起60个自然日。',
        '可在省内任意福彩销售网点兑奖。',
        '兑奖时须携带中奖彩票。',
        '逾期未兑视为弃奖。'
      ]
    }
  ],
  qlc: [
    {
      title: '玩法介绍',
      type: 'text',
      content: '七乐彩是中国福利彩票的一种中盘玩法。投注号码从1-30中选择7个号码，组合为一注投注号码。每注2元。'
    },
    {
      title: '投注规则',
      type: 'list',
      items: [
        '单式投注：从30个号码中选择7个号码。',
        '复式投注：从30个号码中选择8-16个号码，组合成多注。',
        '胆拖投注：选择1-6个胆码，再选择若干拖码，胆拖总数不少于8个。',
        '每注2元，可多倍投注。'
      ]
    },
    {
      title: '开奖规则',
      type: 'text',
      content: '每周一、三、五开奖。开奖时从30个号码中随机摇出8个号码（7个正选号码+1个特别号码）。特别号码用于确定二等奖。'
    },
    {
      title: '奖金设置',
      type: 'table',
      headers: ['奖级', '中奖条件', '奖金'],
      rows: [
        ['一等奖', '7个正选号码', '浮动'],
        ['二等奖', '6个正选 + 特别号码', '浮动'],
        ['三等奖', '6个正选号码', '浮动'],
        ['四等奖', '5个正选 + 特别号码', '200元'],
        ['五等奖', '5个正选号码', '50元'],
        ['六等奖', '4个正选 + 特别号码', '10元'],
        ['七等奖', '4个正选号码', '5元']
      ]
    },
    {
      title: '中奖条件',
      type: 'text',
      content: '投注号码与开奖号码的正选号码相符个数确定中奖等级。特别号码仅用于二等奖和六等奖的确定。各奖级奖金均按注均分。'
    },
    {
      title: '兑奖指南',
      type: 'list',
      items: [
        '兑奖有效期为自开奖之日起60个自然日。',
        '单注中奖金额1万元以下，可在省内任意销售网点兑奖。',
        '单注中奖金额1万元以上，须到市中心或省中心兑奖。',
        '兑奖时须携带中奖彩票及本人有效身份证件。'
      ]
    }
  ],
  kl8: [
    {
      title: '玩法介绍',
      type: 'text',
      content: '快乐8是中国福利彩票的一种基诺型玩法。开奖号码从1-80中随机产生20个号码，投注者从1-80中选择1-10个号码进行投注，共有"选一"至"选十"十种玩法。'
    },
    {
      title: '投注规则',
      type: 'list',
      items: [
        '选一：选1个号码，与20个开奖号码中任意1个相同即中奖。',
        '选二：选2个号码，与开奖号码中任意2个相同即中奖。',
        '选三：选3个号码，与开奖号码中相同3个或2个即中奖。',
        '选四至选十：依此类推，匹配号码越多，奖金越高。',
        '每注2元，可多倍投注。'
      ]
    },
    {
      title: '开奖规则',
      type: 'text',
      content: '每天开奖一次，开奖时间约为每日21:30。从1-80共80个号码中随机摇出20个开奖号码。开奖过程通过电视直播。'
    },
    {
      title: '奖金设置',
      type: 'table',
      headers: ['玩法', '全中', '中N-1', '中N-2', '中N-3'],
      rows: [
        ['选十', '最高500万', '8000元', '800元', '80元'],
        ['选九', '300000元', '2000元', '200元', '20元'],
        ['选八', '50000元', '500元', '50元', '10元'],
        ['选七', '10000元', '100元', '10元', '2元'],
        ['选六', '3000元', '30元', '10元', '3元'],
        ['选五', '1000元', '30元', '3元', '-'],
        ['选四', '100元', '10元', '3元', '2元'],
        ['选三', '53元', '3元', '3元', '-'],
        ['选二', '19元', '2元', '-', '-'],
        ['选一', '4.6元', '-', '-', '-']
      ]
    },
    {
      title: '中奖条件',
      type: 'text',
      content: '投注号码与当期20个开奖号码中的相同号码个数决定中奖等级。选十玩法全中奖金最高可达500万元。'
    },
    {
      title: '兑奖指南',
      type: 'list',
      items: [
        '兑奖有效期为自开奖之日起60个自然日。',
        '可在省内任意福彩销售网点兑奖。',
        '兑奖时须携带中奖彩票。',
        '逾期未兑视为弃奖。'
      ]
    }
  ]
};

const currentRules = computed(() => {
  return rulesData[currentType.value] || [];
});

function switchType(type: string) {
  if (currentType.value === type) return;
  currentType.value = type;
  expandedIndex.value = 0;
}

function toggleSection(index: number) {
  if (expandedIndex.value === index) {
    expandedIndex.value = -1;
  } else {
    expandedIndex.value = index;
  }
}

function goToPage(url: string) {
  uni.navigateTo({ url });
}
</script>

<style scoped>
.container {
  padding: 0 0 40rpx 0;
  background-color: #F8F8F8;
  min-height: 100vh;
}

.tab-bar {
  display: flex;
  background-color: #FFFFFF;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  margin: 0 8rpx;
  border-radius: 12rpx;
  background-color: #F5F5F5;
  transition: all 0.2s;
}
.tab-item:active {
  transform: scale(0.97);
}
.tab-item.active {
  background-color: #FFF5F5;
  border: 2rpx solid #C41E3A;
}
.tab-text {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
}
.tab-item.active .tab-text {
  color: #C41E3A;
  font-weight: 600;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background-color: #FFF5F5;
  border-left: 8rpx solid #C41E3A;
  padding: 20rpx 24rpx;
  margin: 16rpx 24rpx 0;
  border-radius: 0 12rpx 12rpx 0;
}
.warning-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background-color: #C41E3A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-warn {
  width: 4rpx;
  height: 12rpx;
  background-color: #ffffff;
  border-radius: 2rpx;
  position: relative;
}
.icon-warn::after {
  content: '';
  position: absolute;
  bottom: -6rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 4rpx;
  height: 4rpx;
  background-color: #ffffff;
  border-radius: 50%;
}
.warning-text {
  font-size: 28rpx;
  color: #C41E3A;
  font-weight: 600;
}

.prominent-text {
  text-align: center;
  padding: 32rpx 24rpx;
  margin: 16rpx 24rpx 0;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
}
.prominent-text text {
  font-size: 36rpx;
  color: #C41E3A;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.accordion {
  margin: 24rpx;
}
.accordion-item {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  overflow: hidden;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
  transition: all 0.2s;
}
.accordion-item.expanded {
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06), 0 8rpx 24rpx rgba(0,0,0,0.04);
}
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 24rpx;
  background-color: #FFFFFF;
}
.accordion-header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.accordion-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #FFF5F5;
  color: #C41E3A;
  font-size: 24rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.accordion-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  letter-spacing: 0.5rpx;
}
.accordion-icon {
  width: 24rpx;
  height: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}
.accordion-icon.rotated {
  transform: rotate(180deg);
}
.icon-chevron {
  width: 0;
  height: 0;
  border-left: 8rpx solid transparent;
  border-right: 8rpx solid transparent;
  border-top: 8rpx solid #9E9E9E;
}
.accordion-body {
  padding: 0 24rpx 24rpx;
  border-top: 1rpx solid #F0F0F0;
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10rpx); }
  to { opacity: 1; transform: translateY(0); }
}
.body-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
  letter-spacing: 0.5rpx;
}

.list-item {
  display: flex;
  padding: 12rpx 0;
  align-items: flex-start;
  gap: 12rpx;
}
.list-bullet {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background-color: #C41E3A;
  margin-top: 12rpx;
  flex-shrink: 0;
}
.list-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
  flex: 1;
  letter-spacing: 0.5rpx;
}

.prize-table {
  border: 1rpx solid #F0F0F0;
  border-radius: 12rpx;
  overflow: hidden;
}
.table-row {
  display: flex;
  border-bottom: 1rpx solid #F0F0F0;
  transition: background-color 0.2s;
}
.table-row:active {
  background-color: #FAFAFA;
}
.table-row:last-child {
  border-bottom: none;
}
.header-row {
  background-color: #FAFAFA;
}
.row-alt {
  background-color: #FAFAFA;
}
.table-cell {
  flex: 1;
  padding: 20rpx 12rpx;
  text-align: center;
  font-size: 24rpx;
  color: #333333;
  border-right: 1rpx solid #F0F0F0;
  word-break: break-all;
}
.table-cell:last-child {
  border-right: none;
}
.header-cell {
  font-weight: 600;
  color: #666666;
}

.nav-links {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.nav-item {
  padding: 16rpx 20rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  gap: 12rpx;
  transition: all 0.2s;
}
.nav-item:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.nav-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.icon-analysis { background: linear-gradient(135deg, #C41E3A, #E53935); }
.icon-chart { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.icon-hot { background: linear-gradient(135deg, #F9A825, #FFB74D); }
.nav-text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}
</style>
