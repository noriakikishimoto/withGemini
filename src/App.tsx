import React, { useState, FC } from "react";
import "./App.css"; // グローバルCSS

//import { ApplicationData } from "./types/interfaces.ts";
//import ApplicationForm from "./apps/ApplicationApp/components/ApplicationForm.tsx";
//import ApplicationList from "./apps/ApplicationApp/components/ApplicationList.tsx";

import Layout from "./components/Layout.tsx";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
//import { useApplications } from "./hooks/useApplications";
//import ApplicationDetailPage from "./apps/ApplicationApp/components/ApplicationDetailPage.tsx";

//import TaskFormPage from "./apps/GenericDatabaseApp/pages/TaskFormPage.tsx";
//import TaskListPage from "./apps/GenericDatabaseApp/pages/TaskListPage.tsx";

import ApplicationAppRouter from "./apps/ApplicationApp/ApplicationAppRouter.tsx";
import GenericDatabaseAppRouter from "./apps/GenericDatabaseApp/GenericDatabaseAppRouter.tsx";

const App: FC = () => {
  return (
    <Layout>
      <Routes>
        {/* ★修正: /applications/* のパスを ApplicationAppRouter に任せる */}
        <Route path="/applications/*" element={<ApplicationAppRouter />} />

        {/* タスク管理のルートはそのまま残すか、後で GenericDatabaseAppRouter に移す */}
        <Route path="/generic-db/*" element={<GenericDatabaseAppRouter />} />

        <Route path="/" element={<Navigate to="/list" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
