<template>
  <view class="profile-page" :class="{ dark: darkMode }">
    <view class="profile-header">
      <view class="header-bg"></view>
      <view class="avatar-area">
        <view class="avatar-wrapper">
          <view class="avatar-circle">
            <view class="avatar-inner">
              <view class="avatar-letter">AI</view>
            </view>
          </view>
          <view class="avatar-badge">v{{ appVersion }}</view>
        </view>
        <text class="avatar-name">福彩AI助手</text>
        <text class="avatar-desc">历史数据查询与分析工具</text>
      </view>
    </view>
    <view class="content-area">
      <view class="section-card">
        <view class="section-title-area">
          <view class="section-icon icon-settings"></view>
          <text class="section-title">设置</text>
        </view>
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-icon-box"><view class="icon-fontsize"></view></view>
            <text class="setting-label">字体大小</text>
          </view>
          <view class="setting-right">
            <view class="font-size-options">
              <view v-for="size in fontSizes" :key="size.value" class="size-option" :class="{ active: fontSize === size.value }" @click="setFontSize(size.value)">
                <text class="size-text" :style="{ fontSize: size.fontSize }">{{ size.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="setting-item">
          <view class="setting-left">
            <view class="setting-icon-box"><view class="icon-moon"></view></view>
            <text class="setting-label">深色模式</text>
          </view>
          <view class="setting-right">
            <view class="toggle-switch" :class="{ on: darkMode }" @click="toggleDarkMode">
              <view class="toggle-knob"></view>
            </view>
          </view>
        </view>
      </view>
      <view class="section-card">
        <view class="section-title-area">
          <view class="section-icon icon-info"></view>
          <text class="section-title">关于</text>
        </view>
        <view class="info-item" @click="showAbout">
          <view class="info-left">
            <view class="info-icon-box"><view class="icon-about"></view></view>
            <text class="info-label">关于我们</text>
          </view>
          <text class="info-arrow">&#8250;</text>
        </view>
        <view class="info-item" @click="showPrivacy">
          <view class="info-left">
            <view class="info-icon-box"><view class="icon-privacy"></view></view>
            <text class="info-label">隐私政策</text>
          </view>
          <text class="info-arrow">&#8250;</text>
        </view>
        <view class="info-item" @click="showHelp">
          <view class="info-left">
            <view class="info-icon-box"><view class="icon-help"></view></view>
            <text class="info-label">帮助与FAQ</text>
          </view>
          <text class="info-arrow">&#8250;</text>
        </view>
        <view class="info-item" @click="showFeedback">
          <view class="info-left">
            <view class="info-icon-box"><view class="icon-feedback"></view></view>
            <text class="info-label">意见反馈</text>
          </view>
          <text class="info-arrow">&#8250;</text>
        </view>
      </view>
      <view class="section-card danger-zone">
        <view class="danger-item" @click="confirmClearCache">
          <view class="danger-left">
            <view class="danger-icon-box"><view class="icon-trash"></view></view>
            <view class="danger-texts">
              <text class="danger-label">清除缓存</text>
              <text class="danger-desc">将删除本地收藏的号码和设置数据</text>
            </view>
          </view>
        </view>
      </view>
      <Disclaimer />
      <view class="responsible-text"><text>理性购彩，量力而行</text></view>
      <view class="footer-text"><text>本应用不收集任何个人数据</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getLocal, setLocal, clearLocal } from '@/utils/storage';
import Disclaimer from '@/components/Disclaimer.vue';

const appVersion = ref('1.0.0');
const fontSize = ref('medium');
const darkMode = ref(false);

const fontSizes = [
  { label: '小', value: 'small', fontSize: '24rpx' },
  { label: '中', value: 'medium', fontSize: '28rpx' },
  { label: '大', value: 'large', fontSize: '32rpx' },
];

onMounted(() => {
  const savedFont = getLocal<string>('fontSize');
  if (savedFont) fontSize.value = savedFont;
  const savedDark = getLocal<boolean>('darkMode');
  if (savedDark !== null) darkMode.value = savedDark;
});

function setFontSize(size: string) {
  fontSize.value = size;
  setLocal('fontSize', size);
  uni.showToast({ title: '已设置', icon: 'success' });
}
function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  setLocal('darkMode', darkMode.value);
  uni.showToast({ title: darkMode.value ? '深色模式已开启' : '深色模式已关闭', icon: 'none' });
}
function showAbout() {
  uni.showModal({ title: '关于我们', content: '福彩AI助手是一款历史数据查询与分析工具，帮助用户查询福彩开奖信息、历史数据和玩法规则。我们不提供任何预测或推荐服务。', showCancel: false, confirmText: '我知道了' });
}
function showPrivacy() {
  uni.showModal({ title: '隐私政策', content: '本应用为纯工具型应用，不收集、存储或传输任何个人身份信息。所有数据均存储于本地设备。', showCancel: false, confirmText: '我知道了' });
}
function showHelp() {
  uni.showModal({ title: '帮助与FAQ', content: '常见问题：\nQ: 这个应用收费吗？A: 基础功能完全免费。\nQ: 可以预测中奖吗？A: 不能。彩票开奖为随机事件。', showCancel: false, confirmText: '我知道了' });
}
function showFeedback() {
  uni.showModal({ title: '意见反馈', content: '', editable: true, placeholderText: '请输入您的意见或建议...', confirmText: '提交', cancelText: '取消', success: (res) => { if (res.confirm && res.content && res.content.trim()) uni.showToast({ title: '感谢您的反馈', icon: 'success' }); } });
}
function confirmClearCache() {
  uni.showModal({ title: '清除缓存', content: '此操作将永久删除您本地收藏的所有号码和设置数据，是否继续？', confirmColor: '#C41E3A', confirmText: '清除', cancelText: '取消', success: (res) => { if (res.confirm) { clearLocal(); fontSize.value = 'medium'; darkMode.value = false; uni.showToast({ title: '缓存已清除', icon: 'success' }); } } });
}
</script>

