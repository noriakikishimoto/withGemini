import { AppSchema, BaseRepositoryNotForApp } from "../types/interfaces"; // AppSchema と BaseRepository をインポート

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
const apiAppSchemaRepository: BaseRepositoryNotForApp<
  AppSchema,
  Omit<AppSchema, "id">,
  Partial<Omit<AppSchema, "id">>
> = {
  async getAll(): Promise<AppSchema[]> {
    console.log("Repository (API AppSchema): APIからデータを取得中...");
    // return httpClient.get<AppSchema[]>('/app-schemas');
    return localStorageAppSchemaRepository.getAll(); // ★API連携までローカルストレージ版を呼ぶ
  },
  async getById(id: string): Promise<AppSchema | null> {
    console.log("Repository (API AppSchema): APIから特定のデータを取得中...");
    // return httpClient.get<AppSchema>(`/app-schemas/${id}`);
    return localStorageAppSchemaRepository.getById(id);
  },
  async create(data: Omit<AppSchema, "id">): Promise<AppSchema> {
    console.log("Repository (API AppSchema): APIにデータを送信中...");
    // return httpClient.post<AppSchema>('/app-schemas', data);
    return localStorageAppSchemaRepository.create(data);
  },
  async update(id: string, data: Partial<Omit<AppSchema, "id">>): Promise<AppSchema> {
    console.log("Repository (API AppSchema): APIにデータを更新中...");
    // return httpClient.put<AppSchema>(`/app-schemas/${id}`, data);
    return localStorageAppSchemaRepository.update(id, data);
  },
  async delete(id: string): Promise<void> {
    console.log("Repository (API AppSchema): APIに削除リクエスト送信中...");
    // return httpClient.delete(`/app-schemas/${id}`);
    return localStorageAppSchemaRepository.delete(id);
  },
};

// ----------------------------------------------------
// 使用する AppSchema リポジトリの選択
// ----------------------------------------------------
export const appSchemaRepository: BaseRepositoryNotForApp<
  AppSchema,
  Omit<AppSchema, "id">,
  Partial<Omit<AppSchema, "id">>
> = localStorageAppSchemaRepository;
// export const appSchemaRepository = apiAppSchemaRepository; // バックエンド連携時に切り替える
