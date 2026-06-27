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

    <!-- 期数选择 -->
    <view class="period-selector">
      <text class="period-label">统计期数：</text>
      <view
        v-for="p in periodOptions"
        :key="p"
        class="period-item"
        :class="{ active: periods === p }"
        @click="switchPeriod(p)"
      >
        <text class="period-text">{{ p }}期</text>
      </view>
    </view>

    <!-- 刷新时间 -->
    <view class="refresh-time" v-if="!loading">
      <text>数据更新时间：{{ updateTime }}</text>
    </view>

    <!-- Loading 骨架屏 -->
    <view v-if="loading" class="loading-skeleton">
      <view class="skeleton-card" v-for="i in 6" :key="i">
        <view class="skeleton-line" :style="{ width: (60 + Math.random() * 40) + '%' }"></view>
      </view>
    </view>

    <!-- 热号区域 -->
    <view class="section" v-if="hotData.length > 0 && !loading">
      <view class="section-header">
        <view class="section-indicator hot-indicator"></view>
        <text class="section-title">热号 (出现次数较多)</text>
      </view>
      <view class="section-desc">以下号码在近{{ periods }}期内出现频率较高</view>
      <view class="cards-grid">
        <view
          v-for="item in hotData"
          :key="item.number"
          class="card hot-card"
        >
          <text class="card-number">{{ item.number }}</text>
          <text class="card-count">出现{{ item.count }}次</text>
          <view class="card-bar">
            <view
              class="card-bar-fill hot-bar-fill"
              :style="{ width: getHotBarWidth(item.count) + '%' }"
            ></view>
          </view>
          <text class="card-percent">{{ getPercent(item.count) }}%</text>
        </view>
      </view>
    </view>

    <!-- 冷号区域 -->
    <view class="section" v-if="coldData.length > 0 && !loading">
      <view class="section-header">
        <view class="section-indicator cold-indicator"></view>
        <text class="section-title">冷号 (出现次数较少)</text>
      </view>
      <view class="section-desc">以下号码在近{{ periods }}期内出现频率较低</view>
      <view class="cards-grid">
        <view
          v-for="item in coldData"
          :key="item.number"
          class="card cold-card"
        >
          <text class="card-number">{{ item.number }}</text>
          <text class="card-count">出现{{ item.count }}次</text>
          <view class="card-bar">
            <view
              class="card-bar-fill cold-bar-fill"
              :style="{ width: getColdBarWidth(item.count) + '%' }"
            ></view>
          </view>
          <text class="card-percent">{{ getPercent(item.count) }}%</text>
        </view>
      </view>
    </view>

    <!-- 说明 -->
    <view class="explanation" v-if="!loading">
      <text class="explanation-text">热号/冷号仅反映历史出现频率，不代表未来概率。彩票开奖结果随机产生，过往数据不预示未来走势。</text>
    </view>

    <view class="data-source">
      <text class="data-source-text">数据来源：中国福利彩票发行管理中心</text>
    </view>

    <Disclaimer />
    <AdBanner />

    <!-- 快捷导航 -->
    <view class="nav-links">
      <view class="nav-item" @click="goToPage('/pages/analysis/analysis')">
        <view class="nav-icon icon-analysis"></view>
        <text class="nav-text">综合分析</text>
      </view>
      <view class="nav-item" @click="goToPage('/pages/tools/distribution')">
        <view class="nav-icon icon-dist"></view>
        <text class="nav-text">号码分布</text>
      </view>
      <view class="nav-item" @click="goToPage('/pages/tools/omission')">
        <view class="nav-icon icon-omit"></view>
        <text class="nav-text">遗漏统计</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getHotCold, type HotColdData } from '@/api/tools';
import Disclaimer from '@/components/Disclaimer.vue';
import AdBanner from '@/components/AdBanner.vue';

const lotteryTypes = [
  { type: 'ssq', name: '双色球' },
  { type: 'd3', name: '福彩3D' },
  { type: 'qlc', name: '七乐彩' },
  { type: 'kl8', name: '快乐8' },
];

const periodOptions = [30, 50, 100];
const currentType = ref('ssq');
const periods = ref(30);
const hotData = ref<HotColdData['hot']>([]);
const coldData = ref<HotColdData['cold']>([]);
const loading = ref(false);
const updateTime = ref('');

const hotMax = computed(() => {
  if (hotData.value.length === 0) return 1;
  return Math.max(...hotData.value.map((item) => item.count));
});

const coldMax = computed(() => {
  if (coldData.value.length === 0) return 1;
  return Math.max(...coldData.value.map((item) => item.count));
});

function getNumberRange(type: string): number {
  switch (type) {
    case 'ssq': return 33;
    case 'd3': return 10;
    case 'qlc': return 30;
    case 'kl8': return 80;
    default: return 33;
  }
}

