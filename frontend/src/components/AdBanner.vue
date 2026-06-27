<template>
  <view class="ad-banner">
    <view class="ad-inner">
      <view class="ad-icon">
        <view class="icon-megaphone">
          <view class="megaphone-body"></view>
          <view class="megaphone-mouth"></view>
        </view>
      </view>
      <view class="ad-content">
        <text class="ad-title">最新福彩资讯</text>
        <text class="ad-desc">关注官方动态，了解最新玩法</text>
      </view>
      <text class="ad-label">资讯</text>
    </view>
  </view>
</template>

<style scoped>
.ad-banner {
  margin: 16rpx 0;
  padding: 0 24rpx;
}
.ad-inner {
  height: 120rpx;
  background-color: #F5F5F5;
  border: 1rpx solid #F0F0F0;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  position: relative;
}
.ad-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #FFF5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.icon-megaphone {
  position: relative;
  width: 32rpx;
  height: 24rpx;
}
.megaphone-body {
  width: 24rpx;
  height: 16rpx;
  background-color: #C41E3A;
  border-radius: 4rpx;
  position: absolute;
  left: 0;
  top: 4rpx;
}
.megaphone-mouth {
  position: absolute;
  right: 0;
  top: 0;
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 10rpx solid #C41E3A;
}
.ad-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ad-title {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}
.ad-desc {
  font-size: 22rpx;
  color: #9E9E9E;
  margin-top: 4rpx;
  letter-spacing: 0.5rpx;
}
.ad-label {
  position: absolute;
  top: 12rpx;
  right: 16rpx;
  font-size: 18rpx;
  color: #9E9E9E;
  background: rgba(0,0,0,0.04);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}
</style>
