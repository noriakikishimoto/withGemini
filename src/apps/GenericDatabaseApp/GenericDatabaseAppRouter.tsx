import React, { FC } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// 関連するページコンポーネントを新しいパスからインポート
// これらは今後 src/apps/GenericDatabaseApp/pages/ に移動する
import TaskFormPage from "./pages/TaskFormPage.tsx";
import TaskListPage from "./pages/TaskListPage.tsx";

const GenericDatabaseAppRouter: FC = () => {
  return (
    <Routes>
      {/* タスク管理アプリのルートを定義 */}
      {/* /generic-db/ の下の相対パスになる */}
      <Route path="tasks/new" element={<TaskFormPage />} />
      <Route path="tasks/list" element={<TaskListPage />} />
      <Route path="tasks/:id" element={<TaskFormPage />} /> {/* タスク詳細/編集 */}
      {/* /generic-db/ にアクセスした場合のデフォルトのリダイレクト (例: /generic-db/tasks/list) */}
      <Route path="/" element={<Navigate to="tasks/list" replace />} />
    </Routes>
  );
};

export default GenericDatabaseAppRouter;
