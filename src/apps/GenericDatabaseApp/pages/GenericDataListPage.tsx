import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // ★useParams を追加
import DynamicList from "../../../components/DynamicList.tsx";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList"; // フィルタアイコン
import SortIcon from "@mui/icons-material/Sort"; // ソートアイコン
import ViewColumnIcon from "@mui/icons-material/ViewColumn"; // 列選択アイコンを追加
import SettingsIcon from "@mui/icons-material/Settings";

import BarChartIcon from "@mui/icons-material/BarChart";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableViewIcon from "@mui/icons-material/TableView";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

// 共通の型定義をインポート
import { customViewRepository } from "../../../repositories/customViewRepository.ts";
import { genericDataRepository } from "../../../repositories/genericDataRepository.ts";

import {
  CommonFormFieldComponent,
  FilterCondition,
  FormField,
  GenericRecord,
  SortCondition,
  User,
} from "../../../types/interfaces";
import DisplayFieldsModal from "../components/DisplayFieldsModal.tsx";
import FilterSettingsModal from "../components/FilterSettingsModal.tsx";
import SaveViewModal from "../components/SaveViewModal.tsx";
import SortSettingsModal from "../components/SortSettingsModal.tsx";
//import GenericChart from "../components/GenericChart.tsx";
import ChartDisplay from "../components/ChartDisplay.tsx";

import { useAppData } from "../hooks/useAppData.ts";
import { getFieldComponentByType } from "../utils/fieldComponentMapper.ts";
import { useListSettings } from "../hooks/useListSettings.ts";
import ChartDisplay2 from "../components/ChartDisplay2.tsx";
import { addSystemFieldsToSchema } from "../utils/appSchemaUtils";
import { userRepository } from "../../../repositories/userRepository.ts";

// DynamicList に渡すフィールド定義の型を AppSchemaFormPage と合わせるための型
type FormFieldForDynamicList<T extends object> = FormField<T, CommonFormFieldComponent<any>>;

interface GenericDataListPageProps {}

