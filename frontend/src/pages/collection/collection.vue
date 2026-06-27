<template>
  <view class="collection-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="header-title">号码收藏</text>
      <text class="header-count" v-if="collections.length > 0">{{ collections.length }}/10</text>
    </view>

    <view class="content-area">
      <!-- 空状态 -->
      <view v-if="collections.length === 0 && !showPicker" class="empty-state">
        <view class="empty-illustration">
          <view class="lottery-icon">
            <view class="ticket-body">
              <view class="ticket-top">
                <view class="ticket-dot"></view>
                <view class="ticket-dot"></view>
                <view class="ticket-dot"></view>
              </view>
              <view class="ticket-line"></view>
              <view class="ticket-line short"></view>
            </view>
          </view>
        </view>
        <text class="empty-title">暂无收藏</text>
        <text class="empty-desc">点击下方按钮添加您收藏的号码组合</text>
        <text class="empty-hint">此处仅为您自行记录，不构成任何投注建议</text>
      </view>

      <!-- 收藏列表 -->
      <view v-else-if="!showPicker" class="collection-list">
        <view
          v-for="(item, index) in collections"
          :key="item.id"
          class="collection-card"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <view class="card-main">
            <view class="card-header">
              <view class="card-header-left">
                <view class="card-type-badge" :class="item.type">{{ getTypeName(item.type) }}</view>
                <text class="card-remark">{{ item.remark || '未命名组合' }}</text>
              </view>
              <text class="card-date">{{ formatDate(item.createdAt) }}</text>
            </view>
            <view class="numbers-display">
              <view v-for="(num, ni) in item.redBalls" :key="'r'+ni" class="number-ball red-ball">
                <text class="number-text">{{ num }}</text>
              </view>
              <view v-if="item.blueBall" class="number-ball blue-ball">
                <text class="number-text">{{ item.blueBall }}</text>
              </view>
            </view>
          </view>
          <view class="card-actions">
            <view class="action-btn edit-btn" @click="editItem(item, index)">
              <text class="action-text">编辑</text>
            </view>
            <view class="action-divider"></view>
            <view class="action-btn delete-btn" @click="deleteItem(index)">
              <text class="action-text">删除</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 选号界面 -->
      <view v-if="showPicker" class="picker-area">
        <!-- 彩种选择 -->
        <view class="picker-type-bar">
          <view
            v-for="t in lotteryTypes"
            :key="t.code"
            class="type-item"
            :class="{ active: pickerType === t.code }"
            @click="switchPickerType(t.code)"
          >
            <text class="type-text">{{ t.name }}</text>
          </view>
        </view>

        <!-- 已选号码展示 -->
        <view class="selected-area">
          <view class="selected-header">
            <text class="selected-title">已选号码</text>
            <text class="selected-count">{{ selectedRed.length }}/{{ requiredRed }}</text>
          </view>
          <view class="selected-balls">
            <view
              v-for="(num, i) in selectedRed"
              :key="'sr'+i"
              class="sel-ball sel-red"
              @click="toggleRed(num)"
            >
              <text>{{ num }}</text>
              <view class="remove-icon">&#10005;</view>
            </view>
            <view v-if="pickerType === 'ssq' || pickerType === 'qlc'" class="sel-divider"></view>
            <view
              v-if="pickerType === 'ssq' && selectedBlue"
              class="sel-ball sel-blue"
              @click="toggleBlue(selectedBlue)"
            >
              <text>{{ selectedBlue }}</text>
              <view class="remove-icon">&#10005;</view>
            </view>
          </view>
          <view v-if="selectedRed.length === 0 && !selectedBlue" class="selected-placeholder">
            <text>点击下方号码进行选择</text>
          </view>
        </view>

        <!-- 备注输入 -->
        <view class="remark-input-area">
          <text class="remark-label">备注</text>
          <input
            v-model="pickerRemark"
            class="remark-input"
            type="text"
            placeholder="如：守号组合1"
            placeholder-class="placeholder-style"
          />
        </view>

        <!-- 红球选择区 -->
        <view class="number-grid-area">
          <view class="grid-header">
            <text class="grid-title">{{ redTitle }}</text>
            <view class="grid-actions">
              <view class="grid-action-btn" @click="randomPick">
                <text class="grid-action-text">随机</text>
              </view>
              <view class="grid-action-btn clear-btn" @click="clearSelected">
                <text class="grid-action-text">清空</text>
              </view>
            </view>
          </view>
          <view class="number-grid">
            <view
              v-for="num in redNumbers"
              :key="num"
              class="grid-number"
              :class="{ selected: selectedRed.includes(num), disabled: isRedFull && !selectedRed.includes(num) }"
              @click="toggleRed(num)"
            >
              <text>{{ num }}</text>
            </view>
          </view>
        </view>

        <!-- 蓝球选择区（双色球/七乐彩） -->
        <view v-if="pickerType === 'ssq'" class="number-grid-area">
          <view class="grid-header">
            <text class="grid-title">蓝球（选1个）</text>
          </view>
          <view class="number-grid">
            <view
              v-for="num in blueNumbers"
              :key="num"
              class="grid-number"
              :class="{ selected: selectedBlue === num }"
              @click="toggleBlue(num)"
            >
              <text>{{ num }}</text>
            </view>
          </view>
        </view>

        <!-- 保存按钮 -->
        <view class="save-area">
          <view
            class="save-btn"
            :class="{ disabled: !canSave }"
            @click="saveCollection"
          >
            <text class="save-text">{{ editingIndex >= 0 ? '更新' : '保存' }}</text>
          </view>
          <view class="cancel-btn" @click="closePicker">
            <text class="cancel-text">取消</text>
          </view>
        </view>
      </view>

      <!-- 添加按钮（不在选号模式时显示） -->
      <view v-if="!showPicker" class="fab-area">
        <view class="fab-btn" @click="openPicker">
          <view class="fab-icon">
            <view class="plus-h"></view>
            <view class="plus-v"></view>
          </view>
          <text class="fab-text">添加号码</text>
        </view>
      </view>

      <view class="disclaimer-box" v-if="!showPicker">
        <text class="disclaimer-text">此处仅为您自行记录，不构成任何投注建议。购彩请至正规福彩销售点。</text>
      </view>
      <view class="responsible-text" v-if="!showPicker">
        <text>理性购彩，量力而行</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getLocal, setLocal } from '@/utils/storage';

