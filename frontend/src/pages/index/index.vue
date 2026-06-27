<template>
  <view class="chat-page" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- Custom Header -->
    <view class="chat-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-content">
        <view class="header-avatar">
          <view class="avatar-ring">
            <text class="avatar-text">AI</text>
          </view>
        </view>
        <view class="header-title-area">
          <text class="header-title">福彩AI助手</text>
          <text class="header-subtitle">历史数据查询工具</text>
        </view>
      </view>
    </view>

    <!-- Chat Messages -->
    <view class="chat-container">
      <!-- Welcome Message -->
      <view class="message-row ai-row">
        <view class="avatar ai-avatar">
          <text class="avatar-text">AI</text>
        </view>
        <view class="message-bubble ai-bubble">
          <text class="message-text">欢迎体验福彩AI助手！我可以帮您查询开奖信息、历史数据和玩法规则。请直接提问，如"最近一期双色球开奖号码"。</text>
          <view class="bubble-disclaimer">
            <text class="disclaimer-small">本回复内容仅供参考，不构成任何投注建议。请理性购彩，量力而行。</text>
          </view>
        </view>
      </view>

      <!-- Message List -->
      <view
        v-for="(msg, index) in messages"
        :key="index"
        class="message-row"
        :class="msg.role === 'user' ? 'user-row' : 'ai-row'"
      >
        <view v-if="msg.role === 'assistant'" class="avatar ai-avatar">
          <text class="avatar-text">AI</text>
        </view>
        <view class="message-bubble" :class="msg.role === 'user' ? 'user-bubble' : 'ai-bubble'">
          <text v-if="msg.type === 'text' || !msg.type" class="message-text">{{ msg.content }}</text>
          <view v-else-if="msg.type === 'data'" class="data-content">
            <text class="message-text">{{ msg.content }}</text>
          </view>
          <view v-if="msg.role === 'assistant'" class="bubble-disclaimer">
            <text class="disclaimer-small">本回复内容仅供参考，不构成任何投注建议。请理性购彩，量力而行。</text>
          </view>
        </view>
        <view v-if="msg.role === 'user'" class="avatar user-avatar">
          <text class="avatar-text">我</text>
        </view>
      </view>

      <!-- Loading -->
      <view v-if="loading" class="message-row ai-row">
        <view class="avatar ai-avatar">
          <text class="avatar-text">AI</text>
        </view>
        <view class="message-bubble ai-bubble loading-bubble">
          <view class="loading-dots">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
        </view>
      </view>

      <!-- Bottom spacer -->
      <view class="bottom-spacer"></view>
    </view>

    <!-- Quick Actions -->
    <view class="quick-actions" v-if="showQuickActions">
      <scroll-view scroll-x class="quick-scroll" show-scrollbar="false">
        <view class="quick-list">
          <view
            v-for="(btn, i) in quickButtons"
            :key="i"
            class="quick-btn"
            @click="onQuickClick(btn)"
          >
            <view class="quick-icon" :class="btn.iconClass"></view>
            <text class="quick-btn-text">{{ btn.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Input Area -->
    <view class="input-area">
      <view class="input-box">
        <input
          v-model="inputText"
          class="chat-input"
          type="text"
          confirm-type="send"
          :placeholder="'请输入您的问题...'"
          placeholder-class="input-placeholder"
          @confirm="sendMessage"
        />
        <view class="send-btn" :class="{ active: inputText.trim() }" @click="sendMessage">
          <text class="send-text">发送</text>
        </view>
      </view>
      <view class="input-safe"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { sendChat } from '@/api/ai';
import { generateSessionId, setLocal, getLocal } from '@/utils/storage';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'data' | 'chart';
  data?: any;
}

const statusBarHeight = ref(0);
const inputText = ref('');
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const showQuickActions = ref(true);
const sessionId = ref('');

const quickButtons = [
  { label: '最近一期双色球', action: 'query', value: '最近一期双色球开奖号码', iconClass: 'icon-ball' },
  { label: '3D玩法规则', action: 'navigate', value: '/pages/rules/rules', iconClass: 'icon-rules' },
  { label: '走势图', action: 'navigate', value: '/pages/tools/trend', iconClass: 'icon-chart' },
  { label: '遗漏统计', action: 'navigate', value: '/pages/tools/omission', iconClass: 'icon-omit' },
  { label: '冷热分析', action: 'navigate', value: '/pages/tools/hotcold', iconClass: 'icon-hot' },
  { label: '综合分析', action: 'navigate', value: '/pages/analysis/analysis', iconClass: 'icon-analysis' },
];

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 0;

  const saved = getLocal<string>('chat_session');
  sessionId.value = saved || generateSessionId();
  if (!saved) {
    setLocal('chat_session', sessionId.value);
  }

  const history = getLocal<ChatMessage[]>('chat_history');
  if (history && history.length > 0) {
    messages.value = history;
    showQuickActions.value = false;
  }
});

