import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { FC, useEffect, useMemo, useState } from "react";

// 共通の型定義をインポート
import { AppSchema, GenericRecord } from "../../../types/interfaces";
import GenericChart from "./GenericChart.tsx"; // GenericChart をインポート

// ChartDisplay が受け取る Props
interface ChartDisplayProps {
  appSchema: AppSchema | null;
  filteredAndSortedRecords: GenericRecord[]; // フィルタリング・ソート済みのレコードデータ
}

const ChartDisplay: FC<ChartDisplayProps> = ({ appSchema, filteredAndSortedRecords }) => {
  // グラフ表示対象フィールドのステート (ChartDisplay 内部で管理)
  const [selectedChartField, setSelectedChartField] = useState<keyof GenericRecord | undefined>(
    undefined
  );

  // グラフ表示用データの集計ロジック
  const chartData = useMemo(() => {
    if (
      !appSchema ||
      !selectedChartField ||
      !filteredAndSortedRecords ||
      filteredAndSortedRecords.length === 0
    )
      return [];

    const fieldDef = appSchema.fields.find((f) => f.name === selectedChartField);
    if (
      !fieldDef ||
      (fieldDef.type !== "select" && fieldDef.type !== "radio" && fieldDef.type !== "checkbox")
    ) {
      // グラフ化に適さないフィールドタイプの場合は空を返す
      return [];
    }

    const counts: Record<string, number> = {};
    filteredAndSortedRecords.forEach((record) => {
      const value = String(record[selectedChartField] ?? "");
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name: name || "(未設定)", value }));
  }, [filteredAndSortedRecords, appSchema, selectedChartField]);

  // グラフ化可能なフィールドのリスト (ドロップダウン用)
  const chartableFields = useMemo(() => {
    if (!appSchema) return [];
    return appSchema.fields.filter(
      (f) => f.type === "select" || f.type === "radio" || f.type === "checkbox"
    );
  }, [appSchema]);

  // selectedChartField の初期化ロジック
  useEffect(() => {
    if (appSchema && chartableFields.length > 0 && selectedChartField === undefined) {
      setSelectedChartField(chartableFields[0].name as keyof GenericRecord);
    } else if (appSchema && chartableFields.length === 0 && selectedChartField !== undefined) {
      setSelectedChartField(undefined);
    }
  }, [appSchema, chartableFields, selectedChartField]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
      {appSchema && chartableFields.length > 0 ? (
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>グラフ化するフィールド</InputLabel>
          <Select
            value={selectedChartField || ""}
            label="グラフ化するフィールド"
            onChange={(e) => setSelectedChartField(e.target.value as keyof GenericRecord)}
          >
            {chartableFields.map((field) => (
              <MenuItem key={field.name as string} value={field.name as string}>
                {field.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography variant="body2" color="text.secondary">
          グラフ化できる選択肢/ラジオボタン/チェックボックスタイプのフィールドがありません。
        </Typography>
      )}
      {selectedChartField ? (
        <GenericChart
          title={`「${appSchema?.fields.find((f) => f.name === selectedChartField)?.label || selectedChartField}」の分布`}
          data={chartData}
          chartType="pie" // デフォルトは円グラフ
        />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          グラフ化するフィールドを選択してください。
        </Typography>
      )}
    </Box>
  );
};

export default ChartDisplay;
