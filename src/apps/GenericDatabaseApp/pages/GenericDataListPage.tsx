import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // ★useParams を追加
import DynamicList from "../../../components/DynamicList.tsx";

// MUIコンポーネント
import SortIcon from "@mui/icons-material/Sort"; // ソートアイコン
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

// 共通の型定義をインポート
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts"; // アプリスキーマのリポジトリ
import { genericDataRepository } from "../../../repositories/genericDataRepository.ts"; // 汎用データのリポジトリ
import {
  AppSchema,
  CommonFormFieldComponent,
  FormField,
  GenericRecord,
  SortCondition,
} from "../../../types/interfaces";
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

  const filteredAndSortedRecords = useMemo(() => {
    let currentRecords = [...records]; // 元の配列を変更しないようにコピー

    // 1. フィルタリング
    if (searchTerm && appSchema) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      currentRecords = currentRecords.filter((record) => {
        return appSchema.fields.some((field) => {
          const fieldValue = record[field.name as string];
          return String(fieldValue).toLowerCase().includes(lowercasedSearchTerm);
        });
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
  }, [records, searchTerm, appSchema, sortConditions]); // ★依存配列にソート関連のステートを追加

  // ★追加: ソート変更ハンドラ
  const handleSortConditionsChange = (newSortConditions: SortCondition<GenericRecord>[]) => {
    setSortConditions(newSortConditions);
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
  /*
  // ★追加: ソート条件追加モーダル内のステート
  const [newSortField, setNewSortField] = useState<keyof GenericRecord | undefined>(undefined);
  const [newSortDirection, setNewSortDirection] = useState<SortDirection>("asc");
  
  // ★追加: ソート条件をモーダルで追加するハンドラ
  const handleAddSortCondition = () => {
    if (newSortField && newSortDirection) {
      const newConditions = [...sortConditions, { field: newSortField, direction: newSortDirection }];
      setSortConditions(newConditions);
      setNewSortField(undefined);
      setNewSortDirection("asc");
    }
  };
  // ★追加: モーダルでソート条件を削除するハンドラ
  const handleRemoveSortCondition = (index: number) => {
    const newConditions = sortConditions.filter((_, i) => i !== index);
    setSortConditions(newConditions);
  };

  // ★追加: ソート条件をモーダルで上下に移動するハンドラ
  const handleMoveSortCondition = (index: number, direction: "up" | "down") => {
    if (sortConditions.length < 2) return;
    const newConditions = [...sortConditions];
    const itemToMove = newConditions[index];

    if (direction === "up") {
      if (index === 0) return;
      newConditions.splice(index, 1);
      newConditions.splice(index - 1, 0, itemToMove);
    } else {
      // down
      if (index === newConditions.length - 1) return;
      newConditions.splice(index, 1);
      newConditions.splice(index + 1, 0, itemToMove);
    }
    setSortConditions(newConditions);
  };
  */
  // ★追加: DynamicList に渡す fields を変換するロジック
  const fieldsForDynamicList = useMemo(() => {
    if (!appSchema) return [];
    return appSchema.fields.map((field) => ({
      ...field,
      component: getFieldComponentByType(field.type), // type に基づいて component を付与
    })) as FormField<GenericRecord, CommonFormFieldComponent<any>>[];
  }, [appSchema]);

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
      {/* ★追加: ソート設定ボタン */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="outlined" startIcon={<SortIcon />} onClick={handleOpenSortModal}>
          ソート設定
        </Button>
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
      />

      {/* ★修正: SortSettingsModal コンポーネントをレンダリング */}
      <SortSettingsModal<GenericRecord>
        open={isSortModalOpen}
        onClose={handleCloseSortModal}
        fields={fieldsForDynamicList} // ソート対象フィールド選択用に全フィールドを渡す
        currentSortConditions={sortConditions}
        onSave={handleSortConditionsChange} // モーダルで保存されたソート条件を受け取る
      />
    </Box>
  );
};

export default GenericDataListPage;
