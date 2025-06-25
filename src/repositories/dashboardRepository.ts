import { Dashboard, BaseRepository, Identifiable } from "../types/interfaces"; // Dashboard と BaseRepository をインポート

// Dashboard に appId は含まれないため、getAll, getById, delete, update の AppIdType は void に変更
// Dashboard 自体が Identifiable を継承しているので、id は自動的に含まれる

const LOCAL_STORAGE_KEY = "dashboards"; // LocalStorage に保存するキー

// ----------------------------------------------------
// 実装 1: ローカルストレージ版の Dashboard リポジトリ
// ----------------------------------------------------
const localStorageDashboardRepository: BaseRepository<
  Dashboard,
  Omit<Dashboard, "id">,
  Partial<Omit<Dashboard, "id">>,
  void
> = {
  async getAll(): Promise<Dashboard[]> {
    console.log("Repository (LocalStorage Dashboard): データを読み込み中...");
    const storedDashboards = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (storedDashboards) {
      try {
        const parsedDashboards: Dashboard[] = JSON.parse(storedDashboards);
        return parsedDashboards;
      } catch (error) {
        console.error("LocalStorage Dashboard 解析エラー:", error);
        return [];
      }
    }
    return [];
  },

  async getById(id: string): Promise<Dashboard | null> {
    const dashboards = await this.getAll();
    return dashboards.find((dashboard) => dashboard.id === id) || null;
  },

  async create(data: Omit<Dashboard, "id">): Promise<Dashboard> {
    const dashboards = await this.getAll();
    // 各ウィジェットに ID を付与 (UUID などを使用するのが理想だが、簡易的に Date.now)
    const newWidgets = data.widgets.map((widget) => ({
      ...widget,
      id: widget.id || String(Date.now() + Math.random()), // ウィジェットにもIDを付与
    }));

    const newDashboard: Dashboard = {
      ...data,
      id: String(Date.now()), // ダッシュボード自体にIDを付与
      widgets: newWidgets as Dashboard["widgets"], // 型キャスト
    };
    const updatedDashboards = [...dashboards, newDashboard];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDashboards));
    return newDashboard;
  },

  async update(id: string, data: Partial<Omit<Dashboard, "id">>): Promise<Dashboard> {
    const dashboards = await this.getAll();
    let updatedDashboard: Dashboard | undefined;
    const updatedDashboards = dashboards
      .map((dashboard) => {
        if (dashboard.id === id) {
          // ウィジェットのIDを保持しつつ更新
          const updatedWidgets = (data.widgets || dashboard.widgets).map((widget) => ({
            ...widget,
            id: widget.id || String(Date.now() + Math.random()), // 新規ウィジェットにはIDを付与
          }));

          updatedDashboard = {
            ...dashboard,
            ...data,
            widgets: updatedWidgets as Dashboard["widgets"],
          };
          return updatedDashboard;
        }
        return dashboard;
      })
      .filter((dashboard): dashboard is Dashboard => dashboard !== undefined);

    if (!updatedDashboard) throw new Error("Dashboard not found for update");
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDashboards));
    return updatedDashboard;
  },

  async delete(id: string): Promise<void> {
    const dashboards = await this.getAll();
    const updatedDashboards = dashboards.filter((dashboard) => dashboard.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDashboards));
  },
};

// ----------------------------------------------------
// 使用する Dashboard リポジトリの選択
// ----------------------------------------------------
export const dashboardRepository: BaseRepository<
  Dashboard,
  Omit<Dashboard, "id">,
  Partial<Omit<Dashboard, "id">>,
  void
> = localStorageDashboardRepository;