const GenericDataListPage: FC<GenericDataListPageProps> = () => {
  //const { appId } = useParams<{ appId: string }>(); // URLからアプリIDを取得
  const { appId, viewId } = useParams<{ appId: string; viewId?: string }>();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  const { appSchema, records, customViews, isLoading, error, fetchData } = useAppData(appId);
  // ★追加: useListSettings からリスト関連のステートとハンドラを取得
  const {
    searchTerm,
    setSearchTerm,
    sortConditions,
    //setSortConditions, // setSortConditions も公開
    handleSortConditionsChange,
    filterConditions,
    //setFilterConditions, // setFilterConditions も公開
    handleFilterConditionsChange,
    selectedDisplayFields,
    //setSelectedDisplayFields, // setSelectedDisplayFields も公開
    handleDisplayFieldsChange,
    filteredAndSortedRecords,
    fieldsForDynamicList,
    currentViewId,
    setCurrentViewId, // setCurrentViewId も公開
  } = useListSettings({ appId, appSchema, records, customViews, isLoading, allUsers });

  const [saveViewMode, setSaveViewMode] = useState<"create" | "edit">("create");
  const [editingViewId, setEditingViewId] = useState<string | null>(null);

  // ソート設定モーダルを開くステートとハンドラ
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const handleOpenSortModal = () => setIsSortModalOpen(true);
  const handleCloseSortModal = () => setIsSortModalOpen(false);
  // フィルタリング設定モーダルを開くステートとハンドラ
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const handleOpenFilterModal = () => setIsFilterModalOpen(true);
  const handleCloseFilterModal = () => setIsFilterModalOpen(false);
  // 表示列設定モーダルの開閉を制御するステートとハンドラ
  const [isDisplayFieldsModalOpen, setIsDisplayFieldsModalOpen] = useState(false);
  const handleOpenDisplayFieldsModal = () => setIsDisplayFieldsModalOpen(true);
  const handleCloseDisplayFieldsModal = () => setIsDisplayFieldsModalOpen(false);

  // カスタムビュー保存モーダル関連ハンドラ
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false); // ビュー保存モーダル
  const handleOpenSaveViewModal = (viewToEditId?: string) => {
    setIsSaveViewModalOpen(true);
    if (viewToEditId) {
      setSaveViewMode("edit");
      setEditingViewId(viewToEditId);
    } else {
      setSaveViewMode("create");
      setEditingViewId(null);
    }
  };
  const handleCloseSaveViewModal = () => setIsSaveViewModalOpen(false);

  // 現在のビュータイプを管理
  const [currentViewType, setCurrentViewType] = useState<"table" | "cards" | "chart">("table");

  /*
  // 現在のビューIDが変更されたら、フィルタ/ソート条件を適用
  useEffect(() => {
    // appSchema がまだロードされていない場合は何もしない
    if (!appSchema) {
      // ただし、isLoading が false になった後も appSchema が null ならエラー表示
      if (!isLoading && !appSchema) {
        //    setError("アプリスキーマが見つからないか、読み込みに失敗しました。");
      }
      return;
    }

    if (currentViewId === "default") {
      setFilterConditions([]);
      setSortConditions([]);
      setSelectedDisplayFields(appSchema.fields.map((f) => f.name as keyof GenericRecord));
    } else {
      const selectedView = customViews.find((view) => view.id === currentViewId);
      if (selectedView) {
        setFilterConditions([...selectedView.filterConditions] as FilterCondition<GenericRecord>[]);
        setSortConditions([...selectedView.sortConditions] as SortCondition<GenericRecord>[]);
        setSelectedDisplayFields(
          selectedView.displayFields || appSchema.fields.map((f) => f.name as keyof GenericRecord)
        );
      } else {
        setCurrentViewId("default");
      }
    }
  }, [currentViewId, customViews, appSchema, isLoading]); // isLoading も依存配列に追加 (appSchema のロード完了を待つため)
*/
  // ★追加: appId が変更されたら currentViewType をデフォルトに戻す
  useEffect(() => {
    setCurrentViewType("table"); // アプリが切り替わったらデフォルトのテーブルビューに
  }, [appId]);

  // 追加: URL の viewId が変更されたら currentViewId を更新する useEffect
  useEffect(() => {
    if (viewId !== currentViewId) {
      // URL の viewId が現在のステートと異なる場合のみ更新
      setCurrentViewId(viewId || "default");
    }
  }, [viewId]); // viewId が変更されたら実行

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
  }, []); // 初回のみロード (ユーザー管理ページで更新されるため)

  // レコード編集ハンドラ (フォームページへ遷移)
  const handleEditRecord = (recordId: string) => {
    navigate(`/generic-db/data/${appId}/${recordId}`); // 汎用フォームページへ遷移
  };

  // レコード削除ハンドラ
  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm("このレコードを本当に削除しますか？")) {
      //      setIsLoading(true);
      //      setError(null);
      try {
        if (!appId) throw new Error("アプリIDが見つかりません。");
        await genericDataRepository.delete(recordId, appId); // appId と recordId を渡す
        alert("レコードが削除されました！");
        fetchData(); // 削除後にリストを再フェッチ
      } catch (err) {
        console.error("Error deleting record:", err);
        //       setError("レコードの削除に失敗しました。");
        alert("エラーが発生しました: " + (err as Error).message);
      } finally {
        //       setIsLoading(false);
      }
    }
  };

  // 新規レコード作成ページへ遷移
  const handleCreateNewRecord = () => {
    navigate(`/generic-db/data/${appId}/new`);
  };

  // ビュー編集ハンドラ
  const handleEditSchema = () => {
    if (appId) {
      navigate(`/generic-db/app-schemas/${appId}`); // アプリスキーマ編集画面へ遷移
    }
  };
  // ビュー削除ハンドラ (リストアイテムから直接呼び出す)
  const handleDeleteView = async (viewId: string) => {
    if (window.confirm("このビューを本当に削除しますか？")) {
      try {
        await customViewRepository.delete(viewId, appId); // appId を渡して削除
        alert("ビューが削除されました！");
        fetchData(); // ビューリストを再ロード
        if (currentViewId === viewId) {
          // 削除されたビューが選択中ならデフォルトに戻す
          setCurrentViewId("default");
        }
      } catch (err) {
        console.error("Error deleting view:", err);
        alert("ビューの削除に失敗しました。");
      }
    }
  };

  // ★追加: ビュータイプ切り替えハンドラ
  const handleViewTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewType: "table" | "cards" | "chart" | null
  ) => {
    if (newViewType !== null) {
      setCurrentViewType(newViewType);
    }
  };

  // 型合わせのため。。
  /*
  const appSchemaFieldsWithComponent = useMemo((): FormFieldForDynamicList<GenericRecord>[] => {
    if (!appSchema) return [];
    return appSchema.fields.map((field) => ({
      ...field,
      component: getFieldComponentByType(field.type),
    })) as FormFieldForDynamicList<GenericRecord>[];
  }, [appSchema]);
*/

  const appSchemaFieldsWithComponent = useMemo(() => {
    if (!appSchema) return [];
    return addSystemFieldsToSchema(appSchema);
  }, [appSchema, allUsers]); // allUsers を依存配列に追加

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          データを読み込み中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <Typography variant="body1">エラー: {error}</Typography>
        <Button onClick={fetchData} variant="contained">
          再試行
        </Button>
      </Box>
    );
  }

  if (!appSchema) {
    // スキーマが見つからない場合はエラー
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="body1">
          指定されたアプリスキーマが見つからないか、読み込みに失敗しました。
        </Typography>
        <Button onClick={() => navigate("/generic-db/app-schemas/list")} variant="contained">
          アプリ一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        {appSchema.name} レコード ({filteredAndSortedRecords.length} 件)
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <TextField
          label="レコード検索"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "300px" }}
        />
        <Button variant="contained" color="primary" onClick={handleCreateNewRecord}>
          新規レコードを作成
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <FormControl sx={{ minWidth: 300 }} size="small">
            <InputLabel>ビュー選択</InputLabel>{" "}
            <Select
              value={currentViewId}
              label="ビュー選択"
              onChange={(e) => {
                const newViewId = e.target.value as string;
                setCurrentViewId(newViewId);
                // URL を更新して、直リンクを可能にする
                if (newViewId === "default") {
                  navigate(`/generic-db/data/${appId}/list`);
                } else {
                  navigate(`/generic-db/data/${appId}/list/${newViewId}`);
                }
              }}
            >
              <MenuItem value="default">デフォルトビュー</MenuItem>
              {customViews.map((view) => (
                <MenuItem key={view.id} value={view.id}>
                  <Typography variant="inherit">{view.name}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {currentViewId !== "default" && (
            <>
              <IconButton
                aria-label={`現在のビューを編集`}
                onClick={() => {
                  handleOpenSaveViewModal(currentViewId);
                }}
                size="small"
                sx={{ ml: 2 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              {/* ★追加: ビュー削除ボタン */}
              <IconButton
                aria-label={`現在のビューを削除`}
                onClick={() => {
                  handleDeleteView(currentViewId);
                }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
        <Box>
          <Button
            variant={sortConditions.length > 0 ? "contained" : "outlined"}
            startIcon={<SortIcon />}
            onClick={handleOpenSortModal}
          >
            ソート設定
          </Button>
          <Button
            variant={filterConditions.length > 0 ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={handleOpenFilterModal}
          >
            絞り込み設定
          </Button>
          <Button
            variant={
              selectedDisplayFields.length !== appSchemaFieldsWithComponent.length
                ? "contained"
                : "outlined"
            }
            startIcon={<ViewColumnIcon />}
            onClick={handleOpenDisplayFieldsModal}
          >
            表示列設定
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenSaveViewModal()}>
            ビューを保存
          </Button>
        </Box>
      </Box>

      {/* ★修正: ビュータイプ切り替え (table/cards/chart) */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <IconButton onClick={handleEditSchema} sx={{ mr: 2 }} aria-label="アプリ設定">
          <SettingsIcon />
        </IconButton>

        <ToggleButtonGroup
          value={currentViewType}
          exclusive
          onChange={handleViewTypeChange}
          aria-label="list view type"
        >
          <ToggleButton value="table" aria-label="table view">
            <TableViewIcon />
          </ToggleButton>
          <ToggleButton value="cards" aria-label="cards view">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="chart" aria-label="chart view">
            <BarChartIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {/* ★修正: ViewType に応じたコンテンツのレンダリング */}
      {currentViewType === "chart" ? (
        <ChartDisplay2 appSchema={appSchema} filteredAndSortedRecords={filteredAndSortedRecords} />
      ) : (
        <DynamicList<GenericRecord> // GenericRecord 型を渡す
          items={filteredAndSortedRecords}
          fields={fieldsForDynamicList} // 表示対象の列のみが絞り込まれたフィールド一覧
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
          itemBasePath={`/generic-db/data/${appId}`} // ベースパスに appId を含める
          listTitle={appSchema.name || "レコード"} // アプリ名をタイトルに
          onSortChange={handleSortConditionsChange} // onSortChange を渡す
          currentSortConditions={sortConditions} // currentSortConditions を渡す
          onFilterChange={handleFilterConditionsChange} // onFilterChange を渡す
          currentFilterConditions={filterConditions} // currentFilterConditions を渡す
          currentViewType={currentViewType === "table" ? "table" : "cards"} // DynamicList に table/cards を渡す
          isStickyHeader={true}
        />
      )}

      {/* ソート設定用モーダル */}
      <SortSettingsModal<GenericRecord>
        open={isSortModalOpen}
        onClose={handleCloseSortModal}
        fields={appSchemaFieldsWithComponent} // ソート対象フィールド選択用に全フィールドを渡す
        currentSortConditions={sortConditions}
        onSave={handleSortConditionsChange} // モーダルで保存されたソート条件を受け取る
      />
      {/* フィルタリング設定用モーダル */}
      <FilterSettingsModal<GenericRecord>
        open={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        fields={appSchemaFieldsWithComponent} // フィルタ対象フィールド選択用に全フィールドを渡す
        currentFilterConditions={filterConditions}
        onSave={handleFilterConditionsChange} // モーダルで保存されたフィルタ条件を受け取る
      />
      {/* 表示列設定モーダル */}
      <DisplayFieldsModal<GenericRecord>
        open={isDisplayFieldsModalOpen}
        onClose={handleCloseDisplayFieldsModal}
        fields={appSchemaFieldsWithComponent}
        selectedDisplayFields={selectedDisplayFields}
        // onToggleDisplayField={/* このpropsは不要になったため削除 */}
        onSave={handleDisplayFieldsChange} //  onSave を渡す
      />
      {/* カスタムビュー保存（編集）モーダル */}
      <SaveViewModal
        open={isSaveViewModalOpen}
        onClose={handleCloseSaveViewModal}
        appId={appId as string}
        customViews={customViews}
        filterConditions={filterConditions}
        sortConditions={sortConditions}
        selectedDisplayFields={selectedDisplayFields}
        onSaveSuccess={fetchData}
        mode={saveViewMode}
        allFields={appSchemaFieldsWithComponent}
        viewToEditId={editingViewId}
      />
    </Box>
  );
};

export default GenericDataListPage;
