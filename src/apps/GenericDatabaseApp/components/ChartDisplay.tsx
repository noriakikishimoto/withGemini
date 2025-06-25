import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { FC, useEffect, useMemo, useState } from "react";

// 共通の型定義をインポート
import dayjs from "dayjs";
import { AppSchema, ChartType, GenericRecord } from "../../../types/interfaces";
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
  const [dateAggregationUnit, setDateAggregationUnit] = useState<"day" | "month" | "year">("month");
  const [userSelectedChartType, setUserSelectedChartType] = useState<ChartType | undefined>(undefined);

  const selectedFieldDef = useMemo(() => {
    if (!selectedChartField || !appSchema) return null;
    return appSchema.fields.find((f) => f.name === selectedChartField) || null;
  }, [selectedChartField, appSchema]);

  // グラフ表示用データの集計ロジック
  const chartData = useMemo(() => {
    if (
      !appSchema ||
      !selectedChartField ||
      !filteredAndSortedRecords ||
      filteredAndSortedRecords.length === 0
    )
      return [];

    if (!selectedFieldDef) return [];

    // ★修正: フィールドタイプに応じた集計ロジック
    if (
      selectedFieldDef.type === "select" ||
      selectedFieldDef.type === "radio" ||
      selectedFieldDef.type === "checkbox"
    ) {
      // カテゴリデータの集計 (既存ロジック)
      const counts: Record<string, number> = {};
      filteredAndSortedRecords.forEach((record) => {
        const value = String(record[selectedChartField] ?? "");
        counts[value] = (counts[value] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name: name || "(未設定)", value }));
    } else if (selectedFieldDef.type === "number") {
      // ★追加: 数値データのヒストグラム集計
      const numericValues = filteredAndSortedRecords
        .map((record) => Number(record[selectedChartField]))
        .filter((value) => !isNaN(value)); // 数値として有効なもののみ

      if (numericValues.length === 0) return [];

      const minValue = Math.min(...numericValues);
      const maxValue = Math.max(...numericValues);

      // 簡易ビニング: 10個の区間に分割
      const numberOfBins = 10;
      const binSize = (maxValue - minValue) / numberOfBins;

      if (binSize === 0) {
        // 全ての数値が同じ値の場合
        return [{ name: String(minValue), value: numericValues.length }];
      }

      const bins: Record<string, number> = {};
      for (let i = 0; i < numberOfBins; i++) {
        const lowerBound = minValue + i * binSize;
        const upperBound = minValue + (i + 1) * binSize;
        const binName = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`; // 小数点以下1桁で表示
        bins[binName] = 0;
      }

      numericValues.forEach((value) => {
        let binIndex = Math.floor((value - minValue) / binSize);
        if (binIndex === numberOfBins) binIndex--; // 最大値が最後のビンに含まれるように調整

        const lowerBound = minValue + binIndex * binSize;
        const upperBound = minValue + (binIndex + 1) * binSize;
        const binName = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;
        bins[binName]++;
      });

      // ビンの順序をソートして返す
      return Object.entries(bins)
        .sort(([nameA], [nameB]) => {
          const [minA] = nameA.split("-").map(Number);
          const [minB] = nameB.split("-").map(Number);
          return minA - minB;
        })
        .map(([name, value]) => ({ name, value }));
    } else if (selectedFieldDef.type === "date") {
      // ★修正: 日付データの集計 (日別/月別/年別件数)
      const dateValues = filteredAndSortedRecords
        .map((record) => dayjs(String(record[selectedChartField])))
        .filter((date) => date.isValid());

      if (dateValues.length === 0) return [];

      const countsByUnit: Record<string, number> = {};
      dateValues.forEach((date) => {
        let unitKey: string;
        if (dateAggregationUnit === "day") {
          unitKey = date.format("YYYY-MM-DD");
        } else if (dateAggregationUnit === "year") {
          unitKey = date.format("YYYY");
        } else {
          // default to 'month'
          unitKey = date.format("YYYY-MM");
        }
        countsByUnit[unitKey] = (countsByUnit[unitKey] || 0) + 1;
      });

      // 日付キーでソートして返す
      return Object.entries(countsByUnit)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([name, value]) => ({ name, value }));
    }
    return [];
  }, [filteredAndSortedRecords, appSchema, selectedChartField, selectedFieldDef, dateAggregationUnit]);

  // グラフ化可能なフィールドのリスト (ドロップダウン用)
  const chartableFields = useMemo(() => {
    if (!appSchema) return [];
    return appSchema.fields.filter(
      (f) =>
        f.type === "select" ||
        f.type === "radio" ||
        f.type === "checkbox" ||
        f.type === "number" ||
        f.type === "date"
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

  const currentChartType = useMemo(() => {
    if (userSelectedChartType) return userSelectedChartType; // ユーザー選択があればそれを優先

    if (!selectedFieldDef) return "bar"; // デフォルト

    switch (selectedFieldDef.type) {
      case "select":
      case "radio":
      case "checkbox":
        return "pie"; // カテゴリデータは円グラフ
      case "number":
        return "bar"; // 数値データは棒グラフ (ヒストグラム)
      case "date": // ★修正: 日付型も棒グラフ (時系列なら折れ線も)
        return "bar"; // デフォルトは棒グラフ (ヒストグラム/期間別件数)
      default:
        return "pie";
    }
  }, [selectedFieldDef, userSelectedChartType]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
      {appSchema && chartableFields.length > 0 ? (
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>グラフ化するフィールド</InputLabel>
          <Select
            value={selectedChartField || ""}
            label="グラフ化するフィールド"
            onChange={(e) => {
              setSelectedChartField(e.target.value as keyof GenericRecord);
              setUserSelectedChartType(undefined);
            }}
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
          グラフ化できる選択肢/ラジオボタン/チェックボックス/数値タイプのフィールドがありません。
        </Typography>
      )}

      {selectedChartField &&
        selectedFieldDef && ( // グラフ化するフィールドが選択されている場合のみ表示
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            {selectedFieldDef?.type === "date" && ( // ★追加: 日付フィールドが選択された場合のみ集計単位切り替えを表示
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <ToggleButtonGroup
                  value={dateAggregationUnit}
                  exclusive
                  onChange={(e, newUnit) => {
                    if (newUnit) setDateAggregationUnit(newUnit);
                  }}
                  aria-label="date aggregation unit"
                  size="small"
                >
                  <ToggleButton value="day">日別</ToggleButton>
                  <ToggleButton value="month">月別</ToggleButton>
                  <ToggleButton value="year">年別</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
            <ToggleButtonGroup
              value={userSelectedChartType || currentChartType} // ユーザー選択があればそれを、なければ自動決定されたものをデフォルトに
              exclusive
              onChange={(e, newType) => {
                if (newType) setUserSelectedChartType(newType as ChartType);
              }}
              aria-label="chart type"
              size="small"
            >
              {selectedFieldDef.type !== "date" && (
                <ToggleButton value="pie" aria-label="pie chart">
                  <PieChartIcon />
                </ToggleButton>
              )}
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon />
              </ToggleButton>
              {selectedFieldDef.type === "date" && (
                <ToggleButton value="line" aria-label="line chart">
                  <ShowChartIcon />
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Box>
        )}
      {selectedChartField ? (
        <GenericChart
          title={`「${appSchema?.fields.find((f) => f.name === selectedChartField)?.label || selectedChartField}」の分布`}
          data={chartData}
          chartType={currentChartType}
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