interface CollectionItem {
  id: string;
  type: string;
  redBalls: string[];
  blueBall?: string;
  remark: string;
  createdAt: string;
}

interface LotteryType {
  code: string;
  name: string;
  redRange: number;
  redCount: number;
  blueRange?: number;
  blueCount?: number;
}

const lotteryTypes: LotteryType[] = [
  { code: 'ssq', name: '双色球', redRange: 33, redCount: 6, blueRange: 16, blueCount: 1 },
  { code: 'd3', name: '福彩3D', redRange: 10, redCount: 3 },
  { code: 'qlc', name: '七乐彩', redRange: 30, redCount: 7 },
  { code: 'kl8', name: '快乐8', redRange: 80, redCount: 20 },
];

const collections = ref<CollectionItem[]>([]);
const showPicker = ref(false);
const pickerType = ref('ssq');
const selectedRed = ref<string[]>([]);
const selectedBlue = ref<string>('');
const pickerRemark = ref('');
const editingIndex = ref(-1);

const currentType = computed(() => lotteryTypes.find(t => t.code === pickerType.value)!);
const requiredRed = computed(() => currentType.value.redCount);
const isRedFull = computed(() => selectedRed.value.length >= requiredRed.value);
const canSave = computed(() => {
  if (selectedRed.value.length < requiredRed.value) return false;
  if (currentType.value.blueCount && !selectedBlue.value) return false;
  return true;
});

const redTitle = computed(() => {
  const t = currentType.value;
  if (t.code === 'd3') return '选3个号码';
  if (t.code === 'kl8') return '选1-20个号码';
  return `红球（选${t.redCount}个）`;
});

const redNumbers = computed(() => {
  const t = currentType.value;
  const arr: string[] = [];
  for (let i = 1; i <= t.redRange; i++) {
    arr.push(String(i).padStart(2, '0'));
  }
  return arr;
});

const blueNumbers = computed(() => {
  if (!currentType.value.blueRange) return [];
  const arr: string[] = [];
  for (let i = 1; i <= currentType.value.blueRange; i++) {
    arr.push(String(i).padStart(2, '0'));
  }
  return arr;
});

onMounted(() => { loadCollections(); });

function loadCollections() {
  const data = getLocal<CollectionItem[]>('collections');
  if (data) collections.value = data;
}
function saveCollections() { setLocal('collections', collections.value); }

