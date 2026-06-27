<template>
  <view class="lottery-page">
    <!-- Tab Navigation -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.code"
        class="tab-item"
        :class="{ active: currentTab === tab.code }"
        @click="switchTab(tab.code)"
      >
        <text class="tab-text">{{ tab.name }}</text>
        <view v-if="currentTab === tab.code" class="tab-indicator"></view>
      </view>
    </view>

    <view class="content-area">
      <view class="latest-card" v-if="latestDraw">
        <view class="latest-header">
          <view class="issue-area">
            <text class="latest-issue">第 {{ latestDraw.issue }} 期</text>
            <text class="latest-date">{{ formatDate(latestDraw.draw_date) }}</text>
          </view>
          <text class="update-time">{{ updateTime }}</text>
        </view>
        <view class="balls-area">
          <template v-if="currentTab === 'ssq'">
            <view class="ball-row">
              <view v-for="(ball, i) in latestDraw.red_balls" :key="'r'+i" class="ball red-ball" @click="onBallTap">
                <text class="ball-number">{{ ball }}</text>
              </view>
              <view v-if="latestDraw.blue_ball" class="ball blue-ball" @click="onBallTap">
                <text class="ball-number">{{ latestDraw.blue_ball }}</text>
              </view>
            </view>
          </template>
          <template v-else-if="currentTab === 'fc3d'">
            <view class="ball-row">
              <view v-for="(ball, i) in latestDraw.red_balls" :key="'d'+i" class="ball digit-ball" @click="onBallTap">
                <text class="ball-number">{{ ball }}</text>
              </view>
            </view>
          </template>
          <template v-else-if="currentTab === 'qlc'">
            <view class="ball-row wrap">
              <view v-for="(ball, i) in latestDraw.red_balls" :key="'q'+i" class="ball red-ball" @click="onBallTap">
                <text class="ball-number">{{ ball }}</text>
              </view>
              <view v-if="latestDraw.blue_ball" class="ball blue-ball" @click="onBallTap">
                <text class="ball-number">{{ latestDraw.blue_ball }}</text>
              </view>
            </view>
          </template>
          <template v-else-if="currentTab === 'kl8'">
            <view class="ball-grid">
              <view v-for="(ball, i) in latestDraw.red_balls" :key="'k'+i" class="grid-ball" @click="onBallTap">
                <text class="grid-ball-number">{{ ball }}</text>
              </view>
            </view>
          </template>
        </view>
        <view class="draw-info" v-if="latestDraw.prize_pool || latestDraw.sales_amount">
          <view class="info-row" v-if="latestDraw.prize_pool">
            <view class="info-icon">
              <view class="icon-prize"></view>
            </view>
            <text class="info-label">奖池金额</text>
            <text class="info-value">{{ latestDraw.prize_pool }}</text>
          </view>
          <view class="info-row" v-if="latestDraw.sales_amount">
            <view class="info-icon">
              <view class="icon-sales"></view>
            </view>
            <text class="info-label">销售额</text>
            <text class="info-value">{{ latestDraw.sales_amount }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="loading" class="loading-state">
        <view class="skeleton-card">
          <view class="skeleton-line long"></view>
          <view class="skeleton-line medium"></view>
          <view class="skeleton-balls">
            <view v-for="i in 7" :key="i" class="skeleton-ball"></view>
          </view>
        </view>
      </view>

      <view class="history-section" v-if="history.length > 0">
        <view class="section-header">
          <view class="section-title-area">
            <view class="section-indicator"></view>
            <text class="section-title">历史开奖</text>
          </view>
          <view class="toggle-btn" :class="{ active: showHistory }" @click="showHistory = !showHistory">
            <text class="toggle-text">{{ showHistory ? '收起' : '展开' }}</text>
          </view>
        </view>
        <view v-if="showHistory" class="history-list">
          <view v-for="(item, idx) in history" :key="idx" class="history-item">
            <view class="history-top">
              <text class="history-issue">第 {{ item.issue }} 期</text>
              <text class="history-date">{{ formatDate(item.draw_date) }}</text>
            </view>
            <view class="history-balls">
              <template v-if="currentTab === 'kl8'">
                <view class="history-grid">
                  <text v-for="(ball, bi) in item.red_balls.slice(0, 10)" :key="bi" class="history-ball-text">{{ ball }}</text>
                  <text v-if="item.red_balls.length > 10" class="more-text">...</text>
                </view>
              </template>
              <template v-else-if="currentTab === 'fc3d'">
                <view class="history-ball-row">
                  <text v-for="(ball, bi) in item.red_balls" :key="bi" class="history-digit">{{ ball }}</text>
                </view>
              </template>
              <template v-else>
                <view class="history-ball-row">
                  <text v-for="(ball, bi) in item.red_balls" :key="bi" class="history-red-ball">{{ ball }}</text>
                  <text v-if="item.blue_ball" class="history-blue-ball">{{ item.blue_ball }}</text>
                </view>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="!loading && !latestDraw" class="empty-state">
        <view class="empty-icon">
          <view class="icon-empty"></view>
        </view>
        <text class="empty-text">暂无数据</text>
        <text class="empty-sub">下拉刷新获取最新开奖</text>
      </view>

      <AdBanner />
      <Disclaimer />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getLatest, getHistory, type LotteryResult } from '@/api/lottery';