<style scoped>
.profile-page { min-height: 100vh; padding-bottom: 100rpx; background-color: #F8F8F8; }
.profile-page.dark { background-color: #1a1a1a; }
.profile-page.dark .content-area .section-card { background-color: #2a2a2a; }
.profile-page.dark .setting-label, .profile-page.dark .info-label, .profile-page.dark .section-title, .profile-page.dark .avatar-name, .profile-page.dark .danger-label { color: #e0e0e0; }
.profile-page.dark .info-value, .profile-page.dark .danger-desc, .profile-page.dark .footer-text text, .profile-page.dark .responsible-text text { color: #999999; }
.profile-page.dark .setting-item, .profile-page.dark .info-item { border-bottom-color: #3a3a3a; }
.profile-header { position: relative; padding: 40rpx 0 80rpx; overflow: hidden; }
.header-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #C41E3A, #E53935); border-radius: 0 0 40rpx 40rpx; }
.avatar-area { display: flex; flex-direction: column; align-items: center; gap: 12rpx; position: relative; z-index: 1; }
.avatar-wrapper { position: relative; }
.avatar-circle { width: 120rpx; height: 120rpx; border-radius: 60rpx; background-color: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(255,255,255,0.3); box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1); }
.avatar-inner { display: flex; align-items: center; justify-content: center; }
.avatar-letter { font-size: 36rpx; font-weight: 600; color: #ffffff; }
.avatar-badge { position: absolute; bottom: -4rpx; right: -8rpx; background-color: rgba(255,255,255,0.25); color: #ffffff; font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 12rpx; border: 1rpx solid rgba(255,255,255,0.3); }
.avatar-name { font-size: 36rpx; font-weight: 600; color: #ffffff; letter-spacing: 0.5rpx; }
.avatar-desc { font-size: 24rpx; color: rgba(255,255,255,0.7); }
.content-area { padding: 24rpx; margin-top: -40rpx; border-radius: 40rpx 40rpx 0 0; background-color: #F8F8F8; position: relative; z-index: 2; }
.section-card { background-color: #FFFFFF; border-radius: 20rpx; padding: 24rpx 32rpx; margin-bottom: 24rpx; box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02); }
.section-title-area { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.section-icon { width: 32rpx; height: 32rpx; border-radius: 8rpx; }
.icon-settings { background-color: #FFF5F5; border: 2rpx solid #C41E3A; }
.icon-info { background-color: #E3F2FD; border: 2rpx solid #1E88E5; }
.section-title { font-size: 28rpx; color: #9E9E9E; font-weight: 500; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #F5F5F5; transition: background-color 0.2s; }
.setting-item:last-child { border-bottom: none; }
.setting-item:active { background-color: #FAFAFA; }
.setting-left { display: flex; align-items: center; gap: 16rpx; }
.setting-icon-box { width: 48rpx; height: 48rpx; border-radius: 12rpx; background-color: #FFF5F5; display: flex; align-items: center; justify-content: center; }
.icon-fontsize { width: 24rpx; height: 24rpx; border: 2rpx solid #C41E3A; border-radius: 4rpx; position: relative; }
.icon-fontsize::after { content: ''; position: absolute; top: 6rpx; left: 4rpx; width: 16rpx; height: 2rpx; background-color: #C41E3A; }
.icon-fontsize::before { content: ''; position: absolute; top: 12rpx; left: 4rpx; width: 10rpx; height: 2rpx; background-color: #C41E3A; }
.icon-moon { width: 24rpx; height: 24rpx; border-radius: 50%; background-color: transparent; border: 2rpx solid #C41E3A; border-left-color: transparent; border-bottom-color: transparent; transform: rotate(-45deg); }
.setting-label { font-size: 30rpx; color: #333333; font-weight: 500; }
.font-size-options { display: flex; gap: 12rpx; }
.size-option { padding: 8rpx 24rpx; border-radius: 8rpx; background-color: #F5F5F5; border: 2rpx solid transparent; transition: all 0.2s; }
.size-option:active { transform: scale(0.97); }
.size-option.active { border-color: #C41E3A; background-color: #FFF5F5; }
.size-text { color: #666666; }
.size-option.active .size-text { color: #C41E3A; font-weight: 600; }
.toggle-switch { width: 88rpx; height: 48rpx; border-radius: 24rpx; background-color: #E0E0E0; position: relative; transition: background-color 0.3s; }
.toggle-switch.on { background-color: #C41E3A; }
.toggle-knob { width: 40rpx; height: 40rpx; border-radius: 50%; background-color: #ffffff; position: absolute; top: 4rpx; left: 4rpx; transition: transform 0.3s; box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1); }
.toggle-switch.on .toggle-knob { transform: translateX(40rpx); }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #F5F5F5; transition: background-color 0.2s; }
.info-item:last-child { border-bottom: none; }
.info-item:active { background-color: #FAFAFA; }
.info-left { display: flex; align-items: center; gap: 16rpx; }
.info-icon-box { width: 48rpx; height: 48rpx; border-radius: 12rpx; background-color: #E3F2FD; display: flex; align-items: center; justify-content: center; }
.icon-about { width: 20rpx; height: 20rpx; border: 2rpx solid #1E88E5; border-radius: 50%; }
.icon-privacy { width: 16rpx; height: 20rpx; border: 2rpx solid #1E88E5; border-radius: 4rpx; }
.icon-help { width: 20rpx; height: 20rpx; border: 2rpx solid #1E88E5; border-radius: 50%; position: relative; }
.icon-help::after { content: ''; position: absolute; top: 50%; left: 50%; width: 4rpx; height: 4rpx; background-color: #1E88E5; border-radius: 50%; transform: translate(-50%, -80%); }
.icon-help::before { content: ''; position: absolute; top: 50%; left: 50%; width: 2rpx; height: 6rpx; background-color: #1E88E5; transform: translate(-50%, 0); }
.icon-feedback { width: 20rpx; height: 16rpx; border: 2rpx solid #1E88E5; border-radius: 2rpx; position: relative; }
.icon-feedback::after { content: ''; position: absolute; bottom: -4rpx; right: -4rpx; width: 8rpx; height: 8rpx; border-radius: 50%; background-color: #1E88E5; }
.info-label { font-size: 30rpx; color: #333333; font-weight: 500; }
.info-value { font-size: 28rpx; color: #9E9E9E; }
.info-arrow { font-size: 28rpx; color: #BDBDBD; }
.danger-zone { border: 2rpx solid #FFE5E5; }
.danger-item { padding: 24rpx 0; display: flex; align-items: center; gap: 16rpx; transition: background-color 0.2s; }
.danger-item:active { background-color: #FFF5F5; }
.danger-left { display: flex; align-items: center; gap: 16rpx; }
.danger-icon-box { width: 48rpx; height: 48rpx; border-radius: 12rpx; background-color: #FFF5F5; display: flex; align-items: center; justify-content: center; }
.icon-trash { width: 20rpx; height: 24rpx; border: 2rpx solid #C41E3A; border-radius: 2rpx; position: relative; }
.icon-trash::after { content: ''; position: absolute; top: -4rpx; left: 50%; transform: translateX(-50%); width: 12rpx; height: 2rpx; background-color: #C41E3A; }
.danger-texts { display: flex; flex-direction: column; gap: 4rpx; }
.danger-label { font-size: 30rpx; color: #C41E3A; font-weight: 500; }
.danger-desc { font-size: 24rpx; color: #9E9E9E; }
.responsible-text { text-align: center; padding: 24rpx 0; }
.responsible-text text { font-size: 26rpx; color: #9E9E9E; }
.footer-text { text-align: center; padding-bottom: 40rpx; }
.footer-text text { font-size: 22rpx; color: #BDBDBD; }
</style>