function getTypeName(code: string) {
  const t = lotteryTypes.find(x => x.code === code);
  return t ? t.name : code;
}

function openPicker() {
  editingIndex.value = -1;
  pickerType.value = 'ssq';
  selectedRed.value = [];
  selectedBlue.value = '';
  pickerRemark.value = '';
  showPicker.value = true;
}

function closePicker() {
  showPicker.value = false;
  selectedRed.value = [];
  selectedBlue.value = '';
  pickerRemark.value = '';
  editingIndex.value = -1;
}

function switchPickerType(code: string) {
  if (pickerType.value === code) return;
  pickerType.value = code;
  selectedRed.value = [];
  selectedBlue.value = '';
}

function toggleRed(num: string) {
  const idx = selectedRed.value.indexOf(num);
  if (idx >= 0) {
    selectedRed.value.splice(idx, 1);
  } else if (!isRedFull.value) {
    selectedRed.value.push(num);
    selectedRed.value.sort((a, b) => parseInt(a) - parseInt(b));
  }
}

function toggleBlue(num: string) {
  if (selectedBlue.value === num) {
    selectedBlue.value = '';
  } else {
    selectedBlue.value = num;
  }
}

function randomPick() {
  const t = currentType.value;
  const all = Array.from({ length: t.redRange }, (_, i) => String(i + 1).padStart(2, '0'));
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  selectedRed.value = all.slice(0, t.redCount).sort((a, b) => parseInt(a) - parseInt(b));
  if (t.blueRange) {
    selectedBlue.value = String(Math.floor(Math.random() * t.blueRange) + 1).padStart(2, '0');
  }
}

function clearSelected() {
  selectedRed.value = [];
  selectedBlue.value = '';
}

function saveCollection() {
  if (!canSave.value) return;
  const item: CollectionItem = {
    id: editingIndex.value >= 0 ? collections.value[editingIndex.value].id : 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type: pickerType.value,
    redBalls: [...selectedRed.value],
    blueBall: selectedBlue.value || undefined,
    remark: pickerRemark.value.trim(),
    createdAt: editingIndex.value >= 0 ? collections.value[editingIndex.value].createdAt : new Date().toISOString(),
  };
  if (editingIndex.value >= 0) {
    collections.value[editingIndex.value] = item;
  } else {
    collections.value.unshift(item);
  }
  saveCollections();
  closePicker();
  uni.showToast({ title: editingIndex.value >= 0 ? '更新成功' : '保存成功', icon: 'success' });
}

function editItem(item: CollectionItem, index: number) {
  editingIndex.value = index;
  pickerType.value = item.type;
  selectedRed.value = [...item.redBalls];
  selectedBlue.value = item.blueBall || '';
  pickerRemark.value = item.remark;
  showPicker.value = true;
}

