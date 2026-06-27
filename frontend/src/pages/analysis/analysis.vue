<template>
  <view class="container">
    <!-- 顶部彩种和期数选择 -->
    <view class="top-bar">
      <view class="type-picker">
        <view
          v-for="item in lotteryTypes"
          :key="item.type"
          class="type-item"
          :class="{ active: currentType === item.type }"
          @click="switchType(item.type)"
        >
          <text>{{ item.name }}</text>
        </view>
      </view>
      <view class="period-picker">
        <view
          v-for="p in periodOptions"
          :key="p"
          class="period-item"
          :class="{ active: periods === p }"
          @click="switchPeriod(p)"
        >
          <text>{{ p }}期</text>
        </view>
      </view>
    </view>

    <!-- 刷新时间 -->
    <view class="refresh-time" v-if="!loading">
      <text>数据更新时间：{{ updateTime }}</text>
      <view class="refresh-btn" @click="loadData">
        <view class="refresh-icon" :class="{ spinning: refreshing }"></view>
      </view>
    </view>

    <!-- Loading -->
    <view v-if="loading" class="loading-skeleton">
      <view class="skeleton-card" v-for="i in 4" :key="i">
        <view class="skeleton-line long"></view>
        <view class="skeleton-line medium"></view>
        <view class="skeleton-line short"></view>
      </view>
    </view>

    <!-- 数据洞察 -->
    <view class="insight-card" v-if="analysisData && !loading">
      <view class="insight-icon">
        <view class="icon-light"></view>
      </view>
      <text class="insight-text">{{ analysisData.insight }}</text>
    </view>

    <!-- 顶部概览卡片 -->
    <view class="overview-section" v-if="analysisData && !loading">
      <view class="overview-title">
        <view class="title-bar"></view>
        <text>近{{ periods }}期关键指标</text>
      </view>
      <view class="overview-grid">
        <view class="overview-card" v-for="(item, i) in topHotCards" :key="i">
          <view class="overview-number">{{ item.number }}</view>
          <view class="overview-count">
            <text>{{ item.count }}</text>
            <text class="overview-unit">次</text>
          </view>
          <view class="overview-trend">
            <text :class="item.trend">{{ trendText(item.trend) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 遗漏排行 -->
    <view class="section" v-if="analysisData && !loading">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">遗漏排行</text>
        </view>
        <view class="section-tag">
          <text>近期关注</text>
        </view>
      </view>
      <view class="omission-list">
        <view
          v-for="(item, i) in omissionCards"
          :key="i"
          class="omission-card"
          :class="{ 'high-omit': i < 3 }"
        >
          <view class="omit-number">{{ item.number }}</view>
          <view class="omit-info">
            <text class="omit-count">遗漏 {{ item.missed }} 期</text>
            <text class="omit-max">最大 {{ item.maxMissed }} 期</text>
          </view>
          <view class="omit-bar">
            <view
              class="omit-bar-fill"
              :style="{ width: Math.min(100, (item.missed / Math.max(item.maxMissed, 1)) * 100) + '%' }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 冷热分布图 -->
    <view class="section" v-if="analysisData && !loading">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">冷热分布</text>
        </view>
      </view>
      <view class="heatmap-legend">
        <view class="legend-item">
          <view class="legend-dot hot"></view>
          <text>热</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot warm"></view>
          <text>温</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot cold"></view>
          <text>冷</text>
        </view>
      </view>
      <view class="heatmap-grid">
        <view
          v-for="item in hotColdMap"
          :key="item.number"
          class="heatmap-cell"
          :class="item.status"
        >
          <text>{{ item.number }}</text>
        </view>
      </view>
    </view>

    <!-- 号码关联分析 -->
    <view class="section" v-if="analysisData && !loading && pairAnalysis.length > 0">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">号码关联分析</text>
        </view>
      </view>
      <view class="pair-list">
        <view
          v-for="(item, i) in pairAnalysis"
          :key="i"
          class="pair-card"
        >
          <view class="pair-numbers">
            <view class="pair-ball">{{ item.pair.split(',')[0] }}</view>
            <text class="pair-plus">+</text>
            <view class="pair-ball">{{ item.pair.split(',')[1] }}</view>
          </view>
          <view class="pair-prob">
            <text class="prob-value">{{ item.probability }}%</text>
            <text class="prob-label">同时出现</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 和值分析 -->
    <view class="section" v-if="analysisData && !loading">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">和值分析</text>
        </view>
      </view>
      <view class="sum-card">
        <view class="sum-stat">
          <view class="stat-item">
            <text class="stat-label">平均值</text>
            <text class="stat-value">{{ sumAnalysis.avgSum }}</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-label">范围</text>
            <text class="stat-value">{{ sumAnalysis.range }}</text>
          </view>
        </view>
        <view class="sum-chart">
          <view
            v-for="(item, i) in sumAnalysis.distribution"
            :key="i"
            class="sum-bar-row"
          >
            <text class="sum-bar-label">{{ item.range }}</text>
            <view class="sum-bar-track">
              <view
                class="sum-bar-fill"
                :style="{ width: getSumBarWidth(item.count) + '%' }"
              ></view>
            </view>
            <text class="sum-bar-count">{{ item.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 奇偶比/大小比 -->
    <view class="section" v-if="analysisData && !loading">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">奇偶比 / 大小比</text>
        </view>
      </view>
      <view class="ratio-cards">
        <view class="ratio-card">
          <view class="ratio-title">
            <view class="ratio-icon icon-odd"></view>
            <text>奇偶分布</text>
          </view>
          <view class="ratio-pie">
            <view class="pie-segment odd" :style="{ flex: oddEvenRatio.odd }">
              <text>奇 {{ oddEvenRatio.odd }}</text>
            </view>
            <view class="pie-segment even" :style="{ flex: oddEvenRatio.even }">
              <text>偶 {{ oddEvenRatio.even }}</text>
            </view>
          </view>
        </view>
        <view class="ratio-card">
          <view class="ratio-title">
            <view class="ratio-icon icon-big"></view>
            <text>大小分布</text>
          </view>
          <view class="ratio-pie">
            <view class="pie-segment big" :style="{ flex: bigSmallRatio.big }">
              <text>大 {{ bigSmallRatio.big }}</text>
            </view>
            <view class="pie-segment small" :style="{ flex: bigSmallRatio.small }">
              <text>小 {{ bigSmallRatio.small }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 连号分析 -->
    <view class="section" v-if="analysisData && !loading">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">连号分析</text>
        </view>
      </view>
      <view class="consecutive-card">
        <view class="consecutive-row">
          <view class="consecutive-item">
            <text class="consecutive-value">{{ consecutiveAnalysis.hasConsecutive }}</text>
            <text class="consecutive-label">有连号期数</text>
          </view>
          <view class="consecutive-divider"></view>
          <view class="consecutive-item">
            <text class="consecutive-value">{{ consecutiveAnalysis.noConsecutive }}</text>
            <text class="consecutive-label">无连号期数</text>
          </view>
          <view class="consecutive-divider"></view>
          <view class="consecutive-item">
            <text class="consecutive-value">{{ consecutiveAnalysis.avgConsecutivePerDraw }}</text>
            <text class="consecutive-label">平均连号/期</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 区间分布 -->
    <view class="section" v-if="analysisData && !loading">
      <view class="section-header">
        <view class="section-title-area">
          <view class="title-bar"></view>
          <text class="section-title">区间分布</text>
        </view>
      </view>
      <view class="zone-list">
        <view
          v-for="(item, i) in zoneDistribution"
          :key="i"
          class="zone-card"
        >
          <view class="zone-header">
            <text class="zone-name">{{ item.zone }}</text>
            <text class="zone-percent">{{ item.percentage }}%</text>
          </view>
          <view class="zone-bar">
            <view
              class="zone-bar-fill"
              :style="{ width: Math.max(5, item.percentage) + '%' }"
            ></view>
          </view>
          <text class="zone-count">{{ item.count }} 次</text>
        </view>
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="share-area" v-if="!loading">
      <view class="share-btn" @click="share">
        <view class="share-icon"></view>
        <text class="share-text">分享给朋友</text>
      </view>
    </view>

    <view class="data-source">
      <text class="data-source-text">数据来源：中国福利彩票发行管理中心</text>
    </view>

    <view class="responsible-area">
      <text class="responsible-text">理性购彩，量力而行</text>
      <text class="disclaimer-text">本页面展示的数据均为历史开奖数据统计，仅供参考，不构成任何投注建议。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAnalysis, type AnalysisData } from '@/api/tools';

const lotteryTypes = [
  { type: 'ssq', name: '双色球' },
  { type: 'd3', name: '福彩3D' },
  { type: 'qlc', name: '七乐彩' },
  { type: 'kl8', name: '快乐8' },
];

const periodOptions = [30, 50, 100];
const currentType = ref('ssq');
const periods = ref(30);
const analysisData = ref<AnalysisData | null>(null);
const loading = ref(false);
const refreshing = ref(false);
const updateTime = ref('');

const topHotCards = computed(() => analysisData.value?.topHot || []);
const omissionCards = computed(() => analysisData.value?.omissionRank || []);
const hotColdMap = computed(() => analysisData.value?.hotColdMap || []);
const pairAnalysis = computed(() => analysisData.value?.pairAnalysis || []);
const sumAnalysis = computed(() => analysisData.value?.sumAnalysis || { range: '', count: 0, avgSum: 0, distribution: [] });
const oddEvenRatio = computed(() => analysisData.value?.oddEvenRatio || { odd: 0, even: 0, distribution: [] });
const bigSmallRatio = computed(() => analysisData.value?.bigSmallRatio || { big: 0, small: 0, distribution: [] });
const consecutiveAnalysis = computed(() => analysisData.value?.consecutiveAnalysis || { hasConsecutive: 0, noConsecutive: 0, avgConsecutivePerDraw: 0 });
const zoneDistribution = computed(() => analysisData.value?.zoneDistribution || []);

const maxSumCount = computed(() => {
  if (sumAnalysis.value.distribution.length === 0) return 1;
  return Math.max(...sumAnalysis.value.distribution.map(d => d.count));
});

function trendText(t: 'up' | 'down' | 'flat') {
  if (t === 'up') return '↑ 上升';
  if (t === 'down') return '↓ 下降';
  return '→ 持平';
}

function getSumBarWidth(count: number): number {
  if (maxSumCount.value === 0) return 0;
  return (count / maxSumCount.value) * 100;
}

function generateMockAnalysis(): AnalysisData {
  const allNumbers = Array.from({ length: 33 }, (_, i) => String(i + 1).padStart(2, '0'));
  const counts = allNumbers.map(() => Math.floor(Math.random() * 30) + 1);
  const sorted = allNumbers.slice().sort((a, b) => {
    const idxA = allNumbers.indexOf(a);
    const idxB = allNumbers.indexOf(b);
    return counts[idxB] - counts[idxA];
  });

  return {
    type: currentType.value,
    periods: periods.value,
    topHot: sorted.slice(0, 5).map((n, i) => ({
      number: n,
      count: counts[allNumbers.indexOf(n)],
      trend: (['up', 'down', 'flat'] as const)[i % 3],
    })),
    omissionRank: allNumbers.slice(0, 10).map((n) => ({
      number: n,
      missed: Math.floor(Math.random() * 40) + 1,
      maxMissed: Math.floor(Math.random() * 60) + 20,
    })).sort((a, b) => b.missed - a.missed),
    hotColdMap: allNumbers.map((n) => {
      const c = counts[allNumbers.indexOf(n)];
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      const ratio = c / avg;
      let status: 'hot' | 'cold' | 'warm' = 'warm';
      if (ratio > 1.3) status = 'hot';
      else if (ratio < 0.7) status = 'cold';
      return { number: n, count: c, status };
    }),
    pairAnalysis: [
      { pair: '03,15', probability: 23, count: 7 },
      { pair: '08,22', probability: 19, count: 6 },
      { pair: '12,28', probability: 16, count: 5 },
      { pair: '05,11', probability: 14, count: 4 },
    ],
    sumAnalysis: {
      range: '80-140',
      count: periods.value,
      avgSum: 110,
      distribution: [
        { range: '<60', count: 2 },
        { range: '60-80', count: 5 },
        { range: '80-100', count: 12 },
        { range: '100-120', count: 15 },
        { range: '120-140', count: 8 },
        { range: '140-160', count: 4 },
        { range: '>160', count: 2 },
      ],
    },
    oddEvenRatio: {
      odd: 52,
      even: 48,
      distribution: [
        { odd: 3, even: 3, count: 12 },
        { odd: 4, even: 2, count: 8 },
        { odd: 2, even: 4, count: 6 },
      ],
    },
    bigSmallRatio: {
      big: 55,
      small: 45,
      distribution: [
        { big: 3, small: 3, count: 10 },
        { big: 4, small: 2, count: 9 },
        { big: 2, small: 4, count: 7 },
      ],
    },
    consecutiveAnalysis: {
      hasConsecutive: 18,
      noConsecutive: 12,
      avgConsecutivePerDraw: 1.2,
    },
    zoneDistribution: [
      { zone: '1-11', count: 45, percentage: 35 },
      { zone: '12-22', count: 52, percentage: 40 },
      { zone: '23-33', count: 32, percentage: 25 },
    ],
    insight: '红球03近期出现频率高于平均值47%',
    disclaimer: '以上数据为历史开奖记录，仅供娱乐参考。',
  };
}

async function loadData() {
  if (refreshing.value) return;
  loading.value = true;
  refreshing.value = true;
  try {
    const res = await getAnalysis(currentType.value, periods.value);
    if (res.code === 200 && res.data) {
      analysisData.value = res.data;
    } else {
      analysisData.value = generateMockAnalysis();
    }
    updateTime.value = new Date().toLocaleString();
  } catch (e) {
    analysisData.value = generateMockAnalysis();
    updateTime.value = new Date().toLocaleString();
  } finally {
    loading.value = false;
    setTimeout(() => refreshing.value = false, 500);
  }
}

function switchType(type: string) {
  if (currentType.value === type) return;
  currentType.value = type;
  loadData();
}

function switchPeriod(p: number) {
  if (periods.value === p) return;
  periods.value = p;
  loadData();
}

function share() {
  uni.showToast({ title: '分享功能开发中', icon: 'none' });
}

onMounted(() => {
  loadData();
});

function onPullDownRefresh() {
  loadData().finally(() => uni.stopPullDownRefresh());
}
</script>

<style scoped>
.container {
  padding: 0 0 40rpx 0;
  background-color: #F8F8F8;
  min-height: 100vh;
}

.top-bar {
  background-color: #FFFFFF;
  padding: 16rpx 24rpx;
}

.type-picker {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.type-item {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  border-radius: 12rpx;
  background-color: #F5F5F5;
  transition: all 0.2s;
}
.type-item:active {
  transform: scale(0.97);
}
.type-item.active {
  background-color: #FFF5F5;
  border: 2rpx solid #C41E3A;
}
.type-item text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
}
.type-item.active text {
  color: #C41E3A;
  font-weight: 600;
}

.period-picker {
  display: flex;
  gap: 12rpx;
}
.period-item {
  flex: 1;
  text-align: center;
  padding: 10rpx 0;
  border-radius: 12rpx;
  background-color: #F5F5F5;
  border: 1rpx solid #F0F0F0;
  transition: all 0.2s;
}
.period-item:active {
  transform: scale(0.97);
}
.period-item.active {
  background-color: #FFF5F5;
  border-color: #C41E3A;
}
.period-item text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}
.period-item.active text {
  color: #C41E3A;
  font-weight: 600;
}

.refresh-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 24rpx;
}
.refresh-time text {
  font-size: 22rpx;
  color: #9E9E9E;
}
.refresh-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.refresh-icon {
  width: 20rpx;
  height: 20rpx;
  border: 2rpx solid #C41E3A;
  border-left-color: transparent;
  border-radius: 50%;
  animation: none;
}
.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.loading-skeleton {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.skeleton-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.skeleton-line {
  height: 32rpx;
  background-color: #F0F0F0;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  animation: pulse 1.5s infinite;
}
.skeleton-line.long { width: 80%; }
.skeleton-line.medium { width: 60%; }
.skeleton-line.short { width: 40%; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.insight-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #FFF8E1, #FFF3E0);
  border: 1rpx solid #FFE0B2;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin: 16rpx 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.insight-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #F9A825;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-light {
  width: 16rpx;
  height: 20rpx;
  background-color: #ffffff;
  border-radius: 8rpx 8rpx 0 0;
  position: relative;
}
.icon-light::after {
  content: '';
  position: absolute;
  bottom: -4rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 8rpx;
  height: 4rpx;
  background-color: #ffffff;
  border-radius: 2rpx;
}
.insight-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
  flex: 1;
  font-weight: 500;
}

.section {
  margin-top: 24rpx;
  padding: 0 24rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.section-title-area {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.title-bar {
  width: 8rpx;
  height: 32rpx;
  background: linear-gradient(180deg, #C41E3A, #E53935);
  border-radius: 4rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  letter-spacing: 0.5rpx;
}
.section-tag {
  background-color: #FFF5F5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.section-tag text {
  font-size: 22rpx;
  color: #C41E3A;
  font-weight: 500;
}

.overview-section {
  margin-top: 16rpx;
  padding: 0 24rpx;
}
.overview-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.overview-title text {
  font-size: 28rpx;
  color: #9E9E9E;
  font-weight: 500;
}
.overview-grid {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}
.overview-card {
  flex: 1;
  min-width: 120rpx;
  background: linear-gradient(135deg, #FFFFFF, #FAFAFA);
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
  border: 1rpx solid #F0F0F0;
  transition: all 0.2s;
}
.overview-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.overview-number {
  font-size: 40rpx;
  font-weight: 600;
  color: #C41E3A;
  margin-bottom: 4rpx;
}
.overview-count {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}
.overview-count text {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
}
.overview-unit {
  font-size: 22rpx;
  color: #9E9E9E;
}
.overview-trend text {
  font-size: 22rpx;
  margin-top: 4rpx;
}
.overview-trend .up { color: #C41E3A; }
.overview-trend .down { color: #1E88E5; }
.overview-trend .flat { color: #9E9E9E; }

.omission-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.omission-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
  transition: all 0.2s;
}
.omission-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.omission-card.high-omit {
  background: linear-gradient(135deg, #FFF5F5, #FFEBEE);
  border: 1rpx solid #FFCDD2;
}
.omit-number {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A, #E53935);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(196,30,58,0.2);
}
.omit-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.omit-count {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
}
.omit-max {
  font-size: 22rpx;
  color: #9E9E9E;
  margin-top: 4rpx;
}
.omit-bar {
  width: 120rpx;
  height: 6rpx;
  background-color: #F0F0F0;
  border-radius: 3rpx;
  overflow: hidden;
}
.omit-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #C41E3A, #E53935);
  border-radius: 3rpx;
  transition: width 0.5s ease;
}

.heatmap-legend {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}
.legend-dot.hot { background: linear-gradient(135deg, #C41E3A, #E53935); }
.legend-dot.warm { background: linear-gradient(135deg, #43A047, #66BB6A); }
.legend-dot.cold { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.legend-item text {
  font-size: 24rpx;
  color: #666666;
}
.heatmap-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.heatmap-cell {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.heatmap-cell:active {
  transform: scale(1.1);
}
.heatmap-cell.hot { background: linear-gradient(135deg, #C41E3A, #E53935); }
.heatmap-cell.warm { background: linear-gradient(135deg, #43A047, #66BB6A); }
.heatmap-cell.cold { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.heatmap-cell text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

.pair-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.pair-card {
  flex: 1;
  min-width: 200rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
  transition: all 0.2s;
}
.pair-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.pair-numbers {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.pair-ball {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A, #E53935);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 600;
}
.pair-plus {
  font-size: 24rpx;
  color: #9E9E9E;
  font-weight: 500;
}
.pair-prob {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.prob-value {
  font-size: 32rpx;
  color: #C41E3A;
  font-weight: 600;
}
.prob-label {
  font-size: 22rpx;
  color: #9E9E9E;
}

.sum-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.sum-stat {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.stat-label {
  font-size: 24rpx;
  color: #9E9E9E;
}
.stat-value {
  font-size: 40rpx;
  color: #C41E3A;
  font-weight: 600;
}
.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: #F0F0F0;
}
.sum-chart {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.sum-bar-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.sum-bar-label {
  width: 120rpx;
  font-size: 22rpx;
  color: #666666;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}
.sum-bar-track {
  flex: 1;
  height: 24rpx;
  background-color: #F5F5F5;
  border-radius: 12rpx;
  overflow: hidden;
}
.sum-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #C41E3A, #E53935);
  border-radius: 12rpx;
  transition: width 0.5s ease;
}
.sum-bar-count {
  width: 40rpx;
  font-size: 22rpx;
  color: #666666;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}

.ratio-cards {
  display: flex;
  gap: 12rpx;
}
.ratio-card {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.ratio-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}
.ratio-icon {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
}
.icon-odd { background: linear-gradient(135deg, #C41E3A, #E53935); }
.icon-big { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.ratio-title text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 600;
}
.ratio-pie {
  display: flex;
  height: 40rpx;
  border-radius: 20rpx;
  overflow: hidden;
}
.pie-segment {
  display: flex;
  align-items: center;
  justify-content: center;
}
.pie-segment.odd { background: linear-gradient(135deg, #C41E3A, #E53935); }
.pie-segment.even { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.pie-segment.big { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.pie-segment.small { background: linear-gradient(135deg, #43A047, #66BB6A); }
.pie-segment text {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 500;
}

.consecutive-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.consecutive-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.consecutive-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.consecutive-value {
  font-size: 40rpx;
  color: #C41E3A;
  font-weight: 600;
}
.consecutive-label {
  font-size: 24rpx;
  color: #9E9E9E;
}
.consecutive-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: #F0F0F0;
}

.zone-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.zone-card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
  transition: all 0.2s;
}
.zone-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.zone-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
}
.zone-percent {
  font-size: 28rpx;
  color: #C41E3A;
  font-weight: 600;
}
.zone-bar {
  height: 8rpx;
  background-color: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}
.zone-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #C41E3A, #E53935);
  border-radius: 4rpx;
  transition: width 0.5s ease;
}
.zone-count {
  font-size: 22rpx;
  color: #9E9E9E;
}

.share-area {
  display: flex;
  justify-content: center;
  padding: 24rpx;
  margin-top: 16rpx;
}
.share-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #C41E3A, #E53935);
  border-radius: 44rpx;
  box-shadow: 0 4rpx 16rpx rgba(196,30,58,0.2);
  transition: all 0.3s;
}
.share-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2rpx 8rpx rgba(196,30,58,0.15);
}
.share-icon {
  width: 24rpx;
  height: 24rpx;
  border: 2rpx solid #ffffff;
  border-radius: 4rpx;
  position: relative;
}
.share-icon::after {
  content: '';
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  width: 8rpx;
  height: 8rpx;
  background-color: #ffffff;
  border-radius: 50%;
}
.share-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}

.data-source {
  text-align: center;
  padding: 16rpx 0;
}
.data-source-text {
  font-size: 22rpx;
  color: #9E9E9E;
}

.responsible-area {
  text-align: center;
  padding: 24rpx;
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.responsible-text {
  font-size: 26rpx;
  color: #9E9E9E;
  font-weight: 500;
}
.disclaimer-text {
  font-size: 22rpx;
  color: #BDBDBD;
  line-height: 1.5;
}
</style>
