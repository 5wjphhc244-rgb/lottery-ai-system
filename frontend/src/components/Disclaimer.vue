<template>
  <view class="disclaimer">
    <view class="disclaimer-icon">
      <view class="icon-info">
        <view class="info-dot"></view>
        <view class="info-line"></view>
      </view>
    </view>
    <text class="disclaimer-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), {
  text: '本页面展示的数据均为历史开奖数据统计，仅供参考，不构成任何投注建议。彩票开奖结果随机产生，过往数据不代表未来走势。请理性购彩，量力而行。'
});
</script>

<style scoped>
.disclaimer {
  padding: 20rpx 24rpx;
  background-color: #FFF8E1;
  border-left: 4rpx solid #F9A825;
  margin: 16rpx 0;
  border-radius: 0 12rpx 12rpx 0;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}
.disclaimer-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background-color: #F9A825;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.icon-info {
  position: relative;
  width: 20rpx;
  height: 20rpx;
}
.info-dot {
  width: 4rpx;
  height: 4rpx;
  border-radius: 50%;
  background-color: #ffffff;
  position: absolute;
  top: 2rpx;
  left: 50%;
  transform: translateX(-50%);
}
.info-line {
  width: 4rpx;
  height: 8rpx;
  background-color: #ffffff;
  border-radius: 2rpx;
  position: absolute;
  bottom: 2rpx;
  left: 50%;
  transform: translateX(-50%);
}
.disclaimer-text {
  font-size: 22rpx;
  color: #666666;
  line-height: 1.6;
  flex: 1;
  letter-spacing: 0.5rpx;
}
</style>