function deleteItem(index: number) {
  uni.showModal({
    title: '确认删除', content: '确定要删除这条收藏吗？', confirmColor: '#C41E3A',
    success: (res) => { if (res.confirm) { collections.value.splice(index, 1); saveCollections(); uni.showToast({ title: '已删除', icon: 'success' }); } }
  });
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
</script>

<style scoped>
.collection-page { min-height: 100vh; padding-bottom: 100rpx; background-color: #F8F8F8; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 32rpx; background-color: #FFFFFF; border-bottom: 1rpx solid #F0F0F0; }
.header-title { font-size: 36rpx; font-weight: 600; color: #333333; letter-spacing: 0.5rpx; }
.header-count { font-size: 26rpx; color: #9E9E9E; background-color: #F5F5F5; padding: 4rpx 12rpx; border-radius: 12rpx; }
.content-area { padding: 24rpx; }

/* 空状态 */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80rpx 40rpx; margin-bottom: 24rpx; }
.empty-illustration { margin-bottom: 32rpx; }
.lottery-icon { width: 140rpx; height: 140rpx; border-radius: 70rpx; background: linear-gradient(135deg, #FFF5F5, #FFEBEE); display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 8rpx rgba(196,30,58,0.08); }
.ticket-body { width: 72rpx; height: 96rpx; background-color: #FFFFFF; border-radius: 8rpx; border: 2rpx solid #F0F0F0; display: flex; flex-direction: column; align-items: center; padding: 12rpx 8rpx; gap: 8rpx; }
.ticket-top { display: flex; gap: 6rpx; }
.ticket-dot { width: 8rpx; height: 8rpx; border-radius: 50%; background-color: #C41E3A; }
.ticket-line { width: 48rpx; height: 3rpx; background-color: #E0E0E0; border-radius: 2rpx; margin-top: 4rpx; }
.ticket-line.short { width: 32rpx; }
.empty-title { font-size: 32rpx; color: #333333; margin-bottom: 12rpx; font-weight: 600; letter-spacing: 0.5rpx; }
.empty-desc { font-size: 28rpx; color: #666666; margin-bottom: 16rpx; }
.empty-hint { font-size: 24rpx; color: #BDBDBD; }

/* 收藏列表 */
.collection-list { display: flex; flex-direction: column; gap: 20rpx; margin-bottom: 24rpx; }
.collection-card { background-color: #FFFFFF; border-radius: 20rpx; overflow: hidden; box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 4rpx 12rpx rgba(0,0,0,0.02); animation: fadeInUp 0.4s ease-out both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10rpx); } to { opacity: 1; transform: translateY(0); } }
.collection-card:active { transform: translateY(-2rpx); box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08); }
.card-main { padding: 24rpx 32rpx; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.card-header-left { display: flex; align-items: center; gap: 12rpx; }
.card-type-badge { font-size: 20rpx; padding: 2rpx 10rpx; border-radius: 8rpx; font-weight: 500; }
.card-type-badge.ssq { background-color: #FFF5F5; color: #C41E3A; }
.card-type-badge.d3 { background-color: #E3F2FD; color: #1E88E5; }
.card-type-badge.qlc { background-color: #FFF8E1; color: #F9A825; }
.card-type-badge.kl8 { background-color: #E8F5E9; color: #43A047; }
.card-remark { font-size: 30rpx; color: #333333; font-weight: 600; }
.card-date { font-size: 24rpx; color: #9E9E9E; }
.numbers-display { display: flex; flex-wrap: wrap; gap: 12rpx; }
.number-ball { width: 56rpx; height: 56rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.08); }
.number-ball.red-ball { background: linear-gradient(135deg, #C41E3A, #E53935); }
.number-ball.blue-ball { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.number-text { font-size: 24rpx; color: #ffffff; font-weight: 600; }
.card-actions { display: flex; border-top: 1rpx solid #F5F5F5; }
.action-btn { flex: 1; padding: 20rpx 0; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
.action-btn:active { background-color: #FAFAFA; }
.action-divider { width: 1rpx; background-color: #F0F0F0; }
.action-text { font-size: 28rpx; color: #666666; font-weight: 500; }
.delete-btn .action-text { color: #C41E3A; }
.edit-btn .action-text { color: #1E88E5; }

/* FAB */
.fab-area { display: flex; justify-content: center; padding: 24rpx 0; }
.fab-btn { display: flex; align-items: center; gap: 12rpx; padding: 20rpx 40rpx; background: linear-gradient(135deg, #C41E3A, #E53935); border-radius: 44rpx; box-shadow: 0 4rpx 16rpx rgba(196,30,58,0.2); transition: all 0.3s; }
.fab-btn:active { transform: scale(0.97); box-shadow: 0 2rpx 8rpx rgba(196,30,58,0.15); }
.fab-icon { width: 24rpx; height: 24rpx; position: relative; }
.plus-h { position: absolute; top: 50%; left: 0; width: 24rpx; height: 2rpx; background-color: #ffffff; transform: translateY(-50%); }
.plus-v { position: absolute; top: 0; left: 50%; width: 2rpx; height: 24rpx; background-color: #ffffff; transform: translateX(-50%); }
.fab-text { font-size: 30rpx; color: #ffffff; font-weight: 600; }

/* 选号界面 */
.picker-area { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.picker-type-bar { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
.type-item { flex: 1; padding: 16rpx 0; background-color: #FFFFFF; border-radius: 12rpx; text-align: center; border: 2rpx solid #F0F0F0; transition: all 0.2s; }
.type-item:active { transform: scale(0.97); }
.type-item.active { background-color: #FFF5F5; border-color: #C41E3A; }
.type-text { font-size: 26rpx; color: #666666; font-weight: 500; }
.type-item.active .type-text { color: #C41E3A; font-weight: 600; }

.selected-area { background-color: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 24rpx; box-shadow: 0 1rpx 3rpx rgba(0,0,0,0.04); }
.selected-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.selected-title { font-size: 28rpx; color: #333333; font-weight: 600; }
.selected-count { font-size: 24rpx; color: #9E9E9E; background-color: #F5F5F5; padding: 2rpx 10rpx; border-radius: 8rpx; }
.selected-balls { display: flex; flex-wrap: wrap; gap: 12rpx; align-items: center; }
.sel-ball { width: 56rpx; height: 56rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
.sel-ball text { font-size: 24rpx; color: #ffffff; font-weight: 600; }
.sel-red { background: linear-gradient(135deg, #C41E3A, #E53935); }
.sel-blue { background: linear-gradient(135deg, #1E88E5, #42A5F5); }
.remove-icon { position: absolute; top: -4rpx; right: -4rpx; width: 20rpx; height: 20rpx; border-radius: 50%; background-color: #666666; color: #ffffff; font-size: 12rpx; display: flex; align-items: center; justify-content: center; }
.sel-divider { width: 1rpx; height: 40rpx; background-color: #E0E0E0; margin: 0 4rpx; }
.selected-placeholder { text-align: center; padding: 16rpx 0; }
.selected-placeholder text { font-size: 26rpx; color: #BDBDBD; }

.remark-input-area { background-color: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 24rpx; }
.remark-label { font-size: 28rpx; color: #333333; font-weight: 600; margin-bottom: 12rpx; display: block; }
.remark-input { height: 80rpx; background-color: #F8F8F8; border-radius: 12rpx; padding: 0 24rpx; font-size: 28rpx; color: #333333; }
.placeholder-style { font-size: 26rpx; color: #BDBDBD; }

.number-grid-area { background-color: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 24rpx; }
.grid-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.grid-title { font-size: 28rpx; color: #333333; font-weight: 600; }
.grid-actions { display: flex; gap: 12rpx; }
.grid-action-btn { padding: 8rpx 20rpx; background-color: #F5F5F5; border-radius: 8rpx; transition: all 0.2s; }
.grid-action-btn:active { transform: scale(0.97); background-color: #E0E0E0; }
.grid-action-text { font-size: 24rpx; color: #666666; font-weight: 500; }
.clear-btn { background-color: #FFF5F5; }
.clear-btn .grid-action-text { color: #C41E3A; }
.number-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.grid-number { width: 72rpx; height: 72rpx; border-radius: 50%; background-color: #F5F5F5; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border: 2rpx solid transparent; }
.grid-number text { font-size: 28rpx; color: #666666; font-weight: 500; }
.grid-number.selected { background: linear-gradient(135deg, #C41E3A, #E53935); border-color: #C41E3A; box-shadow: 0 2rpx 8rpx rgba(196,30,58,0.2); }
.grid-number.selected text { color: #ffffff; font-weight: 600; }
.grid-number.disabled { opacity: 0.4; }
.grid-number:active { transform: scale(0.95); }

.save-area { display: flex; flex-direction: column; gap: 16rpx; padding: 24rpx 0; }
.save-btn { height: 96rpx; background: linear-gradient(135deg, #C41E3A, #E53935); border-radius: 48rpx; display: flex; align-items: center; justify-content: center; transition: all 0.3s; box-shadow: 0 4rpx 16rpx rgba(196,30,58,0.2); }
.save-btn.disabled { background: linear-gradient(135deg, #E0E0E0, #BDBDBD); box-shadow: none; }
.save-btn:not(.disabled):active { transform: scale(0.97); }
.save-text { font-size: 32rpx; color: #ffffff; font-weight: 600; }
.cancel-btn { height: 88rpx; background-color: #FFFFFF; border-radius: 44rpx; display: flex; align-items: center; justify-content: center; border: 2rpx solid #F0F0F0; transition: all 0.2s; }
.cancel-btn:active { background-color: #FAFAFA; transform: scale(0.97); }
.cancel-text { font-size: 30rpx; color: #666666; font-weight: 500; }

.disclaimer-box { background-color: #FFF8E1; border-left: 4rpx solid #F9A825; padding: 16rpx 24rpx; margin-bottom: 16rpx; border-radius: 0 12rpx 12rpx 0; }
.disclaimer-text { font-size: 22rpx; color: #666666; line-height: 1.6; letter-spacing: 0.5rpx; }
.responsible-text { text-align: center; padding: 24rpx 0; }
.responsible-text text { font-size: 26rpx; color: #9E9E9E; }
</style>
