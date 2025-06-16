import React, { FC, useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/Layout.tsx";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  CircularProgress,
} from "@mui/material";

import { TaskData } from "../../../types/interfaces.ts";
import { taskRepository } from "../../../repositories/taskRepository.ts"; // タスクリポジトリをインポート

// ★追加: DynamicList コンポーネントをインポート
import DynamicList from "../../../components/DynamicList.tsx";
// ★追加: TaskData のフィールド定義をインポート
import { taskFormFields } from "./TaskFormPage.tsx"; // TaskFormPage で定義したものを共有

interface TaskListPageProps {}

const TaskListPage: FC<TaskListPageProps> = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // タスクデータをロードする関数
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskRepository.getAll();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("タスクの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時にタスクをロード
  useEffect(() => {
    fetchTasks();
  }, []);

  // フィルタリングされたタスクリスト
  const filteredTasks = useMemo(() => {
    if (!searchTerm) {
      return tasks;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowercasedSearchTerm) ||
        task.description.toLowerCase().includes(lowercasedSearchTerm) ||
        task.assignee.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [tasks, searchTerm]);

  // タスク削除ハンドラ
  const handleDeleteTask = async (id: string) => {
    if (window.confirm("このタスクを本当に削除しますか？")) {
      setIsLoading(true);
      setError(null);
      try {
        await taskRepository.delete(id);
        alert("タスクが削除されました！");
        // 削除後にリストを再フェッチ
        fetchTasks();
      } catch (err) {
        console.error("Error deleting task:", err);
        setError("タスクの削除に失敗しました。");
        alert("エラーが発生しました: " + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // タスク編集ハンドラ (詳細またはフォームページへ遷移)
  const handleEditTask = (id: string) => {
    navigate(`/generic-db/tasks/${id}`); // 詳細ページへ遷移 (そこから編集も可能)
    // または直接編集フォームへ遷移するなら navigate(`/tasks/edit/${id}`); のようなパスも検討
  };

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Layout>
        <Box
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            タスクデータを読み込み中...
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
          <Typography variant="body1">エラー: {error}</Typography>
          <Button onClick={fetchTasks} variant="contained">
            再試行
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Box sx={{ flex: 1, paddingLeft: "20px" }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        既存のタスク ({filteredTasks.length} 件)
      </Typography>

      <TextField
        fullWidth
        label="タスク検索"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />
      {/* ★修正: DynamicList コンポーネントを使用 */}
      <DynamicList<TaskData>
        items={filteredTasks}
        fields={taskFormFields} // TaskData のフィールド定義を渡す
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        itemBasePath="/generic-db/tasks" // タスク詳細ページのベースパス
        listTitle="タスク" // DynamicList 内部で「既存のタスク」の文字列を生成
      />
    </Box>
  );
};

export default TaskListPage;
