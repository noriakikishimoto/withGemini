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

interface DashboardChartWidgetProps {
  widget: DashboardWidget<GenericRecord>;
  allAppSchemas: AppSchema[]; // useWidgetData に渡すため
}

const DashboardChartWidget: FC<DashboardChartWidgetProps> = ({ widget, allAppSchemas }) => {
  const { appSchema, filteredAndSortedRecords, isLoading, error } = useWidgetData({
    widget,
    allAppSchemas,
  });

  /*
  // グラフ化するフィールドが存在しない場合の表示
  if (!widget.chartField) {
    return (
      <Typography color="textSecondary" sx={{ textAlign: "center", mt: 2 }}>
        グラフ対象フィールドが設定されていません。
      </Typography>
    );
  }
    */

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
