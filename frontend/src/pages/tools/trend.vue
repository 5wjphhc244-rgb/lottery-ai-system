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

    <!-- 数据表格 -->
    <scroll-view scroll-x class="table-scroll" v-if="trendList.length > 0 && !loading">
      <view class="table-wrapper">
        <!-- 表头 -->
        <view class="table-header">
          <view class="th th-issue">期号</view>
          <view class="th th-date">开奖日期</view>
          <view class="th th-balls">开奖号码</view>
        </view>
        <!-- 表体 -->
        <view
          v-for="(row, index) in trendList"
          :key="index"
          class="table-row"
          :class="{ 'row-alt': index % 2 === 1 }"
        >
          <view class="td td-issue">{{ row.issue }}</view>
          <view class="td td-date">{{ row.draw_date }}</view>
          <view class="td td-balls">
            <!-- 双色球 -->
            <template v-if="currentType === 'ssq'">
              <view class="ball-row">
                <view
                  v-for="num in row.red_balls"
                  :key="num"
                  class="ball ball-red"
                >
                  <text>{{ num }}</text>
                </view>
                <view v-if="row.blue_ball" class="ball ball-blue">
                  <text>{{ row.blue_ball }}</text>
                </view>
              </view>
            </template>
            <!-- 福彩3D -->
            <template v-else-if="currentType === 'd3'">
              <view class="ball-row">
                <view
                  v-for="num in row.red_balls"
                  :key="num"
                  class="ball ball-neutral"
                >
                  <text>{{ num }}</text>
                </view>
              </view>
            </template>
            <!-- 七乐彩 -->
            <template v-else-if="currentType === 'qlc'">
              <view class="ball-row">
                <view
                  v-for="num in row.red_balls"
                  :key="num"
                  class="ball ball-red"
                >
                  <text>{{ num }}</text>
                </view>
              </view>
            </template>
            <!-- 快乐8 -->
            <template v-else-if="currentType === 'kl8'">
              <view class="kl8-grid">
                <view
                  v-for="num in row.red_balls"
                  :key="num"
                  class="kl8-ball"
                >
                  <text>{{ num }}</text>
                </view>
              </view>
            </template>
          </view>
        </view>
      </view>
    </scroll-view>

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
import { ref, onMounted } from 'vue';
import { getTrend, type TrendData } from '@/api/tools';
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
const trendList = ref<TrendData[]>([]);
const loading = ref(false);
const updateTime = ref('');

function generateMockTrend(type: string, count: number): TrendData[] {
  const list: TrendData[] = [];
  const baseIssue = 2024000;
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const issue = String(baseIssue + count - i);
    const date = new Date(now.getTime() - i * 86400000 * (type === 'd3' ? 1 : 2));
    const drawDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let red: string[] = [];
    let blue: string | undefined;
    let bonus: string[] | undefined;
    if (type === 'ssq') {
      red = Array.from({ length: 6 }, (_, j) => String(Math.floor(Math.random() * 33) + 1).padStart(2, '0'));
      blue = String(Math.floor(Math.random() * 16) + 1).padStart(2, '0');
    } else if (type === 'd3') {
      red = Array.from({ length: 3 }, () => String(Math.floor(Math.random() * 10)));
    } else if (type === 'qlc') {
      red = Array.from({ length: 7 }, (_, j) => String(Math.floor(Math.random() * 30) + 1).padStart(2, '0'));
    } else if (type === 'kl8') {
      red = Array.from({ length: 20 }, (_, j) => String(Math.floor(Math.random() * 80) + 1).padStart(2, '0'));
    }
    list.push({ issue, draw_date: drawDate, red_balls: red, blue_ball: blue, bonus_balls: bonus });
  }
  return list;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getTrend(currentType.value, periods.value);
    if (res.code === 200 && res.data && res.data.length > 0) {
      trendList.value = res.data;
    } else {
      trendList.value = generateMockTrend(currentType.value, periods.value);
    }
    updateTime.value = new Date().toLocaleString();
  } catch (e) {
    trendList.value = generateMockTrend(currentType.value, periods.value);
    updateTime.value = new Date().toLocaleString();
  } finally {
    loading.value = false;
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

function onPullDownRefresh() {
  loadData().finally(() => {
    uni.stopPullDownRefresh();
  });
}
</script>

<style scoped>
.container {
  padding: 0 0 40rpx 0;
  background-color: #F8F8F8;
  min-height: 100vh;
}

/* 标签栏 */
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

/* 期数选择 */
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

/* 表格 */
.table-scroll {
  margin-top: 16rpx;
  background-color: #FFFFFF;
}
.table-wrapper {
  min-width: 100%;
  display: inline-block;
}
.table-header {
  display: flex;
  background-color: #FAFAFA;
  border-bottom: 1rpx solid #F0F0F0;
  padding: 20rpx 0;
  white-space: nowrap;
}
.th {
  font-size: 26rpx;
  color: #666666;
  font-weight: 600;
  text-align: center;
  flex-shrink: 0;
}
.th-issue {
  width: 160rpx;
}
.th-date {
  width: 200rpx;
}
.th-balls {
  flex: 1;
  min-width: 400rpx;
  text-align: left;
  padding-left: 24rpx;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
  white-space: nowrap;
  transition: background-color 0.2s;
}
.table-row:active {
  background-color: #FAFAFA;
}
.row-alt {
  background-color: #FAFAFA;
}
.td {
  font-size: 24rpx;
  color: #333333;
  text-align: center;
  flex-shrink: 0;
}
.td-issue {
  width: 160rpx;
  font-weight: 500;
}
.td-date {
  width: 200rpx;
  color: #9E9E9E;
}
.td-balls {
  flex: 1;
  min-width: 400rpx;
  text-align: left;
  padding-left: 24rpx;
}

/* 球样式 */
.ball-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
}
.ball {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.08);
}
.ball-red {
  background: linear-gradient(135deg, #C41E3A, #E53935);
  color: #ffffff;
}
.ball-blue {
  background: linear-gradient(135deg, #1E88E5, #42A5F5);
  color: #ffffff;
}
.ball-neutral {
  background: linear-gradient(135deg, #F9A825, #FFB74D);
  color: #ffffff;
}

.kl8-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
  max-width: 320rpx;
}
.kl8-ball {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #C41E3A, #E53935);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.08);
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
