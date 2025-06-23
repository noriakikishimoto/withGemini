import SortIcon from "@mui/icons-material/Sort"; // ソートアイコン
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../components/Layout.tsx";
import { taskRepository } from "../../../repositories/taskRepository.ts"; // タスクリポジトリをインポート
import { SortCondition, TaskData } from "../../../types/interfaces.ts";

import DynamicList from "../../../components/DynamicList.tsx";
import { taskFormFields } from "./TaskFormPage.tsx"; // TaskFormPage で定義したものを共有

interface TaskListPageProps {}

const TaskListPage: FC<TaskListPageProps> = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  // ★修正: ソートの状態を SortCondition[] で管理
  const [sortConditions, setSortConditions] = useState<SortCondition<TaskData>[]>([]);

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
  /*
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
*/

  // ★修正: フィルタリングされたレコードリストにソートロジックを追加
  const filteredAndSortedTasks = useMemo(() => {
    let currentTasks = [...tasks]; // 元の配列を変更しないようにコピー

    // 1. フィルタリング
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      currentTasks = currentTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(lowercasedSearchTerm) ||
          task.description.toLowerCase().includes(lowercasedSearchTerm) ||
          task.assignee.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    // 2. ソート
    if (sortConditions.length > 0) {
      currentTasks.sort((a, b) => {
        for (const condition of sortConditions) {
          const aValue = String(a[condition.field] ?? "").toLowerCase();
          const bValue = String(b[condition.field] ?? "").toLowerCase();

          if (aValue < bValue) {
            return condition.direction === "asc" ? -1 : 1;
          }
          if (aValue > bValue) {
            return condition.direction === "asc" ? 1 : -1;
          }
        }
        return 0; // 全ての条件で同値の場合
      });
    }

    return currentTasks;
  }, [tasks, searchTerm, sortConditions]); // ★依存配列にソート関連のステートを追加

  // ★追加: ソート変更ハンドラ
  // ★追加: ソート条件変更ハンドラ (DynamicList に渡す)
  // ソート設定モーダルから呼び出されることを想定
  const handleSortConditionsChange = (newSortConditions: SortCondition<TaskData>[]) => {
    setSortConditions(newSortConditions);
  };

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
        既存のタスク ({filteredAndSortedTasks.length} 件)
      </Typography>

      <TextField
        fullWidth
        label="タスク検索"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <DynamicList<TaskData>
        items={filteredAndSortedTasks}
        fields={taskFormFields}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        itemBasePath="/generic-db/tasks"
        listTitle="タスク"
        onSortChange={handleSortConditionsChange} // ★修正: onSortChange を渡す
        currentSortConditions={sortConditions} // ★修正: currentSortConditions を渡す
      />
    </Box>
  );
};

export default TaskListPage;
