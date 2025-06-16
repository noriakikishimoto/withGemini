import { ApplicationData } from "../types/interfaces"; // 共通の型をインポート

// バックエンドのAPIエンドポイントのベースURL
// 後でFastAPIサーバーのURLに置き換えます
const API_BASE_URL = "http://localhost:8000"; // 仮のURL

/**
 * APIを呼び出して全ての申請データを取得する関数。
 * 現時点ではダミーデータを返します。
 */
export const fetchApplications = async (): Promise<ApplicationData[]> => {
  console.log("API: fetchApplications を呼び出し中...");
  // ★重要: 本物のAPIを呼ぶ代わりに、ダミーデータを返す、またはローカルストレージから読み込む
  // 現時点では、既存のローカルストレージのロジックを引き継ぎます
  const storedApplications = localStorage.getItem("applications");
  if (storedApplications) {
    try {
      return JSON.parse(storedApplications) as ApplicationData[];
    } catch (error) {
      console.error("API (Dummy): ローカルストレージの解析に失敗しました:", error);
      return []; // エラー時は空の配列
    }
  }
  return []; // デフォルトで空の配列を返す
};

/**
 * APIを呼び出して新規申請を作成する関数。
 * 現時点ではダミーのIDを付与してデータを返します。
 */
export const createApplication = async (data: Omit<ApplicationData, "id">): Promise<ApplicationData> => {
  console.log("API: createApplication を呼び出し中...", data);
  // ★重要: 本物のAPIを呼ぶ代わりに、ダミーのIDを付与してデータを返す
  const newApp: ApplicationData = {
    ...data,
    id: Date.now().toString(), // ダミーIDを生成
  };
  return newApp;
};

/**
 * APIを呼び出して既存申請を更新する関数。
 * 現時点では更新されたデータをそのまま返します。
 */
export const updateApplication = async (
  id: string,
  data: Partial<Omit<ApplicationData, "id">>
): Promise<ApplicationData> => {
  console.log("API: updateApplication を呼び出し中...", { id, data });
  // ★重要: 本物のAPIを呼ぶ代わりに、ダミーでIDを付与してデータを返す
  const updatedApp: ApplicationData = {
    id: id,
    title: data.title || "", // Partial なので undefined の可能性も考慮
    description: data.description || "",
    applicant: data.applicant || "",
  };
  return updatedApp;
};

/**
 * APIを呼び出して申請を削除する関数。
 * 現時点では何もせず解決します。
 */
export const deleteApplication = async (id: string): Promise<void> => {
  console.log("API: deleteApplication を呼び出し中...", id);
  // ★重要: 本物のAPIを呼ぶ代わりに、何もしない（Promiseを解決するだけ）
  return Promise.resolve();
};
