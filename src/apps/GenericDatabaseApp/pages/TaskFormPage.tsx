// src/pages/TaskFormPage.tsx

import React, { FC, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DynamicForm from "../../../components/DynamicForm.tsx";
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx";
import MuiDatePickerWrapper from "../../../components/FormFields/MuiDatePickerWrapper.tsx";
import MuiCheckboxWrapper from "../../../components/FormFields/MuiCheckboxWrapper.tsx";
import MuiSelectFieldWrapper from "../../../components/FormFields/MuiSelectFieldWrapper.tsx";

import { FormField, TaskData, CommonFormFieldComponent } from "../../../types/interfaces.ts";
import { taskRepository } from "../../../repositories/taskRepository.ts"; // タスクリポジトリをインポート

import { Box, Typography, Button, Paper, CircularProgress } from "@mui/material"; // Paperはdivのようなもの、CircularProgressはローディング表示
import MuiUserSelectFieldWrapper from "../../../components/FormFields/MuiUserSelectFieldWrapper.tsx";

// 担当者の選択肢 (ここでは一旦ページ内で定義)
const assigneeOptions = [
  { value: "", label: "未定" },
  { value: "Alice", label: "アリス" },
  { value: "Bob", label: "ボブ" },
  { value: "Charlie", label: "チャーリー" },
];

// TaskData のフィールド定義
// DynamicForm に渡すためのスキーマ
export const taskFormFields: FormField<TaskData, CommonFormFieldComponent<any>>[] = [
  {
    name: "title",
    label: "タスク名",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
  },
  {
    name: "description",
    label: "詳細",
    type: "textarea",
    multiline: true,
    rows: 4,
    component: MuiTextFieldWrapper,
  },
  {
    name: "dueDate",
    label: "期限",
    type: "date",
    required: true,
    component: MuiDatePickerWrapper,
  },

  /*{
    name: "assignee",
    label: "担当者",
    type: "select",
    options: assigneeOptions,
    component: MuiSelectFieldWrapper,
  },
  */
  {
    name: "assignee",
    label: "担当者",
    type: "user_select",
    required: true,
    component: MuiUserSelectFieldWrapper,
    initialValue: "",
  },
  {
    name: "completed",
    label: "完了済",
    type: "checkbox",
    component: MuiCheckboxWrapper,
  },
];

interface TaskFormPageProps {
  // TaskFormPage は直接Propsを受け取らないが、App.tsxからidを渡すこともできる
  // あるいは useParams を使う
}

const TaskFormPage: FC<TaskFormPageProps> = () => {
  const { id } = useParams<{ id: string }>(); // URLからIDを取得 (編集モード用)
  const navigate = useNavigate();

  const [initialTaskData, setInitialTaskData] = useState<TaskData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!id); // IDがあれば初期ロード
  const [error, setError] = useState<string | null>(null);

  // 編集モードの場合、タスクデータをロード
  useEffect(() => {
    if (id) {
      const fetchTask = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await taskRepository.getById(id); // タスクリポジトリから取得
          if (data) {
            setInitialTaskData(data);
          } else {
            setError("指定されたタスクが見つかりません。");
          }
        } catch (err) {
          console.error("Error fetching task details:", err);
          setError("タスクデータの読み込みに失敗しました。");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTask();
    } else {
      setIsLoading(false); // 新規作成モード
    }
  }, [id]); // IDが変更されたら再実行

  const handleTaskSubmit = async (data: TaskData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (id) {
        // 編集モード
        await taskRepository.update(id, data);
        alert("タスクが更新されました！");
      } else {
        // 新規作成モード
        await taskRepository.create(data);
        alert("タスクが作成されました！");
      }
      navigate("/generic-db/tasks/list"); // 保存後はリストページに遷移
    } catch (err) {
      console.error("Error saving task:", err);
      setError("タスクの保存に失敗しました。");
      alert("エラーが発生しました: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/generic-db/tasks/list"); // キャンセル時はリストページに遷移
  };

  if (isLoading) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <p>タスクデータを読み込み中...</p>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <p>エラー: {error}</p>
        <Button onClick={() => navigate("/generic-db/tasks/list")} variant="contained">
          リストに戻る
        </Button>
      </Box>
    );
  }

  // データがロードされていないのに編集モード (idがある) の場合は表示しない
  if (id && !initialTaskData && !isLoading) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <p>指定されたタスクが見つかりません。</p>
        <Button onClick={() => navigate("/generic-db/tasks/list")} variant="contained">
          リストに戻る
        </Button>
      </Box>
    );
  }

  return (
    <DynamicForm<TaskData> // ★ジェネリクスに TaskData を指定
      fields={taskFormFields}
      initialData={initialTaskData}
      onSubmit={handleTaskSubmit}
      onCancel={handleCancel}
      formTitle={id ? "タスクを編集" : "新規タスク作成"}
      submitButtonText={id ? "変更を保存" : "タスクを作成"}
    />
  );
};

export default TaskFormPage;
