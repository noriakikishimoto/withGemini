import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import {
  Box,
  FormControl,
  Grid,
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
import { AppSchema, ChartType, GenericRecord } from "../../../types/interfaces.ts";
import GenericChart from "./GenericChart.tsx"; // GenericChart をインポート

// グラフデータのエントリ型 (GenericChart.tsx と同じ)
interface ChartDataEntry {
  name: string; // カテゴリ名 (例: '完了', '未完了', 'A', 'B', '0-10', '11-20', '2023-01', '2023-02')
  value: number; // 件数
}
interface IndividualChartSettings {
  chartType: ChartType;
  dateAggregationUnit: "day" | "month" | "year";
}

// ChartDisplay が受け取る Props
interface ChartDisplay2Props {
  appSchema: AppSchema | null;
  filteredAndSortedRecords: GenericRecord[]; // フィルタリング・ソート済みのレコードデータ
}

const ChartDisplay2: FC<ChartDisplay2Props> = ({ appSchema, filteredAndSortedRecords }) => {
  // キーはフィールド名、値は IndividualChartSettings
  const [chartSettings, setChartSettings] = useState<Record<string, IndividualChartSettings>>({});

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

  // グラフ表示用データの集計ロジック
  /*
  const allChartsData = useMemo(() => {
    if (!appSchema || !filteredAndSortedRecords || filteredAndSortedRecords.length === 0) return [];

    return chartableFields.map((fieldDef) => {
      const selectedChartField = fieldDef.name as keyof GenericRecord;
      const fieldType = fieldDef.type;

      let chartData: ChartDataEntry[] = [];
      let currentChartType: ChartType = "bar"; // デフォルトは棒グラフ

      if (fieldType === "select" || fieldType === "radio" || fieldType === "checkbox") {
        // カテゴリデータの集計
        const counts: Record<string, number> = {};
        filteredAndSortedRecords.forEach((record) => {
          const value = String(record[selectedChartField] ?? "");
          counts[value] = (counts[value] || 0) + 1;
        });
        chartData = Object.entries(counts).map(([name, value]) => ({ name: name || "(未設定)", value }));
        currentChartType = "pie"; // カテゴリは円グラフ
      } else if (fieldType === "number") {
        // 数値データのヒストグラム集計
        const numericValues = filteredAndSortedRecords
          .map((record) => Number(record[selectedChartField]))
          .filter((value) => !isNaN(value));

        if (numericValues.length > 0) {
          const minValue = Math.min(...numericValues);
          const maxValue = Math.max(...numericValues);
          const numberOfBins = 10;
          const binSize = (maxValue - minValue) / numberOfBins;

          if (binSize === 0) {
            chartData = [{ name: String(minValue), value: numericValues.length }];
          } else {
            const bins: Record<string, number> = {};
            for (let i = 0; i < numberOfBins; i++) {
              const lowerBound = minValue + i * binSize;
              const upperBound = minValue + (i + 1) * binSize;
              const binName = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;
              bins[binName] = 0;
            }

            numericValues.forEach((value) => {
              let binIndex = Math.floor((value - minValue) / binSize);
              if (binIndex === numberOfBins && value === maxValue) {
                binIndex--;
              } else if (binIndex > numberOfBins) {
                binIndex = numberOfBins - 1;
              }
              const lowerBound = minValue + binIndex * binSize;
              const upperBound = minValue + (binIndex + 1) * binSize;
              const binName = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;
              bins[binName]++;
            });

            chartData = Object.entries(bins)
              .sort(([nameA], [nameB]) => {
                const [minA] = nameA.split("-").map(Number);
                const [minB] = nameB.split("-").map(Number);
                return minA - minB;
              })
              .map(([name, value]) => ({ name, value }));
          }
        }
        currentChartType = "bar"; // 数値は棒グラフ
      } else if (fieldType === "date") {
        // 日付データの集計 (月別件数 - デフォルト)
        const dateValues = filteredAndSortedRecords
          .map((record) => dayjs(String(record[selectedChartField])))
          .filter((date) => date.isValid());

        if (dateValues.length > 0) {
          const countsByMonth: Record<string, number> = {};
          dateValues.forEach((date) => {
            const monthKey = date.format("YYYY-MM"); // デフォルトは月別
            countsByMonth[monthKey] = (countsByMonth[monthKey] || 0) + 1;
          });

          chartData = Object.entries(countsByMonth)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([name, value]) => ({ name, value }));
        }
        currentChartType = "line"; // 日付は折れ線グラフ
      }

      return {
        field: fieldDef,
        data: chartData,
        chartType: currentChartType,
      };
    });
  }, [filteredAndSortedRecords, appSchema, chartableFields]);
*/
  const allChartsData = useMemo(() => {
    if (!appSchema || !filteredAndSortedRecords || filteredAndSortedRecords.length === 0) return [];

    return chartableFields.map((fieldDef) => {
      const selectedChartField = fieldDef.name as keyof GenericRecord; // 各フィールドが対象
      const fieldType = fieldDef.type;

      // 各グラフの現在の設定を取得
      const currentSettings = chartSettings[selectedChartField as string];
      const actualChartType = currentSettings?.chartType || "bar"; // 設定がなければデフォルト
      const actualDateAggregationUnit = currentSettings?.dateAggregationUnit || "month"; // 設定がなければデフォルト

      let chartData: ChartDataEntry[] = [];

      if (fieldType === "select" || fieldType === "radio" || fieldType === "checkbox") {
        const counts: Record<string, number> = {};
        filteredAndSortedRecords.forEach((record) => {
          const value = String(record[selectedChartField] ?? "");
          counts[value] = (counts[value] || 0) + 1;
        });
        chartData = Object.entries(counts).map(([name, value]) => ({ name: name || "(未設定)", value }));
      } else if (fieldType === "number") {
        const numericValues = filteredAndSortedRecords
          .map((record) => Number(record[selectedChartField]))
          .filter((value) => !isNaN(value));

        if (numericValues.length > 0) {
          const minValue = Math.min(...numericValues);
          const maxValue = Math.max(...numericValues);
          const numberOfBins = 10;
          const binSize = (maxValue - minValue) / numberOfBins;

          if (binSize === 0) {
            chartData = [{ name: String(minValue), value: numericValues.length }];
          } else {
            const bins: Record<string, number> = {};
            for (let i = 0; i < numberOfBins; i++) {
              const lowerBound = minValue + i * binSize;
              const upperBound = minValue + (i + 1) * binSize;
              const binName = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;
              bins[binName] = 0;
            }

            numericValues.forEach((value) => {
              let binIndex = Math.floor((value - minValue) / binSize);
              if (binIndex === numberOfBins && value === maxValue) {
                binIndex--;
              } else if (binIndex > numberOfBins) {
                binIndex = numberOfBins - 1;
              }
              const lowerBound = minValue + binIndex * binSize;
              const upperBound = minValue + (binIndex + 1) * binSize;
              const binName = `${lowerBound.toFixed(1)}-${upperBound.toFixed(1)}`;
              bins[binName]++;
            });

            chartData = Object.entries(bins)
              .sort(([nameA], [nameB]) => {
                const [minA] = nameA.split("-").map(Number);
                const [minB] = nameB.split("-").map(Number);
                return minA - minB;
              })
              .map(([name, value]) => ({ name, value }));
          }
        }
      } else if (fieldType === "date") {
        const dateValues = filteredAndSortedRecords
          .map((record) => dayjs(String(record[selectedChartField])))
          .filter((date) => date.isValid());

        if (dateValues.length > 0) {
          const countsByUnit: Record<string, number> = {};
          dateValues.forEach((date) => {
            let unitKey: string;
            // ★修正: actualDateAggregationUnit を使用
            if (actualDateAggregationUnit === "day") {
              unitKey = date.format("YYYY-MM-DD");
            } else if (actualDateAggregationUnit === "year") {
              unitKey = date.format("YYYY");
            } else {
              // default to 'month'
              unitKey = date.format("YYYY-MM");
            }
            countsByUnit[unitKey] = (countsByUnit[unitKey] || 0) + 1;
          });

          chartData = Object.entries(countsByUnit)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([name, value]) => ({ name, value }));
        }
      }

      return {
        field: fieldDef,
        data: chartData,
        chartType: actualChartType, // ★修正: actualChartType を使用
        // dateAggregationUnit: actualDateAggregationUnit, // 個別グラフの設定として渡す必要はない
      };
    });
  }, [appSchema, filteredAndSortedRecords, chartableFields, chartSettings]); // ★依存配列に chartSettings を追加

  // selectedChartField の初期化ロジック
  /*
  useEffect(() => {
    if (appSchema && chartableFields.length > 0 && selectedChartField === undefined) {
      setSelectedChartField(chartableFields[0].name as keyof GenericRecord);
    } else if (appSchema && chartableFields.length === 0 && selectedChartField !== undefined) {
      setSelectedChartField(undefined);
    }
  }, [appSchema, chartableFields, selectedChartField]);
  */

  useEffect(() => {
    if (appSchema && chartableFields.length > 0) {
      const initialSettings: Record<string, IndividualChartSettings> = {};
      chartableFields.forEach((fieldDef) => {
        let defaultChartType: ChartType = "bar";
        let defaultDateAggregationUnit: "day" | "month" | "year" = "month";

        switch (fieldDef.type) {
          case "select":
          case "radio":
          case "checkbox":
            defaultChartType = "pie"; // カテゴリデータは円グラフ
            break;
          case "number":
            defaultChartType = "bar"; // 数値データは棒グラフ
            break;
          case "date":
            defaultChartType = "line"; // 日付データは折れ線グラフ
            break;
          default:
            defaultChartType = "bar";
        }
        initialSettings[fieldDef.name as string] = {
          chartType: defaultChartType,
          dateAggregationUnit: defaultDateAggregationUnit,
        };
      });
      setChartSettings(initialSettings);
    } else if (chartableFields.length === 0) {
      setChartSettings({}); // グラフ化可能なフィールドがなければリセット
    }
  }, [appSchema, chartableFields]);

  /*
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
*/
  // ★追加: 個々のグラフ設定を変更するハンドラ
  const handleChartSettingChange = (
    fieldName: keyof GenericRecord,
    key: keyof IndividualChartSettings,
    value: any
  ) => {
    setChartSettings((prev) => ({
      ...prev,
      [fieldName as string]: {
        ...prev[fieldName as string],
        [key]: value,
      },
    }));
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
      {chartableFields.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          グラフ化できる選択肢/ラジオボタン/チェックボックス/数値/日付タイプのフィールドがありません。
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {/* 複数のグラフを並べるためのGridコンテナ */}
          {allChartsData.map((chartItem, index) => (
            <Grid key={chartItem.field.name as string} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ p: 1, border: "1px solid #eee", borderRadius: "4px" }}>
                {" "}
                {/* 各グラフをBoxで囲んで区別 */}
                <Typography variant="subtitle1" gutterBottom align="center">
                  {`「${chartItem.field.label}」の分布`}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, mt: 3 }}>
                  {chartItem.field.type === "date" && (
                    <ToggleButtonGroup
                      value={
                        chartSettings[chartItem.field.name as string]?.dateAggregationUnit || "month"
                      }
                      exclusive
                      onChange={(e, newUnit) => {
                        if (newUnit)
                          handleChartSettingChange(
                            chartItem.field.name as keyof GenericRecord,
                            "dateAggregationUnit",
                            newUnit
                          );
                      }}
                      aria-label="date aggregation unit"
                      size="small"
                    >
                      <ToggleButton value="day">日別</ToggleButton>
                      <ToggleButton value="month">月別</ToggleButton>
                      <ToggleButton value="year">年別</ToggleButton>
                    </ToggleButtonGroup>
                  )}
                  <ToggleButtonGroup
                    value={chartSettings[chartItem.field.name as string]?.chartType || "bar"}
                    exclusive
                    onChange={(e, newType) => {
                      if (newType)
                        handleChartSettingChange(
                          chartItem.field.name as keyof GenericRecord,
                          "chartType",
                          newType as ChartType
                        );
                    }}
                    aria-label="chart type"
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    {chartItem.field.type !== "date" && ( // 日付以外は円グラフも
                      <ToggleButton value="pie" aria-label="pie chart">
                        <PieChartIcon />
                      </ToggleButton>
                    )}
                    <ToggleButton value="bar" aria-label="bar chart">
                      <BarChartIcon />
                    </ToggleButton>
                    {chartItem.field.type === "date" && ( // 日付型のみ折れ線グラフ
                      <ToggleButton value="line" aria-label="line chart">
                        <ShowChartIcon />
                      </ToggleButton>
                    )}
                  </ToggleButtonGroup>
                </Box>
                <GenericChart title="" data={chartItem.data} chartType={chartItem.chartType} />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ChartDisplay2;
