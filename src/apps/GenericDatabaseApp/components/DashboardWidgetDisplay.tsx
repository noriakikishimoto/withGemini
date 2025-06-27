import { Box, CircularProgress, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";

import DynamicList from "../../../components/DynamicList.tsx"; // DynamicList をインポート
import { DashboardWidget, GenericRecord, User } from "../../../types/interfaces";
import { useAppData } from "../hooks/useAppData.ts";
import { useListSettings } from "../hooks/useListSettings.ts";
import ChartDisplay2 from "./ChartDisplay2.tsx";
import { userRepository } from "../../../repositories/userRepository.ts";

interface DashboardWidgetDisplayProps {
  widget: DashboardWidget<GenericRecord>;
}

const DashboardWidgetDisplay: FC<DashboardWidgetDisplayProps> = ({ widget }) => {
  const appId = widget.appId;
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { appSchema, records, customViews, isLoading, error, fetchData } = useAppData(appId);

  const {
    searchTerm,
    setSearchTerm,
    sortConditions,
    setSortConditions, // setSortConditions も公開
    handleSortConditionsChange,
    filterConditions,
    setFilterConditions, // setFilterConditions も公開
    handleFilterConditionsChange,
    selectedDisplayFields,
    setSelectedDisplayFields, // setSelectedDisplayFields も公開
    handleDisplayFieldsChange,
    filteredAndSortedRecords,
    fieldsForDynamicList,
    currentViewId,
    setCurrentViewId, // setCurrentViewId も公開
  } = useListSettings({ appId, appSchema, records, customViews, isLoading, allUsers });

  // ★追加: 全ユーザー情報をロードする useEffect
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await userRepository.getAll();
        setAllUsers(users);
      } catch (err) {
        console.error("Error loading users for display:", err);
      }
    };
    loadUsers();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
        <CircularProgress size={20} />
      </Box>
    );
  }
  if (error) {
    return (
      <Typography color="error" sx={{ textAlign: "center" }}>
        エラー: {error}
      </Typography>
    );
  }
  if (!appSchema) {
    return (
      <Typography color="textSecondary" sx={{ textAlign: "center" }}>
        スキーマが見つかりません。
      </Typography>
    );
  }
  if (!widget.appId) {
    return (
      <Typography color="textSecondary" sx={{ textAlign: "center" }}>
        対象アプリが設定されていません。
      </Typography>
    );
  }

  return (
    <>
      {widget.type === "list" ? (
        <DynamicList<GenericRecord>
          items={filteredAndSortedRecords}
          fields={fieldsForDynamicList}
          // List ウィジェットは読み取り専用なので、onEdit/onDelete はダミーまたは省略
          onEdit={() => console.log("Edit from dashboard list")}
          onDelete={() => console.log("Delete from dashboard list")}
          itemBasePath={`/generic-db/data/${widget.appId}`} // 適切なパスを設定
          listTitle={appSchema.name || "レコード"} // アプリ名をタイトルに
          onSortChange={() => {}} // 読み取り専用なのでソート変更は受け付けない
          currentSortConditions={widget.sortConditions}
          onFilterChange={() => {}} // 読み取り専用なのでフィルタ変更は受け付けない
          currentFilterConditions={widget.filterConditions}
          currentViewType="table" // ダッシュボード内のリストは常にテーブルビュー
        />
      ) : widget.type === "chart" ? (
        <ChartDisplay2 appSchema={appSchema} filteredAndSortedRecords={filteredAndSortedRecords} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          不明なウィジェットタイプまたは設定不足です。
        </Typography>
      )}
    </>
  );
};

export default DashboardWidgetDisplay;
