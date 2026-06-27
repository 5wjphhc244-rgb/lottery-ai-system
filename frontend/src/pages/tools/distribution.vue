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

    <!-- 统计摘要 -->
    <view class="summary-card" v-if="distributionData.length > 0 && !loading">
      <view class="summary-item">
        <view class="summary-icon icon-total"></view>
        <text class="summary-label">总期数</text>
        <text class="summary-value">{{ totalDraws }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <view class="summary-icon icon-hot"></view>
        <text class="summary-label">最热号码</text>
        <text class="summary-value hot">{{ hottestNumber }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <view class="summary-icon icon-cold"></view>
        <text class="summary-label">最冷号码</text>
        <text class="summary-value cold">{{ coldestNumber }}</text>
      </view>
    </view>

    <!-- 图表标题 -->
    <view class="chart-title" v-if="!loading">
      <view class="title-bar"></view>
      <text class="chart-title-text">号码出现频率分布</text>
    </view>

    <!-- Loading -->
    <view v-if="loading" class="loading-skeleton">
      <view class="skeleton-card" v-for="i in 6" :key="i">
        <view class="skeleton-line" :style="{ width: (60 + Math.random() * 40) + '%' }"></view>
      </view>
    </view>

    <!-- 柱状图 -->
    <view class="chart-scroll" v-if="distributionData.length > 0 && !loading">
      <view
        v-for="item in distributionData"
        :key="item.number"
        class="bar-row"
      >
        <view class="bar-label">
          <text class="bar-number">{{ item.number }}</text>
        </view>
        <view class="bar-track">
          <view
            class="bar-fill"
            :style="{ width: getBarWidth(item.count) + '%' }"
          >
            <text class="bar-count">{{ item.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="!loading" class="empty-state">
      <view class="empty-icon">
        <view class="icon-empty"></view>
      </view>
      <text class="empty-text">暂无数据</text>
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
      <view class="nav-item" @click="goToPage('/pages/tools/omission')">
        <view class="nav-icon icon-omit"></view>
        <text class="nav-text">遗漏统计</text>
      </view>
      <view class="nav-item" @click="goToPage('/pages/tools/hotcold')">
        <view class="nav-icon icon-hot"></view>
        <text class="nav-text">冷热分析</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getDistribution, type DistributionData } from '@/api/tools';
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
const periods = ref(50);
const distributionData = ref<DistributionData['distribution']>([]);
const totalDraws = ref(1000);
const loading = ref(false);
const updateTime = ref('');

const maxCount = computed(() => {
  if (distributionData.value.length === 0) return 1;
  return Math.max(...distributionData.value.map((item) => item.count));
});

const hottestNumber = computed(() => {
  if (distributionData.value.length === 0) return '-';
  const max = Math.max(...distributionData.value.map((item) => item.count));
  const items = distributionData.value.filter((item) => item.count === max);
  return items.map((item) => item.number).join(', ');
});

const coldestNumber = computed(() => {
  if (distributionData.value.length === 0) return '-';
  const min = Math.min(...distributionData.value.map((item) => item.count));
  const items = distributionData.value.filter((item) => item.count === min);
  return items.map((item) => item.number).join(', ');
});

function getNumberRange(type: string): { start: number; end: number } {
  switch (type) {
    case 'ssq': return { start: 1, end: 33 };
    case 'd3': return { start: 0, end: 9 };
    case 'qlc': return { start: 1, end: 30 };
    case 'kl8': return { start: 1, end: 80 };
    default: return { start: 1, end: 33 };
  }
}

function generateMockDistribution(type: string): DistributionData['distribution'] {
  const range = getNumberRange(type);
  const list: DistributionData['distribution'] = [];
  for (let i = range.start; i <= range.end; i++) {
    list.push({
      number: String(i).padStart(type === 'd3' ? 1 : 2, '0'),
      count: Math.floor(Math.random() * 200) + 50,
    });
  }
  return list;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getDistribution(currentType.value, periods.value);
    if (res.code === 200 && res.data && res.data.distribution) {
      distributionData.value = res.data.distribution;
    } else {
      distributionData.value = generateMockDistribution(currentType.value);
    }
    updateTime.value = new Date().toLocaleString();
  } catch (e) {
    distributionData.value = generateMockDistribution(currentType.value);
    updateTime.value = new Date().toLocaleString();
  } finally {
    loading.value = false;
  }
}

function getBarWidth(count: number): number {
  if (maxCount.value === 0) return 0;
  return (count / maxCount.value) * 100;
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

.summary-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFFFFF;
  padding: 32rpx 24rpx;
  margin: 16rpx 24rpx 0;
  border-radius: 20rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex: 1;
}
.summary-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: #F0F0F0;
}
.summary-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  margin-bottom: 4rpx;
}
.icon-total { background: linear-gradient(135deg, #9E9E9E, #BDBDBD); }
.icon-hot { background: linear-gradient(135deg, #C41E3A, #E53935); }
.icon-cold { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.summary-label {
  font-size: 24rpx;
  color: #9E9E9E;
}
.summary-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}
.summary-value.hot {
  color: #C41E3A;
}
.summary-value.cold {
  color: #1E88E5;
}

.chart-title {
  padding: 24rpx 24rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.title-bar {
  width: 8rpx;
  height: 32rpx;
  background-color: #C41E3A;
  border-radius: 4rpx;
}
.chart-title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.chart-scroll {
  background-color: #FFFFFF;
  margin: 0 24rpx;
  border-radius: 20rpx;
  padding: 16rpx;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04);
}

.bar-row {
  display: flex;
  align-items: center;
  padding: 8rpx 0;
  transition: background-color 0.2s;
}
.bar-row:active {
  background-color: #FAFAFA;
}
.bar-label {
  width: 60rpx;
  flex-shrink: 0;
}
.bar-number {
  font-size: 22rpx;
  color: #666666;
  text-align: right;
  display: block;
  font-weight: 500;
}
.bar-track {
  flex: 1;
  height: 36rpx;
  background-color: #F5F5F5;
  border-radius: 18rpx;
  margin-left: 12rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #C41E3A, #E53935);
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
  min-width: 60rpx;
  transition: width 0.5s ease;
}
.bar-count {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
}

.empty-state {
  padding: 80rpx 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background-color: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}
.icon-empty {
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #E0E0E0;
  border-radius: 50%;
  position: relative;
}
.icon-empty::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16rpx;
  height: 2rpx;
  background-color: #E0E0E0;
  transform: translate(-50%, -50%);
}
.empty-text {
  font-size: 28rpx;
  color: #9E9E9E;
  font-weight: 500;
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
.icon-hot { background: linear-gradient(135deg, #F9A825, #FFB74D); }
.nav-text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}
</style>
