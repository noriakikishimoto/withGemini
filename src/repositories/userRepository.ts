import { User, BaseRepository, Identifiable } from "../types/interfaces";

const LOCAL_STORAGE_KEY = "users";

const localStorageUserRepository: BaseRepository<
  User,
  Omit<User, "id">,
  Partial<Omit<User, "id">>,
  void
> = {
  async getAll(): Promise<User[]> {
    console.log("Repository (LocalStorage User): データを読み込み中...");
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (storedUsers) {
      try {
        const parsedUsers: User[] = JSON.parse(storedUsers);
        return parsedUsers;
      } catch (error) {
        console.error("LocalStorage User 解析エラー:", error);
        return [];
      }
    }
    return [];
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find((user) => user.id === id) || null;
  },

  async create(data: Omit<User, "id">): Promise<User> {
    const users = await await this.getAll();
    // ユーザー名の一意性チェック
    if (users.some((user) => user.username === data.username)) {
      throw new Error(`ユーザー名 '${data.username}' は既に存在します。`);
    }

    const newUser: User = {
      id: String(Date.now()), // 簡易的なID生成
      username: data.username, // 明示的に指定
      displayName: data.displayName, // 明示的に指定
      email: data.email, // 明示的に指定
      password: data.password, // オプションなのでそのまま
      role: data.role || "user", // デフォルトロール
      // data に含まれるその他のカスタムプロパティもコピー
      ...data,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUsers));
    return newUser;
  },

  async update(id: string, data: Partial<Omit<User, "id">>): Promise<User> {
    const users = await this.getAll();
    let updatedUser: User | undefined;
    const updatedUsers = users
      .map((user) => {
        if (user.id === id) {
          // ユーザー名変更時の重複チェック (自分自身は除く)
          if (data.username && users.some((u) => u.id !== id && u.username === data.username)) {
            throw new Error(`ユーザー名 '${data.username}' は既に存在します。`);
          }

          updatedUser = { ...user, ...data };
          return updatedUser;
        }
        return user;
      })
      .filter((user): user is User => user !== undefined);

    if (!updatedUser) throw new Error("User not found for update");
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUsers));
    return updatedUser;
  },

  async delete(id: string): Promise<void> {
    const users = await this.getAll();
    const updatedUsers = users.filter((user) => user.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUsers));
  },
};

export const userRepository: BaseRepository<
  User,
  Omit<User, "id">,
  Partial<Omit<User, "id">>,
  void
> = localStorageUserRepository;
