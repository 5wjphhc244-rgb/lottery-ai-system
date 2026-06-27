const BASE_URL = 'http://localhost:3000/api';

export function request<T>(options: UniApp.RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

export function get<T>(url: string, data?: any): Promise<T> {
  return request<T>({ url, data, method: 'GET' });
}

export function post<T>(url: string, data?: any): Promise<T> {
  return request<T>({ url, data, method: 'POST' });
}