function scrollToBottom() {
  nextTick(() => {
    uni.pageScrollTo({ scrollTop: 99999, duration: 300 });
  });
}

function onQuickClick(btn: typeof quickButtons[0]) {
  if (btn.action === 'query') {
    inputText.value = btn.value;
    sendMessage();
  } else if (btn.action === 'navigate') {
    uni.navigateTo({ url: btn.value });
  }
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  showQuickActions.value = false;
  loading.value = true;
  scrollToBottom();

  try {
    const history = messages.value.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const res = await sendChat({
      sessionId: sessionId.value,
      message: text,
      history: history.slice(-10),
    });

    if (res.code === 0 || res.code === 200) {
      const reply = res.data;
      messages.value.push({
        role: 'assistant',
        content: reply.reply,
        type: reply.type || 'text',
        data: reply.data,
      });
      setLocal('chat_history', messages.value.slice(-50));
    } else {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，服务暂时繁忙，请稍后再试。',
        type: 'text',
      });
    }
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: '网络连接异常，请检查网络后重试。',
      type: 'text',
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F8F8;
}

.chat-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(135deg, #C41E3A, #E53935);
  padding-bottom: 24rpx;
}

.header-content {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  gap: 16rpx;
}

.header-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 28rpx;
  background-color: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255,255,255,0.3);
}

.avatar-ring {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background-color: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 600;
}

.header-title-area {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 1rpx;
}

.header-subtitle {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 2rpx;
}

.chat-container {
  padding: 24rpx;
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  flex: 1;
  overflow-y: auto;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.user-row {
  justify-content: flex-end;
}

.ai-row {
  justify-content: flex-start;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
}

.ai-avatar {
  background: linear-gradient(135deg, #C41E3A, #E53935);
}

.user-avatar {
  background: linear-gradient(135deg, #F9A825, #FFB74D);
}

.avatar-text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 600;
}

.message-bubble {
  max-width: 70%;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  word-break: break-word;
  box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02);
}

.user-bubble {
  background: linear-gradient(135deg, #C41E3A, #E53935);
  border-bottom-right-radius: 4rpx;
}

.ai-bubble {
  background-color: #FFFFFF;
  border-left: 6rpx solid #C41E3A;
  border-bottom-left-radius: 4rpx;
}

.message-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: inherit;
  letter-spacing: 0.5rpx;
}

.user-bubble .message-text {
  color: #ffffff;
}

.ai-bubble .message-text {
  color: #333333;
}

.bubble-disclaimer {
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #F0F0F0;
}

.disclaimer-small {
  font-size: 22rpx;
  color: #9E9E9E;
  line-height: 1.5;
}

.data-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.data-box {
  background-color: #F8F8F8;
  padding: 16rpx;
  border-radius: 12rpx;
}

.data-text {
  font-size: 24rpx;
  color: #666666;
  font-family: monospace;
}

.loading-bubble {
  padding: 24rpx 32rpx;
}

.loading-dots {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #C41E3A;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.bottom-spacer {
  height: 40rpx;
}

.quick-actions {
  background-color: #FFFFFF;
  border-top: 1rpx solid #F0F0F0;
  padding: 16rpx 0;
}

.quick-scroll {
  white-space: nowrap;
}

.quick-list {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 24rpx;
}

.quick-btn {
  padding: 12rpx 24rpx;
  background-color: #FFF5F5;
  border: 2rpx solid #C41E3A;
  border-radius: 32rpx;
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;
}

.quick-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.quick-icon {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background-color: #C41E3A;
  flex-shrink: 0;
}

.quick-btn-text {
  font-size: 26rpx;
  color: #C41E3A;
  white-space: nowrap;
  font-weight: 500;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1rpx solid #F0F0F0;
  padding: 16rpx 24rpx;
  z-index: 100;
}

.input-box {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.chat-input {
  flex: 1;
  height: 72rpx;
  background-color: #F5F5F5;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333333;
}

.input-placeholder {
  font-size: 28rpx;
  color: #9E9E9E;
}

.send-btn {
  width: 100rpx;
  height: 72rpx;
  background-color: #E0E0E0;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease-out;
}

.send-btn.active {
  background-color: #C41E3A;
}

.send-btn:active {
  transform: scale(0.97);
}

.send-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

.input-safe {
  height: env(safe-area-inset-bottom);
}
</style>