import Disclaimer from '@/components/Disclaimer.vue';
import AdBanner from '@/components/AdBanner.vue';

interface Tab { name: string; code: string; }

const tabs: Tab[] = [
  { name: '双色球', code: 'ssq' },
  { name: '福彩3D', code: 'fc3d' },
  { name: '七乐彩', code: 'qlc' },
  { name: '快乐8', code: 'kl8' },
];

const currentTab = ref('ssq');
const latestDraw = ref<LotteryResult | null>(null);
const history = ref<LotteryResult[]>([]);
const loading = ref(false);
const showHistory = ref(true);
const updateTime = ref('');

onMounted(() => { loadData(); });

function switchTab(code: string) {
  if (currentTab.value === code) return;
  currentTab.value = code;
  latestDraw.value = null;
  history.value = [];
  loadData();
}

async function loadData() {
  loading.value = true;
  try {
    const [latestRes, historyRes] = await Promise.all([
      getLatest(currentTab.value),
      getHistory(currentTab.value, 20, 0),
    ]);
    if ((latestRes.code === 0 || latestRes.code === 200) && latestRes.data) {
      latestDraw.value = latestRes.data;
    }
    if ((historyRes.code === 0 || historyRes.code === 200) && historyRes.data) {
      history.value = historyRes.data;
    }
    updateTime.value = `数据更新于 ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    uni.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function onPullDownRefresh() {
  loadData().finally(() => { uni.stopPullDownRefresh(); });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function onBallTap() {
  uni.showToast({ title: '点击查看详情', icon: 'none' });
}
</script>

<style scoped>
.lottery-page { min-height: 100vh; padding-bottom: 100rpx; background-color: #F8F8F8; }
.tab-bar { display: flex; background-color: #FFFFFF; border-bottom: 1rpx solid #F0F0F0; padding: 0 16rpx; }
.tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20rpx 0 8rpx; position: relative; }
.tab-text { font-size: 30rpx; color: #666666; transition: color 0.2s; font-weight: 500; }
.tab-item.active .tab-text { color: #C41E3A; font-weight: 600; }
.tab-indicator { width: 40rpx; height: 4rpx; background-color: #C41E3A; border-radius: 2rpx; margin-top: 8rpx; transition: all 0.3s; }
.content-area { padding: 24rpx; }
.latest-card { background: linear-gradient(135deg, #FFFFFF, #FAFAFA); border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02); border: 1rpx solid #F0F0F0; }
.latest-card:active { transform: translateY(-2rpx); box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08), 0 8rpx 32rpx rgba(0,0,0,0.04); }
.latest-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24rpx; }
.issue-area { display: flex; flex-direction: column; }
.latest-issue { font-size: 32rpx; font-weight: 600; color: #333333; letter-spacing: 0.5rpx; }
.latest-date { font-size: 26rpx; color: #9E9E9E; margin-top: 4rpx; }
.update-time { font-size: 22rpx; color: #BDBDBD; }
.balls-area { margin-bottom: 24rpx; }
.ball-row { display: flex; gap: 16rpx; align-items: center; justify-content: center; flex-wrap: nowrap; }
.ball-row.wrap { flex-wrap: wrap; justify-content: center; gap: 12rpx; }
.ball { width: 72rpx; height: 72rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1); transition: transform 0.3s; }
.ball:active { transform: scale(1.1); }
.red-ball { background: linear-gradient(135deg, #C41E3A, #E53935); }
.blue-ball { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.digit-ball { background: linear-gradient(135deg, #C41E3A, #E53935); width: 80rpx; height: 80rpx; }
.ball-number { font-size: 30rpx; font-weight: 600; color: #ffffff; }
.ball-grid { display: flex; flex-wrap: wrap; gap: 10rpx; justify-content: center; }
.grid-ball { width: 56rpx; height: 56rpx; border-radius: 50%; background: linear-gradient(135deg, #C41E3A, #E53935); display: flex; align-items: center; justify-content: center; transition: transform 0.3s; }
.grid-ball:active { transform: scale(1.1); }
.grid-ball-number { font-size: 24rpx; font-weight: 600; color: #ffffff; }
.draw-info { border-top: 1rpx solid #F0F0F0; padding-top: 20rpx; }
.info-row { display: flex; align-items: center; margin-bottom: 12rpx; }
.info-row:last-child { margin-bottom: 0; }
.info-icon { width: 40rpx; height: 40rpx; border-radius: 20rpx; background-color: #FFF5F5; display: flex; align-items: center; justify-content: center; margin-right: 12rpx; }
.icon-prize { width: 20rpx; height: 20rpx; background-color: #C41E3A; border-radius: 50%; }
.icon-sales { width: 20rpx; height: 20rpx; background-color: #1E88E5; border-radius: 50%; }
.info-label { font-size: 26rpx; color: #9E9E9E; margin-right: 12rpx; }
.info-value { font-size: 28rpx; color: #C41E3A; font-weight: 600; }
.loading-state { padding: 24rpx; }
.skeleton-card { background-color: #FFFFFF; border-radius: 20rpx; padding: 32rpx; box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04); }
.skeleton-line { height: 32rpx; background-color: #F0F0F0; border-radius: 8rpx; margin-bottom: 16rpx; animation: pulse 1.5s infinite; }
.skeleton-line.long { width: 80%; }
.skeleton-line.medium { width: 60%; }
.skeleton-balls { display: flex; gap: 12rpx; margin-top: 24rpx; }
.skeleton-ball { width: 72rpx; height: 72rpx; border-radius: 50%; background-color: #F0F0F0; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.history-section { margin-bottom: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; padding: 0 8rpx; }
.section-title-area { display: flex; align-items: center; gap: 12rpx; }
.section-indicator { width: 8rpx; height: 32rpx; background-color: #C41E3A; border-radius: 4rpx; }
.section-title { font-size: 32rpx; font-weight: 600; color: #333333; letter-spacing: 0.5rpx; }
.toggle-btn { padding: 8rpx 16rpx; background-color: #F5F5F5; border-radius: 8rpx; transition: background-color 0.2s; }
.toggle-btn:active { background-color: #E0E0E0; }
.toggle-btn.active { background-color: #FFF5F5; }
.toggle-text { font-size: 26rpx; color: #666666; }
.toggle-btn.active .toggle-text { color: #C41E3A; }
.history-list { background-color: #FFFFFF; border-radius: 20rpx; overflow: hidden; box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02); }
.history-item { padding: 24rpx 32rpx; border-bottom: 1rpx solid #F5F5F5; transition: background-color 0.2s; }
.history-item:active { background-color: #FAFAFA; }
.history-item:last-child { border-bottom: none; }
.history-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.history-issue { font-size: 28rpx; color: #333333; font-weight: 500; }
.history-date { font-size: 24rpx; color: #9E9E9E; }
.history-balls { margin-top: 8rpx; }
.history-ball-row { display: flex; gap: 10rpx; align-items: center; flex-wrap: wrap; }
.history-red-ball { width: 48rpx; height: 48rpx; border-radius: 50%; background: linear-gradient(135deg, #C41E3A, #E53935); color: #ffffff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.history-blue-ball { width: 48rpx; height: 48rpx; border-radius: 50%; background: linear-gradient(135deg, #1E88E5, #42A5F5); color: #ffffff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.history-digit { width: 48rpx; height: 48rpx; border-radius: 50%; background: linear-gradient(135deg, #C41E3A, #E53935); color: #ffffff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.history-grid { display: flex; flex-wrap: wrap; gap: 8rpx; align-items: center; }
.history-ball-text { width: 44rpx; height: 44rpx; border-radius: 50%; background: linear-gradient(135deg, #C41E3A, #E53935); color: #ffffff; font-size: 20rpx; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.more-text { font-size: 24rpx; color: #9E9E9E; margin-left: 8rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; }
.empty-icon { width: 120rpx; height: 120rpx; border-radius: 60rpx; background-color: #F5F5F5; display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; }
.icon-empty { width: 60rpx; height: 60rpx; border: 4rpx solid #E0E0E0; border-radius: 50%; position: relative; }
.icon-empty::after { content: ''; position: absolute; top: 50%; left: 50%; width: 20rpx; height: 4rpx; background-color: #E0E0E0; transform: translate(-50%, -50%); }
.empty-text { font-size: 32rpx; color: #9E9E9E; margin-bottom: 12rpx; font-weight: 500; }
.empty-sub { font-size: 26rpx; color: #BDBDBD; }
</style>