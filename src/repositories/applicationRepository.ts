import { httpClient } from "../lib/httpClient";
import { ApplicationData, BaseRepositoryNotForApp } from "../types/interfaces";

// ----------------------------------------------------
// 実装 1: ローカルストレージ版のリポジトリ
// ----------------------------------------------------
const localStorageRepository: BaseRepositoryNotForApp<
  ApplicationData,
  Omit<ApplicationData, "id">,
  Partial<Omit<ApplicationData, "id">>
> = {
  async getAll(): Promise<ApplicationData[]> {
    console.log("Repository: ローカルストレージからデータを読み込み中...");
    const storedApplications = localStorage.getItem("applications");
    if (storedApplications) {
      try {
        return JSON.parse(storedApplications) as ApplicationData[];
      } catch (error) {
        console.error("ローカルストレージ解析エラー:", error);
        return [];
      }
    }
    return [];
  },

  async getById(id: string): Promise<ApplicationData | null> {
    const apps = await this.getAll();
    return apps.find((app) => app.id === id) || null;
  },

  async create(data: Omit<ApplicationData, "id">): Promise<ApplicationData> {
    const apps = await this.getAll();
    const newApp: ApplicationData = { ...data, id: Date.now().toString() };
    const updatedApps = [...apps, newApp];
    localStorage.setItem("applications", JSON.stringify(updatedApps));
    return newApp;
  },

  async update(id: string, data: Partial<Omit<ApplicationData, "id">>): Promise<ApplicationData> {
    const apps = await this.getAll();
    let updatedApp: ApplicationData | undefined;
    const updatedApps = apps.map((app) => {
      if (app.id === id) {
        updatedApp = { ...app, ...data };
        return updatedApp;
      }
      return app;
    });
    localStorage.setItem("applications", JSON.stringify(updatedApps));
    if (!updatedApp) throw new Error("Application not found for update");
    return updatedApp;
  },

  async delete(id: string): Promise<void> {
    const apps = await this.getAll();
    const updatedApps = apps.filter((app) => app.id !== id);
    localStorage.setItem("applications", JSON.stringify(updatedApps));
  },
};
// ----------------------------------------------------
// 実装 2: API（FastAPI）版のリポジトリ (httpClient を使用)
// ----------------------------------------------------
const apiRepository: BaseRepositoryNotForApp<
  ApplicationData,
  Omit<ApplicationData, "id">,
  Partial<Omit<ApplicationData, "id">>
> = {
  async getAll(): Promise<ApplicationData[]> {
    console.log("Repository (API): APIからデータを取得中...");
    return httpClient.get<ApplicationData[]>("/applications"); // httpClient の get メソッドを使用
  },

  async getById(id: string): Promise<ApplicationData | null> {
    console.log("Repository (API): APIから特定のデータを取得中...");
    try {
      return httpClient.get<ApplicationData>(`/applications/${id}`);
    } catch (error) {
      // 404 エラーの場合は null を返すなどの処理も可能
      console.error(`Error fetching application by id ${id}:`, error);
      return null;
    }
  },

  async create(data: Omit<ApplicationData, "id">): Promise<ApplicationData> {
    console.log("Repository (API): APIにデータを送信中...");
    return httpClient.post<ApplicationData>("/applications", data); // httpClient の post メソッドを使用
  },

  async update(id: string, data: Partial<Omit<ApplicationData, "id">>): Promise<ApplicationData> {
    console.log("Repository (API): APIにデータを更新中...");
    return httpClient.put<ApplicationData>(`/applications/${id}`, data); // httpClient の put メソッドを使用
  },

  async delete(id: string): Promise<void> {
    console.log("Repository (API): APIに削除リクエスト送信中...");
    return httpClient.delete(`/applications/${id}`); // httpClient の delete メソッドを使用
  },
};
// ----------------------------------------------------
// 使用するリポジトリの選択
// ここを変更するだけで、永続化層を切り替えられる！
// ----------------------------------------------------
export const applicationRepository = localStorageRepository;
// export const applicationRepository: ApplicationRepository = apiRepository; // API連携時に切り替える
