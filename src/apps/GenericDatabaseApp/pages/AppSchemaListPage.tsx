import React, { FC, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DynamicList from "../../../components/DynamicList.tsx"; // 汎用リスト

// MUIコンポーネント
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  ListItemText,
  Divider,
  ListItemSecondaryAction,
  List,
  ListItemButton,
  IconButton,
} from "@mui/material";
import {
  AppSchema,
  FormField,
  GenericRecord,
  SortCondition,
  SortDirection,
  User,
} from "../../../types/interfaces";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts";
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx";
import { getFormattedDateString, getFormattedUserName } from "../utils/fieldLabelConverter.ts";
import { userRepository } from "../../../repositories/userRepository.ts";

// AppSchema のリスト表示用のフィールド定義
// DynamicList に渡すため、AppSchema のプロパティに対応する
const appSchemaListFields: FormField<AppSchema, any>[] = [
  { name: "name", label: "アプリ名", type: "text", component: MuiTextFieldWrapper },
  { name: "description", label: "説明", type: "textarea", component: MuiTextFieldWrapper },
  {
    name: "createdBy",
    label: "作成者",
    type: "text", // 将来的にルックアップ表示も考慮
    readOnly: true,
    group: "システム情報",
    component: MuiTextFieldWrapper,
    xs: 12,
    sm: 6,
    md: 3,
    valueFormatter: getFormattedUserName,
  },
  {
    name: "createdAt",
    label: "作成日時",
    type: "text",
    readOnly: true,
    group: "システム情報",
    component: MuiTextFieldWrapper,
    xs: 12,
    sm: 6,
    md: 3,
    valueFormatter: getFormattedDateString,
  },
  {
    name: "updatedBy",
    label: "更新者",
    type: "text", // 将来的にルックアップ表示も考慮
    readOnly: true,
    group: "システム情報",
    component: MuiTextFieldWrapper,
    xs: 12,
    sm: 6,
    md: 3,
    valueFormatter: getFormattedUserName,
  },
  {
    name: "updatedAt",
    label: "更新日時",
    type: "text",
    readOnly: true,
    group: "システム情報",
    component: MuiTextFieldWrapper,
    xs: 12,
    sm: 6,
    md: 3,
    valueFormatter: getFormattedDateString,
  },
];

interface AppSchemaListPageProps {}

