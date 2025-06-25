import React, { FC, useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Paper, Grid } from "@mui/material";

// 共通の型定義をインポート
import {
  Dashboard,
  GenericRecord,
  AppSchema,
  FormField,
  CommonFormFieldComponent,
  SortCondition,
  FilterCondition,
  FilterOperator,
  ChartType,
  DashboardWidget,
  WidgetType,
} from "../../../types/interfaces";
import { dashboardRepository } from "../../../repositories/dashboardRepository.ts";
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts";
import { genericDataRepository } from "../../../repositories/genericDataRepository.ts";

// カスタムHookとヘルパー関数 (このファイルでは直接使わないものはインポートを削除)
// import { getFieldComponentByType } from '../utils/fieldComponentMapper'; // DashboardChartWidget, DashboardListWidget で使用
// import { getFilterConditionsDisplay, getSortConditionsDisplay, getDisplayFieldsDisplay } from '../utils/filterOperatorLabels'; // ダッシュボード表示では直接使わない

// ★修正: DashboardChartWidget と DashboardListWidget をインポート
import DashboardChartWidget from "../components/DashboardChartWidget.tsx";
import DashboardListWidget from "../components/DashboardListWidget.tsx";
import DashboardWidgetDisplay from "../components/DashboardWidgetDisplay.tsx";

// DashboardDisplayPage コンポーネントの定義
const DashboardDisplayPage: FC = () => {
  const { dashboardId } = useParams<{ dashboardId?: string }>();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null); // ★修正: Dashboard<GenericRecord> 型を明確に
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //const [allAppSchemas, setAllAppSchemas] = useState<AppSchema[]>([]); // 全アプリスキーマ (子ウィジェットに渡す)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!dashboardId) {
          setError("ダッシュボードIDが指定されていません。");
          return;
        }
        const fetchedDashboard = await dashboardRepository.getById(dashboardId);
        if (!fetchedDashboard) {
          setError("指定されたダッシュボードが見つかりません。");
          return;
        }
        setDashboard(fetchedDashboard as Dashboard); // 型キャスト
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("ダッシュボードの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [dashboardId]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          ダッシュボードを読み込み中...
        </Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <Typography variant="body1">エラー: {error}</Typography>
        <Button onClick={() => navigate("/generic-db/dashboards")} variant="contained">
          ダッシュボード管理に戻る
        </Button>
      </Box>
    );
  }
  if (!dashboard) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="body1">ダッシュボードが見つかりません。</Typography>
        <Button onClick={() => navigate("/generic-db/dashboards")} variant="contained">
          ダッシュボード管理に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        ダッシュボード: {dashboard.name}
        <Button onClick={() => navigate("/generic-db/dashboards")} sx={{ ml: 2 }} variant="outlined">
          一覧に戻る
        </Button>
      </Typography>

      <Grid container spacing={3}>
        {/* ウィジェットをGridで表示 */}
        {dashboard.widgets.map((widget) => (
          <Grid key={widget.id} size={{ xs: widget.xs || 12, sm: widget.sm || 12, md: widget.md || 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                {widget.title}
              </Typography>
              <DashboardWidgetDisplay widget={widget} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardDisplayPage;
