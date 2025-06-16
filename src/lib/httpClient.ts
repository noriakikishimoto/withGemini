// APIのベースURLを定義
const API_BASE_URL = "http://localhost:8000"; // FastAPIサーバーのURL

/**
 * 汎用的なHTTPクライアント
 */
export const httpClient = {
  /**
   * GETリクエストを送信する
   * @param path APIのエンドポイントパス (例: '/applications')
   * @returns サーバーからのレスポンスデータ
   */
  get: async <T>(path: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "不明なエラー" }));
      throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.message}`);
    }
    return response.json() as Promise<T>;
  },

  /**
   * POSTリクエストを送信する
   * @param path APIのエンドポイントパス
   * @param data 送信するデータ
   * @returns サーバーからのレスポンスデータ
   */
  post: async <T>(path: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "不明なエラー" }));
      throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.message}`);
    }
    return response.json() as Promise<T>;
  },

  /**
   * PUTリクエストを送信する
   * @param path APIのエンドポイントパス
   * @param data 送信するデータ
   * @returns サーバーからのレスポンスデータ
   */
  put: async <T>(path: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "不明なエラー" }));
      throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.message}`);
    }
    return response.json() as Promise<T>;
  },

  /**
   * DELETEリクエストを送信する
   * @param path APIのエンドポイントパス
   */
  delete: async (path: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "不明なエラー" }));
      throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.message}`);
    }
    // DELETE は通常、レスポンスボディがない
  },
};