const AppSchemaListPage: FC<AppSchemaListPageProps> = () => {
  const navigate = useNavigate();

  const [appSchemas, setAppSchemas] = useState<AppSchema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConditions, setSortConditions] = useState<SortCondition<AppSchema>[]>([]);

  // アプリスキーマデータをロードする関数
  const fetchAppSchemas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appSchemaRepository.getAll();
      setAppSchemas(data);
    } catch (err) {
      console.error("Error fetching app schemas:", err);
      setError("アプリスキーマの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };
  const [allUsers, setAllUsers] = useState<User[] | []>([]);

  // コンポーネントマウント時にアプリスキーマをロード
  useEffect(() => {
    fetchAppSchemas();
    const loadUsers = async () => {
      try {
        const users = await userRepository.getAll();
        setAllUsers(users);
      } catch (err) {
        console.error("Error loading users for display:", err);
      }
    };
    loadUsers();
  }, []);

  const converter = (records: GenericRecord[]): GenericRecord[] => {
    if (appSchemaListFields.length === 0) {
      return [...records];
    }

    let formattedRecords = records.map((record) => {
      const newRecord: GenericRecord = { ...record };

      appSchemaListFields.forEach((fieldDef) => {
        const fieldWithFormatter = appSchemaListFields.find(
          (f) => f.name === fieldDef.name && f.valueFormatter
        );
        if (fieldWithFormatter && fieldWithFormatter.valueFormatter) {
          const originalValue = record[fieldDef.name as keyof GenericRecord];
          newRecord[fieldDef.name as keyof GenericRecord] = fieldWithFormatter.valueFormatter(
            originalValue,
            allUsers
          );
        }
      });
      return newRecord;
    });
    return formattedRecords;
  };

  const filteredAndSortedAppSchemas = useMemo(() => {
    let currentAppSchemas = converter(appSchemas); // 元の配列を変更しないようにコピー
    //let currentAppSchemas = [...appSchemas];
    // 1. フィルタリング
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      currentAppSchemas = currentAppSchemas.filter(
        (schema) =>
          schema.name.toLowerCase().includes(lowercasedSearchTerm) ||
          (schema.description && schema.description.toLowerCase().includes(lowercasedSearchTerm))
      );
    }

    // 2. ソート
    if (sortConditions.length > 0) {
      currentAppSchemas.sort((a, b) => {
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

    return currentAppSchemas;
  }, [appSchemas, searchTerm, sortConditions]); // ★依存配列にソート関連のステートを追加

  // ★追加: ソート変更ハンドラ
  const handleSortConditionsChange = (newSortConditions: SortCondition<AppSchema>[]) => {
    setSortConditions(newSortConditions);
  };

  // アプリスキーマ削除ハンドラ
  const handleDeleteAppSchema = async (id: string) => {
    if (
      window.confirm(
        "このアプリスキーマを本当に削除しますか？\n（関連するデータも削除されます。この機能はまだ未実装です。）"
      )
    ) {
      setIsLoading(true);
      setError(null);
      try {
        await appSchemaRepository.delete(id);
        alert("アプリスキーマが削除されました！");
        // 削除後にリストを再フェッチ
        fetchAppSchemas();
      } catch (err) {
        console.error("Error deleting app schema:", err);
        setError("アプリスキーマの削除に失敗しました。");
        alert("エラーが発生しました: " + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // アプリスキーマ編集ハンドラ (フォームページへ遷移)
  const handleEditAppSchema = (id: string) => {
    navigate(`/generic-db/app-schemas/${id}`); // 編集フォームページへ遷移
  };

  // 新規アプリ作成ページへ遷移
  const handleCreateNewApp = () => {
    navigate("/generic-db/app-schemas/new");
  };
  // ★追加: アプリを実行 (データ一覧ページへ遷移)
  const handleRunApp = (appId: string) => {
    navigate(`/generic-db/data/${appId}/list`);
  };

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          アプリスキーマデータを読み込み中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <Typography variant="body1">エラー: {error}</Typography>
        <Button onClick={fetchAppSchemas} variant="contained">
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        作成済みアプリ ({filteredAndSortedAppSchemas.length} 件)
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <TextField
          label="アプリ検索"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: "300px" }}
        />
        <Button variant="contained" color="primary" onClick={handleCreateNewApp}>
          新しいアプリを作成
        </Button>
      </Box>

      {/* DynamicList コンポーネントを使用 */}
      <DynamicList<AppSchema>
        items={filteredAndSortedAppSchemas as AppSchema[]}
        fields={appSchemaListFields} // AppSchema のフィールド定義を渡す
        onEdit={handleEditAppSchema}
        onDelete={handleDeleteAppSchema}
        itemBasePath="/generic-db/app-schemas" // アプリスキーマ詳細/編集ページのベースパス
        listTitle="アプリ" // DynamicList 内部で「作成済みアプリ」の文字列を生成
        onSortChange={handleSortConditionsChange} // ★修正: onSortChange を渡す
        currentSortConditions={sortConditions} // ★修正: currentSortConditions を渡す
        currentViewType={"table"}
      />

      {/* ★追加: 各アプリのデータ一覧へのリンクボタンも追加 (リスト表示の下) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          データ管理
        </Typography>
        <List>
          {filteredAndSortedAppSchemas.map((app) => (
            <React.Fragment key={app.id}>
              <ListItemButton onClick={() => handleRunApp(app.id)}>
                <ListItemText primary={app.name} secondary="データ一覧を開く" />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="run app">
                    <PlayArrowIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        {filteredAndSortedAppSchemas.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            アプリを作成するとここに表示されます。
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AppSchemaListPage;
