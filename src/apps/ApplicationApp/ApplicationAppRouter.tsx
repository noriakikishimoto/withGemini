// src/apps/ApplicationApp/ApplicationAppRouter.tsx

import React, { FC, useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

// 関連するコンポーネントとリポジトリを新しいパスからインポート
import ApplicationForm from "./components/ApplicationForm.tsx";
import ApplicationList from "./components/ApplicationList.tsx";
import ApplicationDetailPage from "./components/ApplicationDetailPage.tsx"; // components/ApplicationDetailPage.tsx から移動

import { applicationRepository } from "../../repositories/applicationRepository"; // リポジトリは共通パスから
import { ApplicationData } from "../../types/interfaces"; // 型も共通パスから
import { useApplications } from "../../hooks/useApplications"; // useApplications フックも共通パスから

// ApplicationAppRouter は Layout で囲まれるため、Layout は不要
// <Layout> は App.tsx が担当します

const ApplicationAppRouter: FC = () => {
  // App.tsx から移動した申請管理に関する全てのステートとロジック
  const {
    applications,
    isLoading: isAppLoading,
    error: appError,
    addApplication,
    updateApplication,
    deleteApplication,
  } = useApplications();
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const navigate = useNavigate();

  const editingApplication = editingApplicationId
    ? applications.find((app) => app.id === editingApplicationId) || null
    : null;

  const handleSaveApplication = async (formData: Omit<ApplicationData, "id">) => {
    try {
      if (editingApplicationId) {
        await updateApplication(editingApplicationId, formData);
        setEditingApplicationId(null);
        alert("申請が更新されました！");
      } else {
        await addApplication(formData);
        alert("申請が保存されました！");
      }
      navigate("list"); // ★修正: 相対パスに変更 /applications/list
    } catch (err) {
      alert("エラーが発生しました: " + (err as Error).message);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteApplication(id);
      if (editingApplicationId === id) {
        setEditingApplicationId(null);
        navigate("new"); // ★修正: 相対パスに変更 /applications/new
      }
      alert("申請が削除されました。");
    } catch (err) {
      alert("エラーが発生しました: " + (err as Error).message);
    }
  };

  const handleEditApplication = (id: string) => {
    setEditingApplicationId(id);
    navigate("new"); // ★修正: 相対パスに変更 /applications/new
  };

  const handleCancelEdit = () => {
    setEditingApplicationId(null);
    navigate("list"); // ★修正: 相対パスに変更 /applications/list
  };

  // ローディング中とエラー表示（Layout は App.tsx が提供）
  if (isAppLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>申請データを読み込み中...</p>
      </div>
    );
  }

  if (appError) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <p>申請エラー: {appError}</p>
        <button onClick={() => window.location.reload()}>再試行</button>
      </div>
    );
  }

  return (
    <Routes>
      {/* /applications の下の相対パスになる */}
      <Route
        path="new"
        element={
          <ApplicationForm
            onSubmit={handleSaveApplication}
            initialData={editingApplication}
            onCancelEdit={handleCancelEdit}
          />
        }
      />

      <Route
        path="list"
        element={
          <ApplicationList
            applications={applications}
            onDelete={handleDeleteApplication}
            onEdit={handleEditApplication}
          />
        }
      />

      <Route path=":id" element={<ApplicationDetailPage onEditProps={handleEditApplication} />} />

      {/* /applications/ にアクセスした場合のデフォルトのリダイレクト */}
      <Route path="/" element={<Navigate to="list" replace />} />
    </Routes>
  );
};

export default ApplicationAppRouter;
