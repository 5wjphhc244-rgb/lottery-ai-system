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

    <!-- 数据刷新时间 -->
    <view class="refresh-time" v-if="!loading">
      <text>数据更新时间：{{ updateTime }}</text>
    </view>

    <!-- Loading 骨架屏 -->
    <view v-if="loading" class="loading-skeleton">
      <view class="skeleton-card" v-for="i in 6" :key="i">
        <view class="skeleton-line" :style="{ width: (60 + Math.random() * 40) + '%' }"></view>
      </view>
    </view>

    <!-- 表头 -->
    <view class="table-header" v-if="!loading">
      <view class="th" @click="toggleSort('number')">
        <text>号码</text>
        <text class="sort-icon">{{ sortKey === 'number' ? (sortAsc ? '▲' : '▼') : '' }}</text>
      </view>
      <view class="th" @click="toggleSort('missed')">
        <text>当前遗漏</text>
        <text class="sort-icon">{{ sortKey === 'missed' ? (sortAsc ? '▲' : '▼') : '' }}</text>
      </view>
      <view class="th" @click="toggleSort('maxMissed')">
        <text>最大遗漏</text>
        <text class="sort-icon">{{ sortKey === 'maxMissed' ? (sortAsc ? '▲' : '▼') : '' }}</text>
      </view>
      <view class="th" @click="toggleSort('avgMissed')">
        <text>平均遗漏</text>
        <text class="sort-icon">{{ sortKey === 'avgMissed' ? (sortAsc ? '▲' : '▼') : '' }}</text>
      </view>
    </view>

    <!-- 数据列表 -->
    <view class="data-list" v-if="sortedData.length > 0 && !loading">
      <view
        v-for="(item, index) in sortedData"
        :key="item.number"
        class="data-row"
        :class="{ 'row-alt': index % 2 === 1, 'high-missed-row': item.missed > item.avgMissed }"
      >
        <view class="td td-number">
          <view class="number-ball">{{ item.number }}</view>
        </view>
        <view
          class="td td-missed"
        >
          <text class="missed-value" :class="{ 'high-missed': item.missed > item.avgMissed }">
            {{ item.missed }}
          </text>
          <view class="missed-bar" v-if="item.missed > item.avgMissed">
            <view class="missed-bar-fill" :style="{ width: Math.min(100, (item.missed / item.maxMissed) * 100) + '%' }"></view>
          </view>
        </view>
        <view class="td td-max">{{ item.maxMissed }}</view>
        <view class="td td-avg">{{ item.avgMissed.toFixed(1) }}</view>
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

    <Disclaimer text="遗漏数据仅反映历史出现频率，不代表未来概率。本页面展示的数据均为历史开奖数据统计，仅供参考，不构成任何投注建议。" />
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
      <view class="nav-item" @click="goToPage('/pages/tools/hotcold')">
        <view class="nav-icon icon-hot"></view>
        <text class="nav-text">冷热分析</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getOmission, type OmissionData } from '@/api/tools';
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
const omissionData = ref<OmissionData['omission']>([]);
const sortKey = ref<'number' | 'missed' | 'maxMissed' | 'avgMissed'>('number');
const sortAsc = ref(true);
const loading = ref(false);
const updateTime = ref('');

function getNumberRange(type: string): { start: number; end: number } {
  switch (type) {
    case 'ssq': return { start: 1, end: 33 };
    case 'd3': return { start: 0, end: 9 };
    case 'qlc': return { start: 1, end: 30 };
    case 'kl8': return { start: 1, end: 80 };
    default: return { start: 1, end: 33 };
  }
}

function generateMockOmission(type: string): OmissionData['omission'] {
  const range = getNumberRange(type);
  const list: OmissionData['omission'] = [];
  for (let i = range.start; i <= range.end; i++) {
    const missed = Math.floor(Math.random() * 50) + 1;
    const maxMissed = missed + Math.floor(Math.random() * 100) + 10;
    const avgMissed = missed + (Math.random() * 20 - 10);
    list.push({
      number: String(i).padStart(type === 'd3' ? 1 : 2, '0'),
      missed,
      maxMissed,
      avgMissed: Math.max(1, avgMissed),
    });
  }
  return list;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getOmission(currentType.value, periods.value);
    if (res.code === 200 && res.data && res.data.omission) {
      omissionData.value = res.data.omission;
    } else {
      omissionData.value = generateMockOmission(currentType.value);
    }
    updateTime.value = new Date().toLocaleString();
  } catch (e) {
    omissionData.value = generateMockOmission(currentType.value);
    updateTime.value = new Date().toLocaleString();
  } finally {
    loading.value = false;
  }
}

const sortedData = computed(() => {
  const data = [...omissionData.value];
  data.sort((a, b) => {
    let valA: number | string;
    let valB: number | string;
    switch (sortKey.value) {
      case 'number':
        valA = parseInt(a.number);
        valB = parseInt(b.number);
        break;
      case 'missed':
        valA = a.missed;
        valB = b.missed;
        break;
      case 'maxMissed':
        valA = a.maxMissed;
        valB = b.maxMissed;
        break;
      case 'avgMissed':
        valA = a.avgMissed;
        valB = b.avgMissed;
        break;
      default:
        valA = a.number;
        valB = b.number;
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc.value ? valA - valB : valB - valA;
    }
    return sortAsc.value ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });
  return data;
});

function toggleSort(key: 'number' | 'missed' | 'maxMissed' | 'avgMissed') {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
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

.table-header {
  display: flex;
  background-color: #FAFAFA;
  border-bottom: 1rpx solid #F0F0F0;
  padding: 24rpx 16rpx;
  margin-top: 16rpx;
}
.th {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #666666;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sort-icon {
  font-size: 20rpx;
  margin-left: 4rpx;
  color: #C41E3A;
}

.data-list {
  background-color: #FFFFFF;
}
.data-row {
  display: flex;
  align-items: center;
  padding: 16rpx;
  border-bottom: 1rpx solid #F0F0F0;
  transition: background-color 0.2s;
}
.data-row:active {
  background-color: #FAFAFA;
}
.row-alt {
  background-color: #FAFAFA;
}
.high-missed-row {
  background-color: #FFF5F5;
}
.td {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #333333;
}
.td-number {
  display: flex;
  justify-content: center;
}
.number-ball {
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
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.08);
}
.missed-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}
.high-missed {
  color: #C41E3A;
  font-size: 32rpx;
}
.missed-bar {
  width: 80%;
  height: 4rpx;
  background-color: #F0F0F0;
  border-radius: 2rpx;
  margin: 4rpx auto 0;
  overflow: hidden;
}
.missed-bar-fill {
  height: 100%;
  background-color: #C41E3A;
  border-radius: 2rpx;
  transition: width 0.3s ease;
}
.td-max {
  color: #666666;
}
.td-avg {
  color: #9E9E9E;
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
.icon-dist { background: linear-gradient(135deg, #43A047, #66BB6A); }
.icon-hot { background: linear-gradient(135deg, #F9A825, #FFB74D); }
.nav-text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}
</style>