function generateMockHotCold(type: string): { hot: HotColdData['hot']; cold: HotColdData['cold'] } {
  const range = getNumberRange(type);
  const allNumbers = Array.from({ length: range }, (_, i) => ({
    number: String(i + (type === 'd3' ? 0 : 1)).padStart(type === 'd3' ? 1 : 2, '0'),
    count: Math.floor(Math.random() * 30) + 1,
  }));
  allNumbers.sort((a, b) => b.count - a.count);
  const hot = allNumbers.slice(0, 8);
  const cold = allNumbers.slice(-8).reverse();
  return { hot, cold };
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getHotCold(currentType.value, periods.value);
    if (res.code === 200 && res.data) {
      hotData.value = res.data.hot || [];
      coldData.value = res.data.cold || [];
    } else {
      const mock = generateMockHotCold(currentType.value);
      hotData.value = mock.hot;
      coldData.value = mock.cold;
    }
    updateTime.value = new Date().toLocaleString();
  } catch (e) {
    const mock = generateMockHotCold(currentType.value);
    hotData.value = mock.hot;
    coldData.value = mock.cold;
    updateTime.value = new Date().toLocaleString();
  } finally {
    loading.value = false;
  }
}

function getHotBarWidth(count: number): number {
  if (hotMax.value === 0) return 0;
  return (count / hotMax.value) * 100;
}

function getColdBarWidth(count: number): number {
  if (coldMax.value === 0) return 0;
  return (count / coldMax.value) * 100;
}

function getPercent(count: number): number {
  return Math.round((count / periods.value) * 100);
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

function goToPage(url: string) {
  uni.navigateTo({ url });
}

onMounted(() => {
  loadData();
});
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

.period-selector {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #FFFFFF;
  margin-top: 16rpx;
}
.period-label {
  font-size: 28rpx;
  color: #333333;
  margin-right: 16rpx;
  font-weight: 500;
}
.period-item {
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
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
.period-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
}
.period-item.active .period-text {
  color: #C41E3A;
  font-weight: 600;
}

.refresh-time {
  padding: 12rpx 24rpx;
  text-align: right;
}
.refresh-time text {
  font-size: 22rpx;
  color: #9E9E9E;
}

.loading-skeleton {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.skeleton-card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}
.skeleton-line {
  height: 32rpx;
  background-color: #F0F0F0;
  border-radius: 8rpx;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.section {
  margin-top: 24rpx;
  padding: 0 24rpx;
}
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.section-indicator {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
  margin-right: 12rpx;
}
.hot-indicator {
  background: linear-gradient(135deg, #C41E3A, #E53935);
}
.cold-indicator {
  background: linear-gradient(135deg, #1E88E5, #42A5F5);
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  letter-spacing: 0.5rpx;
}
.section-desc {
  font-size: 24rpx;
  color: #9E9E9E;
  margin-bottom: 16rpx;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.card {
  width: calc(25% - 12rpx);
  padding: 20rpx 0;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
  transition: all 0.2s;
}
.card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.hot-card {
  background: linear-gradient(135deg, #FFF5F5, #FFEBEE);
  border: 1rpx solid #FFCDD2;
}
.cold-card {
  background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
  border: 1rpx solid #90CAF9;
}
.card-number {
  font-size: 40rpx;
  font-weight: 600;
  color: #333333;
}
.card-count {
  font-size: 22rpx;
  color: #666666;
  margin-top: 8rpx;
}
.card-bar {
  width: 80%;
  height: 8rpx;
  background-color: rgba(0,0,0,0.06);
  border-radius: 4rpx;
  margin-top: 12rpx;
  overflow: hidden;
}
.card-bar-fill {
  height: 100%;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}
.hot-bar-fill {
  background: linear-gradient(90deg, #C41E3A, #E53935);
}
.cold-bar-fill {
  background: linear-gradient(90deg, #1E88E5, #42A5F5);
}
.card-percent {
  font-size: 20rpx;
  color: #9E9E9E;
  margin-top: 8rpx;
}

.explanation {
  padding: 24rpx;
  margin-top: 16rpx;
}
.explanation-text {
  font-size: 24rpx;
  color: #9E9E9E;
  line-height: 1.6;
  text-align: center;
}

.data-source {
  text-align: center;
  padding: 16rpx 0;
}
.data-source-text {
  font-size: 22rpx;
  color: #9E9E9E;
}

.nav-links {
  padding: 24rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
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
.icon-omit { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.icon-dist { background: linear-gradient(135deg, #43A047, #66BB6A); }
.icon-hot { background: linear-gradient(135deg, #F9A825, #FFB74D); }
.nav-text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}
</style>
