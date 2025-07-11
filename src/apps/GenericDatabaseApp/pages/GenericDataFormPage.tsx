// src/apps/GenericDatabaseApp/pages/GenericDataFormPage.tsx

import React, { FC, useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DynamicForm from "../../../components/DynamicForm.tsx"; // 汎用フォーム
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  IconButton,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"; // Paperはdivのようなもの、CircularProgressはローディング表示

// 共通の型定義をインポート
import {
  AppSchema,
  FormField,
  GenericRecord,
  CommonFormFieldComponent,
  Identifiable,
  User,
} from "../../../types/interfaces";

// アプリスキーマのリポジトリ
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts";
// 汎用データのリポジトリ
import { genericDataRepository } from "../../../repositories/genericDataRepository.ts";
import { getFieldComponentByType } from "../utils/fieldComponentMapper";
import { useUserContext } from "../../../contexts/UserContext.tsx";

import { addSystemFieldsToSchema } from "../utils/appSchemaUtils";

import { userRepository } from "../../../repositories/userRepository.ts";
import { useGlobalDataContext } from "../../../contexts/GlobalDataContext.tsx";

interface GenericDataFormPageProps {}

const GenericDataFormPage: FC<GenericDataFormPageProps> = () => {
  const { appId, recordId } = useParams<{ appId: string; recordId: string }>(); // URLからアプリIDとレコードIDを取得
  const navigate = useNavigate();

  const [appSchema, setAppSchema] = useState<AppSchema | null>(null);
  const [initialRecordData, setInitialRecordData] = useState<GenericRecord | null>(null); // 実際のレコードデータ
  const [isLoading, setIsLoading] = useState<boolean>(true); // 初期ロードは常にtrueから開始
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserContext();
  // 全ユーザー情報 (createdBy/updatedBy の表示名解決用)
  const { allUsers } = useGlobalDataContext();

  // アプリスキーマとレコードデータをロード
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        if (!appId) throw new Error("アプリIDが指定されていません。");
        // 1. アプリスキーマをロード
        const schema = await appSchemaRepository.getById(appId);
        if (!schema) throw new Error("指定されたアプリスキーマが見つかりません。");
        setAppSchema(schema);

        // 2. レコードIDがあれば、実際のレコードデータをロード (編集モード)
        if (recordId) {
          const record = await genericDataRepository.getById(recordId, appId);
          if (record) {
            // ★追加: 最新のスキーマに基づいてレコードデータを補完するロジック
            const complementedRecord: GenericRecord = { ...record };
            if (schema) {
              // スキーマがロードされている場合のみ
              schema.fields.forEach((fieldDef) => {
                if (!(fieldDef.name in complementedRecord)) {
                  // レコードにそのフィールドがなければ
                  // FormField の initialValue を使うか、コンポーネントの getInitialValue を使う
                  const initialVal =
                    fieldDef.initialValue !== undefined
                      ? fieldDef.initialValue
                      : getFieldComponentByType(fieldDef.type).getInitialValue();
                  complementedRecord[fieldDef.name as string] = initialVal;
                }
              });
            }
            setInitialRecordData(record);
          } else {
            setError("指定されたレコードが見つかりません。");
          }
        }
      } catch (err) {
        console.error("Error fetching data for form:", err);
        setError("データの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [appId, recordId]); // appId または recordId が変更されたら再実行

  // DynamicForm に渡す fields は、component プロパティを持つ FormField である必要があるため、変換を行う
  const fieldsForDynamicForm: FormField<GenericRecord, CommonFormFieldComponent<any>>[] = useMemo(() => {
    if (!appSchema) return [];
    return addSystemFieldsToSchema(appSchema);
  }, [appSchema, allUsers]); // allUsers も依存配列に追加 (ユーザー表示名解決のため)

  // DynamicForm の onSubmit ハンドラ
  const handleRecordSubmit = async (data: GenericRecord) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!appId) throw new Error("アプリIDが見つかりません。");
      const currentUserId = currentUser?.id || "guest"; // 現在のユーザーID (ゲストの場合は 'guest')

      if (recordId) {
        // 編集モード
        await genericDataRepository.update(recordId, data, appId, currentUserId);
        alert("レコードが更新されました！");
      } else {
        // 新規作成モード
        await genericDataRepository.create(data, appId, currentUserId);
        alert("レコードが作成されました！");
      }
      navigate(`/generic-db/data/${appId}/list`); // 保存後はリストページに遷移
    } catch (err) {
      console.error("Error saving record:", err);
      setError("レコードの保存に失敗しました。");
      alert("エラーが発生しました: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/generic-db/data/${appId}/list`); // キャンセル時はリストページに遷移
  };

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
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
        <Button onClick={() => navigate(`/generic-db/data/${appId}/list`)} variant="contained">
          リストに戻る
        </Button>
      </Box>
    );
  }

  // スキーマがロードされていないか、編集モードでレコードが見つからない場合
  if (!appSchema || (recordId && !initialRecordData && !isLoading)) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="body1">アプリスキーマまたは指定されたレコードが見つかりません。</Typography>
        <Button onClick={() => navigate("/generic-db/app-schemas/list")} variant="contained">
          アプリ一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <DynamicForm<GenericRecord> // ★GenericRecord 型を渡す
          fields={fieldsForDynamicForm}
          initialData={initialRecordData} // レコードデータを渡す
          onSubmit={handleRecordSubmit}
          onCancel={handleCancel}
          formTitle={
            recordId ? `${appSchema.name} レコードを編集` : `新しい ${appSchema.name} レコードを作成`
          }
          submitButtonText={recordId ? "変更を保存" : "レコードを作成"}
          allUsers={allUsers}
        />
      </Paper>
    </Box>
  );
};

export default GenericDataFormPage;
