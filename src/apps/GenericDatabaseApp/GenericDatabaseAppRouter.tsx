import React, { FC } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// 関連するページコンポーネントを新しいパスからインポート
// これらは今後 src/apps/GenericDatabaseApp/pages/ に移動する
import TaskFormPage from "./pages/TaskFormPage.tsx";
import TaskListPage from "./pages/TaskListPage.tsx";

import AppSchemaFormPage from "./pages/AppSchemaFormPage.tsx";
import AppSchemaListPage from "./pages/AppSchemaListPage.tsx";

import GenericDataListPage from "./pages/GenericDataListPage.tsx";
import GenericDataFormPage from "./pages/GenericDataFormPage.tsx";

const GenericDatabaseAppRouter: FC = () => {
  return (
    <Routes>
      {/* タスク管理アプリのルートを定義 */}
      {/* /generic-db/ の下の相対パスになる */}
      <Route path="tasks/new" element={<TaskFormPage />} />
      <Route path="tasks/list" element={<TaskListPage />} />
      <Route path="tasks/:id" element={<TaskFormPage />} /> {/* タスク詳細/編集 */}
      {/* ★追加: アプリスキーマ管理のルート */}
      <Route path="app-schemas/new" element={<AppSchemaFormPage />} />
      <Route path="app-schemas/list" element={<AppSchemaListPage />} />
      <Route path="app-schemas/:id" element={<AppSchemaFormPage />} /> {/* アプリスキーマ編集 */}
      {/* :appId をパスパラメータとして受け取り、GenericDataListPage/FormPage に渡す */}
      <Route path="data/:appId/list" element={<GenericDataListPage />} />
      <Route path="data/:appId/new" element={<GenericDataFormPage />} />
      <Route path="data/:appId/:recordId" element={<GenericDataFormPage />} /> {/* 編集モード */}
      {/* /generic-db/ にアクセスした場合のデフォルトのリダイレクト (例: /generic-db/tasks/list) */}
      <Route path="/" element={<Navigate to="tasks/list" replace />} />
    </Routes>
  );
};

export default GenericDatabaseAppRouter;
