import { Box, Button, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 共通の型定義をインポート
import { dashboardRepository } from "../../../repositories/dashboardRepository.ts";
import { Dashboard } from "../../../types/interfaces";

// カスタムHookとヘルパー関数 (このファイルでは直接使わないものはインポートを削除)
// import { getFieldComponentByType } from '../utils/fieldComponentMapper'; // DashboardChartWidget, DashboardListWidget で使用
// import { getFilterConditionsDisplay, getSortConditionsDisplay, getDisplayFieldsDisplay } from '../utils/filterOperatorLabels'; // ダッシュボード表示では直接使わない

// ★修正: DashboardChartWidget と DashboardListWidget をインポート
import DashboardWidgetDisplay from "../components/DashboardWidgetDisplay.tsx";
import { useGlobalDataContext } from "../../../contexts/GlobalDataContext.tsx";

// DashboardDisplayPage コンポーネントの定義
const DashboardDisplayPage: FC = () => {
  const { dashboardId } = useParams<{ dashboardId?: string }>();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { allUsers } = useGlobalDataContext();

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
            <Paper sx={{ p: 2, height: "100%", overflowX: "scroll" }}>
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
