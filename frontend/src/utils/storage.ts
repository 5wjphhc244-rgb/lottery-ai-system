const PREFIX = 'lottery_ai_';

export function setLocal(key: string, value: any): void {
  try {
    uni.setStorageSync(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error', e);
  }
}

export function getLocal<T>(key: string): T | null {
  try {
    const data = uni.getStorageSync(PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function removeLocal(key: string): void {
  uni.removeStorageSync(PREFIX + key);
}

export function clearLocal(): void {
  uni.clearStorageSync();
}

export function generateSessionId(): string {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
