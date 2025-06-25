import React, { FC, useState, useEffect, useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

import {
  AppSchema,
  GenericRecord,
  DashboardWidget,
  ChartType,
  ChartAggregationUnit,
} from "../../../types/interfaces";
import ChartDisplay from "./ChartDisplay.tsx"; // ChartDisplay をインポート
import { useWidgetData } from "../hooks/useWidgetData.ts"; // useWidgetData をインポート
import ChartDisplay2 from "./ChartDisplay2.tsx";
import { useListSettings } from "../hooks/useListSettings.ts";
import { useAppData } from "../hooks/useAppData.ts";

interface DashboardChartWidgetProps {
  widget: DashboardWidget<GenericRecord>;
}

const DashboardChartWidget: FC<DashboardChartWidgetProps> = ({ widget }) => {
  const appId = widget.appId;
  const { appSchema, records, customViews, isLoading, error, fetchData } = useAppData(appId);
  // ★追加: useListSettings からリスト関連のステートとハンドラを取得
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
  } = useListSettings({ appId, appSchema, records, customViews, isLoading });

  // ロード中/エラー表示
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
        アプリスキーマが見つかりません。
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

  return <ChartDisplay2 appSchema={appSchema} filteredAndSortedRecords={filteredAndSortedRecords} />;
};

export default DashboardChartWidget;
