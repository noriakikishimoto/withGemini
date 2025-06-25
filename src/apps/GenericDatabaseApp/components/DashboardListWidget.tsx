import React, { FC, useState, useEffect, useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

import {
  AppSchema,
  GenericRecord,
  FormField,
  CommonFormFieldComponent,
  DashboardWidget,
} from "../../../types/interfaces";
import DynamicList from "../../../components/DynamicList.tsx"; // DynamicList をインポート
import { getFieldComponentByType } from "../utils/fieldComponentMapper"; // ヘルパー関数をインポート
import { useWidgetData } from "../hooks/useWidgetData.ts"; // useWidgetData をインポート

interface DashboardListWidgetProps {
  widget: DashboardWidget<GenericRecord>;
  allAppSchemas: AppSchema[]; // useWidgetData に渡すため
}

const DashboardListWidget: FC<DashboardListWidgetProps> = ({ widget, allAppSchemas }) => {
  const { appSchema, filteredAndSortedRecords, isLoading, error } = useWidgetData({
    widget,
    allAppSchemas,
  });

  // DynamicList に渡す fields を変換 (表示列フィルタリングも適用)
  const fieldsForDynamicList = useMemo(() => {
    if (!appSchema) return [];
    const fieldsToDisplay =
      widget.displayFields && widget.displayFields.length > 0
        ? appSchema.fields.filter((field) =>
            widget.displayFields!.includes(field.name as keyof GenericRecord)
          )
        : appSchema.fields;

    return fieldsToDisplay.map((field) => ({
      ...field,
      component: getFieldComponentByType(field.type),
    })) as FormField<GenericRecord, CommonFormFieldComponent<any>>[];
  }, [appSchema, widget.displayFields]);

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
  );
};

export default DashboardListWidget;
