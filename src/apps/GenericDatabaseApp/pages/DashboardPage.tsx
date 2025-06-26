import AddIcon from "@mui/icons-material/Add";
import DashboardIcon from "@mui/icons-material/Dashboard"; // ダッシュボードアイコン
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// 共通の型定義をインポート
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts"; // アプリスキーマ取得用
import { customViewRepository } from "../../../repositories/customViewRepository.ts";
import { dashboardRepository } from "../../../repositories/dashboardRepository.ts";
import {
  AppSchema,
  CustomView,
  Dashboard,
  DashboardWidget,
  FilterCondition,
  GenericRecord,
  SortCondition,
  WidgetType,
} from "../../../types/interfaces";

// DashboardPageProps インターフェース
interface DashboardPageProps {}
// 各ウィジェットを表示するためのコンポーネントが受け取るProps

// DashboardPage コンポーネントの定義
const DashboardPage: FC<DashboardPageProps> = () => {
  const navigate = useNavigate();

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false); // ダッシュボード作成/編集モーダル
  const [dashboardMode, setDashboardMode] = useState<"create" | "edit">("create"); // モーダルモード
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null); // 編集中のダッシュボードID
  const [newDashboardName, setNewDashboardName] = useState(""); // 新しいダッシュボード名
  const [selectedWidgets, setSelectedWidgets] = useState<DashboardWidget<GenericRecord>[]>([]); // モーダルで編集中のウィジェットリスト

  // ★追加: ウィジェット追加/編集用のステート (簡素化のため、最初は単一ウィジェットの編集から)
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [widgetMode, setWidgetMode] = useState<"create" | "edit">("create");
  const [editingWidgetIndex, setEditingWidgetIndex] = useState<number | null>(null);
  const [currentWidget, setCurrentWidget] = useState<DashboardWidget<GenericRecord> | null>(null); // 編集中ウィジェットデータ

  // ロード済みの全アプリスキーマ (ウィジェット設定用)
  const [allAppSchemas, setAllAppSchemas] = useState<AppSchema[]>([]);
  const [allCustomViews, setAllCustomViews] = useState<CustomView<GenericRecord>[]>([]);

  // ダッシュボードデータをロードする関数
  const fetchDashboards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardRepository.getAll();
      setDashboards(data);
      // 全アプリスキーマもここでロード (ウィジェット設定用)
      const schemas = await appSchemaRepository.getAll();
      setAllAppSchemas(schemas);

      const views = await customViewRepository.getAll();
      setAllCustomViews(views);
    } catch (err) {
      console.error("Error fetching dashboards:", err);
      setError("ダッシュボードの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  // ダッシュボード新規作成/編集モーダル関連ハンドラ
  const handleOpenDashboardModal = (dashboardId?: string) => {
    setIsDashboardModalOpen(true);
    if (dashboardId) {
      setDashboardMode("edit");
      setEditingDashboardId(dashboardId);
      const dashboard = dashboards.find((d) => d.id === dashboardId);
      if (dashboard) {
        setNewDashboardName(dashboard.name);
        setSelectedWidgets([...dashboard.widgets]); // 既存ウィジェットをコピー
      }
    } else {
      setDashboardMode("create");
      setEditingDashboardId(null);
      setNewDashboardName("");
      setSelectedWidgets([]); // 新規作成時はウィジェットをリセット
    }
  };

  const handleCloseDashboardModal = () => {
    setIsDashboardModalOpen(false);
    setEditingDashboardId(null);
    setNewDashboardName("");
    setSelectedWidgets([]);
  };

  const handleSaveDashboard = async () => {
    if (!newDashboardName.trim()) {
      alert("ダッシュボード名を入力してください。");
      return;
    }
    const dashboardToSave: Omit<Dashboard, "id"> = {
      name: newDashboardName.trim(),
      widgets: selectedWidgets,
    };
    try {
      if (dashboardMode === "edit" && editingDashboardId) {
        await dashboardRepository.update(editingDashboardId, dashboardToSave);
        alert(`ダッシュボード「${newDashboardName.trim()}」が更新されました！`);
      } else {
        await dashboardRepository.create(dashboardToSave);
        alert(`ダッシュボード「${newDashboardName.trim()}」が作成されました！`);
      }
      fetchDashboards(); // ダッシュボードリストを再ロード
      handleCloseDashboardModal();
    } catch (err) {
      console.error("Error saving dashboard:", err);
      alert("ダッシュボードの保存に失敗しました。");
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (window.confirm("このダッシュボードを本当に削除しますか？")) {
      try {
        await dashboardRepository.delete(dashboardId);
        alert("ダッシュボードが削除されました！");
        fetchDashboards(); // 再ロード
      } catch (err) {
        console.error("Error deleting dashboard:", err);
        alert("ダッシュボードの削除に失敗しました。");
      }
    }
  };

  // ★追加: ウィジェットの追加/編集/削除ハンドラ (DashboardModal 内部で利用)
  const handleAddWidget = () => {
    setWidgetMode("create");
    setEditingWidgetIndex(null);
    //setCurrentWidget(null);

    setCurrentWidget({
      id: String(Date.now()), // 暫定ID
      type: "chart", // デフォルトはグラフ
      title: "ウィジェット",
      appId: allAppSchemas.length > 0 ? allAppSchemas[0].id : undefined, // 最初のアプリをデフォルト
      chartField: undefined,
      chartType: "pie",
      chartAggregationUnit: "month",
      customViewId: undefined, // ★追加: customViewId も初期化
      xs: 12,
      sm: 12,
      md: 12,
      lg: 12, // デフォルトのGridサイズ
    });

    setIsWidgetModalOpen(true);
  };

  const handleEditWidget = (index: number) => {
    setWidgetMode("edit");
    setEditingWidgetIndex(index);
    setCurrentWidget(selectedWidgets[index]); // 既存ウィジェットをセット
    setIsWidgetModalOpen(true);
  };

  const handleDeleteWidget = (index: number) => {
    if (window.confirm("このウィジェットを削除しますか？")) {
      const updatedWidgets = selectedWidgets.filter((_, i) => i !== index);
      setSelectedWidgets(updatedWidgets);
    }
  };

  const handleSaveWidget = (widget: DashboardWidget<GenericRecord>) => {
    if (widgetMode === "edit" && editingWidgetIndex !== null) {
      const updatedWidgets = [...selectedWidgets];
      updatedWidgets[editingWidgetIndex] = widget;
      setSelectedWidgets(updatedWidgets);
    } else {
      // create
      setSelectedWidgets((prev) => [...prev, { ...widget, id: String(Date.now() + Math.random()) }]); // 新規ウィジェットにIDを付与
    }
    setIsWidgetModalOpen(false);
    setCurrentWidget(null);
  };

  const handleCloseWidgetModal = () => {
    setIsWidgetModalOpen(false);
    setCurrentWidget(null);
  };

  // ★追加: ウィジェットモーダル内のカスタムビュー選択ハンドラ
  const handleWidgetCustomViewChange = (viewId: string) => {
    if (!currentWidget) return;

    const selectedView = allCustomViews.find((view) => view.id === viewId);
    if (selectedView) {
      // 選択されたカスタムビューの条件をウィジェットにコピー
      setCurrentWidget((prev) => ({
        ...prev!,
        customViewId: viewId,
        appId: selectedView.appId, // アプリIDもビューから設定
        filterConditions: [...selectedView.filterConditions] as FilterCondition<GenericRecord>[],
        sortConditions: [...selectedView.sortConditions] as SortCondition<GenericRecord>[],
        displayFields: selectedView.displayFields ? [...selectedView.displayFields] : undefined,
      }));
    } else {
      // デフォルト（ビューなし）を選択した場合
      setCurrentWidget((prev) => ({
        ...prev!,
        customViewId: undefined,
        // アプリID、フィルタ、ソート、表示フィールドをクリアまたは初期値にリセット
        // ここではクリアする (必要に応じて初期値に設定)
        appId: undefined,
        filterConditions: [],
        sortConditions: [],
        displayFields: undefined,
      }));
    }
  };

  // ローディング中とエラー表示
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
        <Button onClick={fetchDashboards} variant="contained">
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        ダッシュボード管理
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDashboardModal()}>
          新しいダッシュボードを作成
        </Button>
      </Box>

      {dashboards.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          まだダッシュボードがありません。
        </Typography>
      ) : (
        <List>
          {dashboards.map((dashboard) => (
            <ListItem
              key={dashboard.id}
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleOpenDashboardModal(dashboard.id)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteDashboard(dashboard.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={dashboard.name}
                secondary={`${dashboard.widgets.length} ウィジェット`}
              />
              <Button
                onClick={() => navigate(`/generic-db/dashboards/${dashboard.id}`)}
                startIcon={<DashboardIcon />}
                sx={{ ml: 2, mr: 5 }}
              >
                ダッシュボードを開く
              </Button>
            </ListItem>
          ))}
        </List>
      )}

      {/* ダッシュボード作成/編集モーダル */}
      <Dialog open={isDashboardModalOpen} onClose={handleCloseDashboardModal} fullWidth maxWidth="md">
        <DialogTitle>
          {dashboardMode === "create" ? "新しいダッシュボードを作成" : "ダッシュボードを編集"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ダッシュボード名"
            type="text"
            fullWidth
            variant="standard"
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            ウィジェット設定 ({selectedWidgets.length} 件)
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddWidget}>
            ウィジェットを追加
          </Button>

          {selectedWidgets.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              まだウィジェットがありません。
            </Typography>
          ) : (
            <List sx={{ mt: 2, border: "1px solid #eee", borderRadius: 1 }}>
              {selectedWidgets.map((widget, index) => (
                <ListItem
                  key={widget.id}
                  secondaryAction={
                    <>
                      <IconButton
                        edge="end"
                        aria-label="edit widget"
                        onClick={() => handleEditWidget(index)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete widget"
                        onClick={() => handleDeleteWidget(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText
                    primary={widget.title}
                    secondary={`タイプ: ${widget.type} / アプリ: ${widget.appId || "なし"}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDashboardModal} color="secondary">
            キャンセル
          </Button>
          <Button onClick={handleSaveDashboard} variant="contained" color="primary">
            {dashboardMode === "create" ? "作成" : "保存"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ウィジェット追加/編集モーダル (後で専用コンポーネントに切り出す) */}
      <Dialog open={isWidgetModalOpen} onClose={handleCloseWidgetModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {widgetMode === "create" ? "新しいウィジェットを追加" : "ウィジェットを編集"}
        </DialogTitle>
        <DialogContent>
          {/* ここにウィジェットの種類選択や、種類に応じた設定フォームが入ります */}
          <Typography variant="body1">ウィジェット設定フォーム</Typography>
          <TextField
            fullWidth
            margin="normal"
            label="ウィジェットタイトル"
            value={currentWidget?.title || ""}
            onChange={(e) =>
              setCurrentWidget((prev) =>
                prev
                  ? { ...prev, title: e.target.value }
                  : { id: String(Date.now()), type: "chart", title: e.target.value }
              )
            }
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>ウィジェットタイプ</InputLabel>
            <Select
              value={currentWidget?.type || ""}
              label="ウィジェットタイプ"
              onChange={(e) =>
                setCurrentWidget((prev) =>
                  prev
                    ? { ...prev, type: e.target.value as WidgetType }
                    : { id: String(Date.now()), type: e.target.value as WidgetType, title: "" }
                )
              }
            >
              <MenuItem value="chart">グラフ</MenuItem>
              <MenuItem value="list">リスト</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">設定</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>対象アプリ</InputLabel>
              <Select
                value={currentWidget?.appId || ""}
                label="対象アプリ"
                onChange={(e) =>
                  setCurrentWidget((prev) => ({ ...prev!, appId: e.target.value as string }))
                }
              >
                {allAppSchemas.map((schema) => (
                  <MenuItem key={schema.id} value={schema.id}>
                    {schema.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>カスタムビューを適用</InputLabel>
            <Select
              value={currentWidget?.customViewId || ""}
              label="カスタムビューを適用"
              onChange={(e) => handleWidgetCustomViewChange(e.target.value as string)}
            >
              <MenuItem value="">なし</MenuItem>
              {allCustomViews
                .filter((view) => view.appId === currentWidget?.appId)
                .map(
                  (
                    view // 選択中のアプリのビューのみ表示
                  ) => (
                    <MenuItem key={view.id} value={view.id}>
                      {view.name}
                    </MenuItem>
                  )
                )}
            </Select>
          </FormControl>

          {/* ★追加: ウィジェットサイズ設定 */}
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            ウィジェットサイズ (Grid 列幅)
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Extra Small (xs)"
                value={currentWidget?.xs || ""}
                onChange={(e) =>
                  setCurrentWidget((prev) => ({ ...prev!, xs: Number(e.target.value) || undefined }))
                }
                inputProps={{ min: 1, max: 12 }}
                margin="dense"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Small (sm)"
                value={currentWidget?.sm || ""}
                onChange={(e) =>
                  setCurrentWidget((prev) => ({ ...prev!, sm: Number(e.target.value) || undefined }))
                }
                inputProps={{ min: 1, max: 12 }}
                margin="dense"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Medium (md)"
                value={currentWidget?.md || ""}
                onChange={(e) =>
                  setCurrentWidget((prev) => ({ ...prev!, md: Number(e.target.value) || undefined }))
                }
                inputProps={{ min: 1, max: 12 }}
                margin="dense"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Large (lg)"
                value={currentWidget?.lg || ""}
                onChange={(e) =>
                  setCurrentWidget((prev) => ({ ...prev!, lg: Number(e.target.value) || undefined }))
                }
                inputProps={{ min: 1, max: 12 }}
                margin="dense"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWidgetModal} color="secondary">
            キャンセル
          </Button>
          <Button
            onClick={() => currentWidget && handleSaveWidget(currentWidget)}
            variant="contained"
            color="primary"
          >
            {widgetMode === "create" ? "追加" : "保存"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;
