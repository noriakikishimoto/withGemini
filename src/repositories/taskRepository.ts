import { TaskData, BaseRepository } from "../types/interfaces"; // TaskData と BaseRepository をインポート
import { httpClient } from "../lib/httpClient"; // httpClient をインポート

// ----------------------------------------------------
// 実装 1: ローカルストレージ版のタスクリポジトリ
// ----------------------------------------------------
const localStorageTaskRepository: BaseRepository<
  TaskData,
  Omit<TaskData, "id">,
  Partial<Omit<TaskData, "id">>
> = {
  async getAll(): Promise<TaskData[]> {
    console.log("Repository (LocalStorage Task): データを読み込み中...");
    const storedTasks = localStorage.getItem("tasks"); // キーを 'tasks' に変更
    if (storedTasks) {
      try {
        return JSON.parse(storedTasks) as TaskData[];
      } catch (error) {
        console.error("LocalStorage Task解析エラー:", error);
        return [];
      }
    }
    return [];
  },

  async getById(id: string): Promise<TaskData | null> {
    const tasks = await this.getAll();
    return tasks.find((task) => task.id === id) || null;
  },

  async create(data: Omit<TaskData, "id">): Promise<TaskData> {
    const tasks = await this.getAll();
    const newTask: TaskData = { ...data, id: String(Date.now()) }; // IDはここで生成
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem("tasks", JSON.stringify(updatedTasks)); // キーを 'tasks' に変更
    return newTask;
  },

  async update(id: string, data: Partial<Omit<TaskData, "id">>): Promise<TaskData> {
    const tasks = await this.getAll();
    let updatedTask: TaskData | undefined;
    const updatedTasks = tasks
      .map((task) => {
        if (task.id === id) {
          updatedTask = { ...task, ...data };
          return updatedTask;
        }
        return task;
      })
      .filter((task): task is TaskData => task !== undefined); // 型ガード

    if (!updatedTask) throw new Error("Task not found for update");
    localStorage.setItem("tasks", JSON.stringify(updatedTasks)); // キーを 'tasks' に変更
    return updatedTask;
  },

  async delete(id: string): Promise<void> {
    const tasks = await this.getAll();
    const updatedTasks = tasks.filter((task) => task.id !== id);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks)); // キーを 'tasks' に変更
  },
};

// ----------------------------------------------------
// 実装 2: API（FastAPI）版のタスクリポジトリ (まだ仮実装)
// ----------------------------------------------------
const apiTaskRepository: BaseRepository<
  TaskData,
  Omit<TaskData, "id">,
  Partial<Omit<TaskData, "id">>
> = {
  async getAll(): Promise<TaskData[]> {
    console.log("Repository (API Task): APIからデータを取得中...");
    return httpClient.get<TaskData[]>("/tasks"); // エンドポイントを /tasks に変更
  },

  async getById(id: string): Promise<TaskData | null> {
    console.log("Repository (API Task): APIから特定のデータを取得中...");
    try {
      return httpClient.get<TaskData>(`/tasks/${id}`);
    } catch (error) {
      console.error(`Error fetching task by id ${id}:`, error);
      return null;
    }
  },

  async create(data: Omit<TaskData, "id">): Promise<TaskData> {
    console.log("Repository (API Task): APIにデータを送信中...");
    return httpClient.post<TaskData>("/tasks", data);
  },

  async update(id: string, data: Partial<Omit<TaskData, "id">>): Promise<TaskData> {
    console.log("Repository (API Task): APIにデータを更新中...");
    return httpClient.put<TaskData>(`/tasks/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    console.log("Repository (API Task): APIに削除リクエスト送信中...");
    return httpClient.delete(`/tasks/${id}`);
  },
};

// ----------------------------------------------------
// 使用するタスクリポジトリの選択
// ----------------------------------------------------
export const taskRepository: BaseRepository<
  TaskData,
  Omit<TaskData, "id">,
  Partial<Omit<TaskData, "id">>
> = localStorageTaskRepository;
// export const taskRepository: BaseRepository<TaskData, Omit<TaskData, 'id'>, Partial<Omit<TaskData, 'id'>>> = apiTaskRepository;
