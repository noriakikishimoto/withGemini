import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // ★useParams を追加
import DynamicList from "../../../components/DynamicList.tsx";

// MUIコンポーネント
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

// 共通の型定義をインポート
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts"; // アプリスキーマのリポジトリ
import { genericDataRepository } from "../../../repositories/genericDataRepository.ts"; // 汎用データのリポジトリ
import { AppSchema, GenericRecord, SortDirection } from "../../../types/interfaces";

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

  const [sortField, setSortField] = useState<keyof GenericRecord | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>(undefined);

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

  // フィルタリングされたレコードリスト
  // filteredFields は AppSchema から取得した fields を使う
  /*
  const filteredRecords = useMemo(() => {
    if (!searchTerm || !appSchema) {
      return records;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    // ユーザー定義フィールドに基づいて検索
    return records.filter((record) => {
      return appSchema.fields.some((field) => {
        const fieldValue = record[field.name as string];
        return String(fieldValue).toLowerCase().includes(lowercasedSearchTerm);
      });
    });
  }, [records, searchTerm, appSchema]);
*/

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
    if (sortField && sortDirection) {
      currentRecords.sort((a, b) => {
        const aValue = String(a[sortField] ?? "").toLowerCase();
        const bValue = String(b[sortField] ?? "").toLowerCase();

        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return currentRecords;
  }, [records, searchTerm, appSchema, sortField, sortDirection]); // ★依存配列にソート関連のステートを追加

  // ★追加: ソート変更ハンドラ
  const handleSortChange = (field: keyof GenericRecord) => {
    let newDirection: SortDirection = "asc";
    if (sortField === field && sortDirection === "asc") {
      newDirection = "desc";
    } else if (sortField === field && sortDirection === "desc") {
      newDirection = undefined; // 3回目のクリックでソートを解除
    }
    setSortField(field);
    setSortDirection(newDirection);
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

      {/* DynamicList コンポーネントを使用 */}
      <DynamicList<GenericRecord> // GenericRecord 型を渡す
        items={filteredAndSortedRecords}
        fields={appSchema.fields} // アプリスキーマから読み込んだフィールド定義を渡す
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
        itemBasePath={`/generic-db/data/${appId}`} // ベースパスに appId を含める
        listTitle={appSchema.name || "レコード"} // アプリ名をタイトルに
        onEditSchema={handleEditSchema}
        // ★追加: ソート関連のPropsを DynamicList に渡す
        onSortChange={handleSortChange}
        currentSortField={sortField}
        currentSortDirection={sortDirection}
      />
    </Box>
  );
};

export default GenericDataListPage;
