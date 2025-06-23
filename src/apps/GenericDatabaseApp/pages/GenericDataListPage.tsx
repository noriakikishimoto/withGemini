import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // ★useParams を追加
import DynamicList from "../../../components/DynamicList.tsx";

// MUIコンポーネント
import FilterListIcon from "@mui/icons-material/FilterList"; // フィルタアイコン
import SortIcon from "@mui/icons-material/Sort"; // ソートアイコン
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

// 共通の型定義をインポート
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts"; // アプリスキーマのリポジトリ
import { genericDataRepository } from "../../../repositories/genericDataRepository.ts"; // 汎用データのリポジトリ
import { customViewRepository } from "../../../repositories/customViewRepository.ts";

import {
  AppSchema,
  CommonFormFieldComponent,
  CustomView,
  FilterCondition,
  FormField,
  GenericRecord,
  SortCondition,
} from "../../../types/interfaces";
import FilterSettingsModal from "../components/FilterSettingsModal.tsx";
import SortSettingsModal from "../components/SortSettingsModal.tsx";
import { getFieldComponentByType } from "../utils/fieldComponentMapper.ts";

interface GenericDataListPageProps {}

const GenericDataListPage: FC<GenericDataListPageProps> = () => {
  const { appId } = useParams<{ appId: string }>(); // URLからアプリIDを取得
  const navigate = useNavigate();

  // アプリスキーマと実際のデータを両方ロード
  const [appSchema, setAppSchema] = useState<AppSchema | null>(null);
  const [records, setRecords] = useState<GenericRecord[]>([]); // 実際のレコードデータ
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  // ★修正: ソートの状態を SortCondition[] で管理
  const [sortConditions, setSortConditions] = useState<SortCondition<GenericRecord>[]>([]);
  // ★追加: フィルタリングの状態を管理
  const [filterConditions, setFilterConditions] = useState<FilterCondition<GenericRecord>[]>([]);
  // ★追加: カスタムビュー関連のステート
  const [customViews, setCustomViews] = useState<CustomView<GenericRecord>[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string | "default">("default"); // 現在選択中のビューID
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false); // ビュー保存モーダル
  const [newViewName, setNewViewName] = useState(""); // 新しいビューの名前

  // データをロードする関数
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!appId) {
        throw new Error("アプリIDが指定されていません。");
      }
      // 1. アプリスキーマをロード
      const schema = await appSchemaRepository.getById(appId);
      if (!schema) {
        throw new Error("指定されたアプリスキーマが見つかりません。");
      }
      setAppSchema(schema);

      // 2. そのスキーマに紐づく実際のレコードデータをロード
      const data = await genericDataRepository.getAll(appId); // appId を渡す
      setRecords(data);

      // ★追加: カスタムビューもロード
      const views = await customViewRepository.getAll(appId); // appId でフィルタリング
      setCustomViews(views);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appId]); // appId が変更されたらデータを再フェッチ

  // ★追加: 現在のビューIDが変更されたら、フィルタ/ソート条件を適用
  useEffect(() => {
    if (currentViewId === "default") {
      setFilterConditions([]);
      setSortConditions([]);
    } else {
      const selectedView = customViews.find((view) => view.id === currentViewId);
      if (selectedView) {
        setFilterConditions(selectedView.filterConditions as FilterCondition<GenericRecord>[]);
        setSortConditions(selectedView.sortConditions as SortCondition<GenericRecord>[]);
      }
    }
  }, [currentViewId, customViews]); // customViews がロードされたら適用

  const filteredAndSortedRecords = useMemo(() => {
    let currentRecords = [...records]; // 元の配列を変更しないようにコピー

    if (appSchema) {
      // appSchema が存在する場合のみフィルタリング
      currentRecords = currentRecords.filter((record) => {
        // テキスト検索
        const passesSearchTerm =
          !searchTerm ||
          appSchema.fields.some((field) => {
            const fieldValue = record[field.name as string];
            return String(fieldValue ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          });

        // 複数条件フィルタリング
        const passesFilterConditions = filterConditions.every((condition) => {
          const fieldDef = appSchema.fields.find((f) => f.name === condition.field);
          if (!fieldDef) return false; // フィールド定義が見つからない場合はスキップ

          let fieldValue = record[condition.field as string];
          let filterValue = condition.value;

          // ★修正: 日付型の比較ロジック
          if (fieldDef.type === "date") {
            const dateFieldValue = fieldValue ? new Date(String(fieldValue)) : null;
            const dateFilterValue = filterValue ? new Date(String(filterValue)) : null;

            // 日付が不正な場合（NaN）は比較しない
            if (
              dateFieldValue === null ||
              dateFilterValue === null ||
              isNaN(dateFieldValue.getTime()) ||
              isNaN(dateFilterValue.getTime())
            ) {
              return false; // または true, 要件によるがここでは false (比較できないので合致しない)
            }
            switch (condition.operator) {
              case "eq":
                return dateFieldValue.getTime() === dateFilterValue.getTime();
              case "ne":
                return dateFieldValue.getTime() !== dateFilterValue.getTime();
              case "gt":
                return dateFieldValue.getTime() > dateFilterValue.getTime();
              case "lt":
                return dateFieldValue.getTime() < dateFilterValue.getTime();
              case "ge":
                return dateFieldValue.getTime() >= dateFilterValue.getTime();
              case "le":
                return dateFieldValue.getTime() <= dateFilterValue.getTime();
              default:
                return true;
            }
          }
          // 数値型の比較ロジック (Number に変換)
          else if (fieldDef.type === "number") {
            const numFieldValue = Number(fieldValue);
            const numFilterValue = Number(filterValue);
            if (isNaN(numFieldValue) || isNaN(numFilterValue)) return false; // 数値でない場合は比較しない
            switch (condition.operator) {
              case "eq":
                return numFieldValue === numFilterValue;
              case "ne":
                return numFieldValue !== numFilterValue;
              case "gt":
                return numFieldValue > numFilterValue;
              case "lt":
                return numFieldValue < numFilterValue;
              case "ge":
                return numFieldValue >= numFilterValue;
              case "le":
                return numFieldValue <= numFilterValue;
              default:
                return true;
            }
          }
          // チェックボックスの比較ロジック
          else if (fieldDef.type === "checkbox") {
            const boolFieldValue = Boolean(fieldValue); // 真偽値に変換
            const boolFilterValue = Boolean(filterValue);
            switch (condition.operator) {
              case "eq":
                return boolFieldValue === boolFilterValue;
              case "ne":
                return boolFieldValue !== boolFilterValue;
              default:
                return true;
            }
          }
          // テキストベースの比較ロジック (文字列に変換して比較)
          else {
            const strFieldValue = String(fieldValue ?? "").toLowerCase();
            const strFilterValue = String(filterValue ?? "").toLowerCase();
            switch (condition.operator) {
              case "eq":
                return strFieldValue === strFilterValue;
              case "ne":
                return strFieldValue !== strFilterValue;
              case "contains":
                return strFieldValue.includes(strFilterValue);
              case "not_contains":
                return !strFieldValue.includes(strFilterValue);
              case "starts_with":
                return strFieldValue.startsWith(strFilterValue);
              case "ends_with":
                return strFieldValue.endsWith(strFilterValue);
              default:
                return true;
            }
          }
        });

        return passesSearchTerm && passesFilterConditions;
      });
    }
    // 2. ソート
    if (sortConditions.length > 0) {
      currentRecords.sort((a, b) => {
        for (const condition of sortConditions) {
          const aValue = String(a[condition.field] ?? "").toLowerCase();
          const bValue = String(b[condition.field] ?? "").toLowerCase();

          if (aValue < bValue) {
            return condition.direction === "asc" ? -1 : 1;
          }
          if (aValue > bValue) {
            return condition.direction === "asc" ? 1 : -1;
          }
        }
        return 0; // 全ての条件で同値の場合
      });
    }

    return currentRecords;
  }, [records, searchTerm, appSchema, sortConditions, filterConditions]); // ★依存配列にソート関連のステートを追加

  // ★追加: ソート変更ハンドラ
  const handleSortConditionsChange = (newSortConditions: SortCondition<GenericRecord>[]) => {
    setSortConditions(newSortConditions);
  };
  // ★追加: フィルタリング条件変更ハンドラ (フィルタ設定モーダルに渡す)
  const handleFilterConditionsChange = (newFilterConditions: FilterCondition<GenericRecord>[]) => {
    setFilterConditions(newFilterConditions);
  };

  // レコード削除ハンドラ
  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm("このレコードを本当に削除しますか？")) {
      setIsLoading(true);
      setError(null);
      try {
        if (!appId) throw new Error("アプリIDが見つかりません。");
        await genericDataRepository.delete(appId, recordId); // appId と recordId を渡す
        alert("レコードが削除されました！");
        fetchData(); // 削除後にリストを再フェッチ
      } catch (err) {
        console.error("Error deleting record:", err);
        setError("レコードの削除に失敗しました。");
        alert("エラーが発生しました: " + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // レコード編集ハンドラ (フォームページへ遷移)
  const handleEditRecord = (recordId: string) => {
    navigate(`/generic-db/data/${appId}/${recordId}`); // 汎用フォームページへ遷移
  };

  // 新規レコード作成ページへ遷移
  const handleCreateNewRecord = () => {
    navigate(`/generic-db/data/${appId}/new`);
  };

  const handleEditSchema = () => {
    if (appId) {
      navigate(`/generic-db/app-schemas/${appId}`); // アプリスキーマ編集画面へ遷移
    }
  };
  // ★追加: ソート設定モーダルを開くステートとハンドラ
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const handleOpenSortModal = () => setIsSortModalOpen(true);
  const handleCloseSortModal = () => setIsSortModalOpen(false);
  // ★追加: フィルタリング設定モーダルを開くステートとハンドラ
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const handleOpenFilterModal = () => setIsFilterModalOpen(true);
  const handleCloseFilterModal = () => setIsFilterModalOpen(false);

  // ★追加: DynamicList に渡す fields を変換するロジック
  const fieldsForDynamicList = useMemo(() => {
    if (!appSchema) return [];
    return appSchema.fields.map((field) => ({
      ...field,
      component: getFieldComponentByType(field.type), // type に基づいて component を付与
    })) as FormField<GenericRecord, CommonFormFieldComponent<any>>[];
  }, [appSchema]);

  // ★追加: ビュー保存モーダル関連ハンドラ
  const handleOpenSaveViewModal = () => {
    setIsSaveViewModalOpen(true);
    setNewViewName(""); // 名前をリセット
  };
  const handleCloseSaveViewModal = () => setIsSaveViewModalOpen(false);

  const handleSaveView = async () => {
    if (!newViewName.trim()) {
      alert("ビュー名を入力してください。");
      return;
    }
    if (!appId) {
      alert("アプリIDが見つかりません。");
      return;
    }

    const newView: Omit<CustomView<GenericRecord>, "id"> = {
      name: newViewName.trim(),
      appId: appId,
      filterConditions: filterConditions,
      sortConditions: sortConditions,
    };

    try {
      await customViewRepository.create(newView, appId); // appId を渡して作成
      alert("ビューが保存されました！");
      fetchData(); // ビューリストを再ロード
      setIsSaveViewModalOpen(false);
    } catch (err) {
      console.error("Error saving view:", err);
      alert("ビューの保存に失敗しました。");
    }
  };

  // ★追加: ビュー削除ハンドラ (リストアイテムから直接呼び出す)
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
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        {/* ★追加: ソート設定ボタン */}
        <Button variant="outlined" startIcon={<SortIcon />} onClick={handleOpenSortModal}>
          ソート設定
        </Button>
        {/* ★追加: フィルタリング設定ボタン */}
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={handleOpenFilterModal}>
          絞り込み設定
        </Button>
        {/* ★追加: ビュー保存ボタン */}
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenSaveViewModal}>
          ビューを保存
        </Button>
      </Box>
      {/* ★追加: カスタムビュー切り替えドロップダウン */}
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>ビュー</InputLabel>
          <Select
            value={currentViewId}
            label="ビュー"
            onChange={(e) => setCurrentViewId(e.target.value as string)}
          >
            <MenuItem value="default">デフォルトビュー</MenuItem>
            {customViews.map((view) => (
              <MenuItem key={view.id} value={view.id}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Typography variant="inherit">{view.name}</Typography>
                  {/* ★追加: ビュー削除ボタン */}
                  <IconButton
                    edge="end"
                    aria-label={`ビュー ${view.name} を削除`}
                    onClick={(e) => {
                      e.stopPropagation(); // Select のクリックイベントが発火しないように
                      handleDeleteView(view.id);
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {/* DynamicList コンポーネントを使用 */}
      <DynamicList<GenericRecord> // GenericRecord 型を渡す
        items={filteredAndSortedRecords}
        fields={fieldsForDynamicList} // アプリスキーマから読み込んだフィールド定義を渡す
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
        itemBasePath={`/generic-db/data/${appId}`} // ベースパスに appId を含める
        listTitle={appSchema.name || "レコード"} // アプリ名をタイトルに
        onEditSchema={handleEditSchema}
        // ★追加: ソート関連のPropsを DynamicList に渡す
        onSortChange={handleSortConditionsChange} // ★修正: onSortChange を渡す
        currentSortConditions={sortConditions} // ★修正: currentSortConditions を渡す
        onFilterChange={handleFilterConditionsChange} // ★追加: onFilterChange を渡す
        currentFilterConditions={filterConditions} // ★追加: currentFilterConditions を渡す
      />
      {/* ★修正: SortSettingsModal コンポーネントをレンダリング */}
      <SortSettingsModal<GenericRecord>
        open={isSortModalOpen}
        onClose={handleCloseSortModal}
        fields={fieldsForDynamicList} // ソート対象フィールド選択用に全フィールドを渡す
        currentSortConditions={sortConditions}
        onSave={handleSortConditionsChange} // モーダルで保存されたソート条件を受け取る
      />
      {/* ★修正: フィルタリング設定モーダルを SortSettingsModal と同様にレンダリング */}
      <FilterSettingsModal<GenericRecord>
        open={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        fields={fieldsForDynamicList} // フィルタ対象フィールド選択用に全フィールドを渡す
        currentFilterConditions={filterConditions}
        onSave={handleFilterConditionsChange} // モーダルで保存されたフィルタ条件を受け取る
      />

      {/* ★追加: ビュー保存モーダル */}
      <Dialog open={isSaveViewModalOpen} onClose={handleCloseSaveViewModal} fullWidth maxWidth="md">
        <DialogTitle>ビューを保存</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ビュー名"
            type="text"
            fullWidth
            variant="standard"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveViewModal}>キャンセル</Button>
          <Button onClick={handleSaveView}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenericDataListPage;
