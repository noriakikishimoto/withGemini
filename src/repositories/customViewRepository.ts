import { CustomView, BaseRepository } from "../types/interfaces"; // CustomView と BaseRepository をインポート

// ----------------------------------------------------
// 実装 1: ローカルストレージ版の CustomView リポジトリ
// ----------------------------------------------------
const localStorageCustomViewRepository: BaseRepository<
  CustomView<any>,
  Omit<CustomView<any>, "id">,
  Partial<Omit<CustomView<any>, "id">>,
  string
> = {
  // AppIdType を string に
  async getAll(appId: string): Promise<CustomView<any>[]> {
    console.log("Repository (LocalStorage CustomView): データを読み込み中...");
    const storedViews = localStorage.getItem("customViews"); // 全てのビューを1つのキーで管理

    if (storedViews) {
      try {
        const parsedViews: CustomView<any>[] = JSON.parse(storedViews);
        // appId が指定されていればフィルタリングして返す
        if (appId) {
          return parsedViews.filter((view) => view.appId === appId);
        }
        return parsedViews;
      } catch (error) {
        console.error("LocalStorage CustomView 解析エラー:", error);
        return [];
      }
    }
    return [];
  },

  async getById(id: string, appId: string): Promise<CustomView<any> | null> {
    const views = await this.getAll(appId);
    return views.find((view) => view.id === id) || null;
  },

  async create(
    data: Omit<CustomView<any>, "id">,
    appId: string,
    currentUserId?: string
  ): Promise<CustomView<any>> {
    const views = await this.getAll();
    const now = new Date().toISOString(); // 現在日時
    const userId = currentUserId || "guest"; // ユーザーID (ゲストの場合は 'guest')

    const newView: CustomView<any> = {
      ...data,
      id: String(Date.now()),
      appId: appId,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    }; // appId を付与
    const updatedViews = [...views, newView];
    localStorage.setItem("customViews", JSON.stringify(updatedViews));
    return newView;
  },

  async update(
    id: string,
    data: Partial<Omit<CustomView<any>, "id">>,
    appId: string,
    currentUserId?: string
  ): Promise<CustomView<any>> {
    const views = await this.getAll();
    const now = new Date().toISOString(); // 現在日時
    const userId = currentUserId || "guest"; // ユーザーID (ゲストの場合は 'guest')

    let updatedView: CustomView<any> | undefined;
    const updatedViews = views
      .map((view) => {
        if (view.id === id) {
          updatedView = { ...view, ...data, updatedAt: now, updatedBy: userId };
          return updatedView;
        }
        return view;
      })
      .filter((view): view is CustomView<any> => view !== undefined);

    if (!updatedView) throw new Error("CustomView not found for update");
    localStorage.setItem("customViews", JSON.stringify(updatedViews));
    return updatedView;
  },

  async delete(id: string, appId?: string): Promise<void> {
    const views = await this.getAll();
    const updatedViews = views.filter((view) => view.id !== id);
    localStorage.setItem("customViews", JSON.stringify(updatedViews));
  },
};

// ----------------------------------------------------
// 使用する CustomView リポジトリの選択
// ----------------------------------------------------
export const customViewRepository: BaseRepository<
  CustomView<any>,
  Omit<CustomView<any>, "id">,
  Partial<Omit<CustomView<any>, "id">>,
  string
> = localStorageCustomViewRepository;
