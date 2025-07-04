import { AppSchema, BaseRepositoryNotForApp } from "../types/interfaces"; // AppSchema と BaseRepository をインポート
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === "true"; // 環境変数は文字列として読み込まれる

const API_BASE_URL = "http://127.0.0.1:8000"; // FastAPIサーバーのURL

// ----------------------------------------------------
// 実装 1: ローカルストレージ版の AppSchema リポジトリ
// ----------------------------------------------------
const localStorageAppSchemaRepository: BaseRepositoryNotForApp<
  AppSchema,
  Omit<AppSchema, "id">,
  Partial<Omit<AppSchema, "id">>
> = {
  async getAll(): Promise<AppSchema[]> {
    console.log("Repository (LocalStorage AppSchema): データを読み込み中...");
    const storedAppSchemas = localStorage.getItem("appSchemas"); // キーを 'appSchemas' に設定
    if (storedAppSchemas) {
      try {
        const parsedSchemas: AppSchema[] = JSON.parse(storedAppSchemas);
        // JSON.parse() したデータは、型情報が失われているため、
        // getInitialValue などの関数は失われている。
        // DynamicForm で処理されるため、ここではそのまま返す。
        return parsedSchemas;
      } catch (error) {
        console.error("LocalStorage AppSchema 解析エラー:", error);
        return [];
      }
    }
    return [];
  },

  async getById(id: string): Promise<AppSchema | null> {
    const schemas = await this.getAll();
    return schemas.find((schema) => schema.id === id) || null;
  },

  async create(data: Omit<AppSchema, "id">, currentUserId?: string): Promise<AppSchema> {
    const schemas = await this.getAll();
    const now = new Date().toISOString(); // 現在日時
    const userId = currentUserId || "guest"; // ユーザーID (ゲストの場合は 'guest')

    const newSchema: AppSchema = {
      ...data,
      id: String(Date.now()),
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    }; // IDはここで生成
    const updatedSchemas = [...schemas, newSchema];
    localStorage.setItem("appSchemas", JSON.stringify(updatedSchemas));
    return newSchema;
  },

  async update(
    id: string,
    data: Partial<Omit<AppSchema, "id">>,
    currentUserId?: string
  ): Promise<AppSchema> {
    const schemas = await this.getAll();
    const now = new Date().toISOString(); // 現在日時
    const userId = currentUserId || "guest"; // ユーザーID (ゲストの場合は 'guest')

    let updatedSchema: AppSchema | undefined;
    const updatedSchemas = schemas
      .map((schema) => {
        if (schema.id === id) {
          updatedSchema = { ...schema, ...data, updatedAt: now, updatedBy: userId };
          return updatedSchema;
        }
        return schema;
      })
      .filter((schema): schema is AppSchema => schema !== undefined); // 型ガード

    if (!updatedSchema) throw new Error("AppSchema not found for update");
    localStorage.setItem("appSchemas", JSON.stringify(updatedSchemas));
    return updatedSchema;
  },

  async delete(id: string): Promise<void> {
    const schemas = await this.getAll();
    const updatedSchemas = schemas.filter((schema) => schema.id !== id);
    localStorage.setItem("appSchemas", JSON.stringify(updatedSchemas));
  },
};

// ----------------------------------------------------
// 実装 2: API（FastAPI）版の AppSchema リポジトリ (まだ仮実装)
// ----------------------------------------------------
// これらは httpClient を使って実装されるが、今はローカルストレージ版を使う
const backendApiAppSchemaRepository: BaseRepositoryNotForApp<
  AppSchema,
  Omit<AppSchema, "id">,
  Partial<Omit<AppSchema, "id">>
> = {
  async getAll(): Promise<AppSchema[]> {
    console.log("Repository (Backend API AppSchema): データを読み込み中...");
    try {
      const response = await fetch(`${API_BASE_URL}/app-schemas`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${errorData.detail || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching app schemas from API:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<AppSchema | null> {
    console.log(`Repository (Backend API AppSchema): ID ${id} のデータを読み込み中...`);
    try {
      const response = await fetch(`${API_BASE_URL}/app-schemas/${id}`);
      if (response.status === 404) {
        return null; // 404 の場合は見つからなかったとして null を返す
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${errorData.detail || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching app schema ID ${id} from API:`, error);
      throw error;
    }
  },

  async create(data: Omit<AppSchema, "id">): Promise<AppSchema> {
    console.log("Repository (Backend API AppSchema): データを作成中...", data);
    try {
      // id はバックエンドで生成されるので、ここでは含めない（バックエンドモデルの AppSchema に ID が含まれる場合）
      // しかし、現在のPydanticモデルはidを必須としているので、ダミーIDを渡す必要がある
      // バックエンド側でidを生成し、Pydanticモデルで id: Optional[str] = None に変更することも検討
      // 現状はフロントで生成したIDをそのまま使う
      const dataWithId = { ...data, id: data.id || String(Date.now()) }; // idが渡されない場合に生成

      const response = await fetch(`${API_BASE_URL}/app-schemas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataWithId), // Pydanticモデルが受け付けるように整形
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${errorData.detail || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating app schema via API:", error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Omit<AppSchema, "id">>): Promise<AppSchema> {
    console.log(`Repository (Backend API AppSchema): ID ${id} のデータを更新中...`, data);
    try {
      // 更新データにはIDを含めないのが一般的だが、FastAPIパスパラメータとボディのIDが一致する必要があるため、
      // ボディにもIDを含める（または、バックエンド側でボディのIDを無視するように実装変更）
      const dataWithId = { ...data, id: id };

      const response = await fetch(`${API_BASE_URL}/app-schemas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataWithId),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${errorData.detail || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error updating app schema ID ${id} via API:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    console.log(`Repository (Backend API AppSchema): ID ${id} のデータを削除中...`);
    try {
      const response = await fetch(`${API_BASE_URL}/app-schemas/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${errorData.detail || response.statusText}`);
      }
      // 204 No Content の場合は response.json() を呼び出さない
      if (response.status !== 204) {
        await response.json(); // エラーメッセージ取得のため
      }
    } catch (error) {
      console.error(`Error deleting app schema ID ${id} via API:`, error);
      throw error;
    }
  },
};

// ----------------------------------------------------
// 使用するアプリスキーマリポジトリの選択
// ----------------------------------------------------
// 環境変数に応じて、localStorage と Backend API を切り替え
export const appSchemaRepository: BaseRepositoryNotForApp<
  AppSchema,
  Omit<AppSchema, "id">,
  Partial<Omit<AppSchema, "id">>
> = USE_BACKEND_API ? backendApiAppSchemaRepository : localStorageAppSchemaRepository;
