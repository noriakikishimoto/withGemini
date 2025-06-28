import { Box, Button, Paper } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DynamicForm from "../../../components/DynamicForm.tsx";

// 共通の型定義をインポート
import { AppSchema, CommonFormFieldComponent, FormField, User } from "../../../types/interfaces";
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx";
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts";
import AppSchemaFieldsEditor from "../components/AppSchemaFieldsEditor.tsx";
import { useUserContext } from "../../../contexts/UserContext.tsx";
import { getFormattedDateString, getFormattedUserName } from "../utils/fieldLabelConverter";
import { userRepository } from "../../../repositories/userRepository.ts";

const appSchemaFields: FormField<AppSchema, CommonFormFieldComponent<any>>[] = [
  {
    name: "name",
    label: "アプリ名",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
    xs: 12, // ★追加: 全幅を占める
    sm: 12, // ★追加: 小画面以上で半分
    md: 12, // ★追加: 中画面以上で1/3
  },
  {
    name: "description",
    label: "説明",
    type: "textarea",
    multiline: true,
    rows: 3,
    component: MuiTextFieldWrapper,
    xs: 12, // ★追加: 全幅を占める
  },
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
  },
];

interface AppSchemaFormPageProps {}

const AppSchemaFormPage: FC<AppSchemaFormPageProps> = () => {
  const { id } = useParams<{ id: string }>(); // URLからIDを取得 (編集モード用)
  const navigate = useNavigate();
  const [appSchema, setAppSchema] = useState<AppSchema | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserContext();
  const [allUsers, setAllUsers] = useState<User[] | []>([]);

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
  }, []);

  // 編集モードの場合、アプリスキーマデータをロード
  useEffect(() => {
    if (id) {
      const fetchAppSchema = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await appSchemaRepository.getById(id);
          if (data) {
            let dataWithName = {
              ...data,
              createdAt: data.createdAt ? getFormattedDateString(data.createdAt) : data.createdAt,
              updatedAt: data.updatedAt ? getFormattedDateString(data.updatedAt) : data.updatedAt,
              createdBy: data.createdBy
                ? getFormattedUserName(data.createdBy, allUsers)
                : data.createdBy,
              updatedBy: data.updatedBy
                ? getFormattedUserName(data.updatedBy, allUsers)
                : data.updatedBy,
            };
            setAppSchema(dataWithName);
          } else {
            setError("指定されたアプリスキーマが見つかりません。");
          }
        } catch (err) {
          console.error("Error fetching app schema details:", err);
          setError("アプリスキーマの読み込みに失敗しました。");
        } finally {
          setIsLoading(false);
        }
      };
      fetchAppSchema();
    } else {
      // 新規作成モードの場合、初期スキーマを設定
      setAppSchema({ id: "", name: "", description: "", fields: [] }); // 空の AppSchema で初期化
      setIsLoading(false);
    }
  }, [id, allUsers]);

  // DynamicForm の onSubmit ハンドラ
  const handleAppSchemaSubmit = async (data: AppSchema) => {
    setIsLoading(true);
    setError(null);
    try {
      // fields プロパティは DynamicForm が自動的に管理しているので、
      // ここでは AppSchema の name と description だけを扱う
      const appSchemaToSave: Omit<AppSchema, "id"> = {
        name: data.name,
        description: data.description,
        fields: appSchema?.fields || [],
      };

      if (id) {
        // 編集モード
        await appSchemaRepository.update(id, appSchemaToSave, currentUser?.id);
        alert("アプリスキーマが更新されました！");
      } else {
        // 新規作成モード
        await appSchemaRepository.create(appSchemaToSave, currentUser?.id);
        alert("アプリスキーマが作成されました！");
      }
      navigate("/generic-db/app-schemas/list"); // 保存後はリストページに遷移
    } catch (err) {
      console.error("Error saving app schema:", err);
      setError("アプリスキーマの保存に失敗しました。");
      alert("エラーが発生しました: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppSchemaForm = () => {
    navigate("/generic-db/app-schemas/list"); // キャンセル時はリストページに遷移
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if (!appSchema || !appSchema.fields || appSchema.fields.length < 2) return; // 2つ以上ないと移動できない
    const newFields = [...appSchema.fields];
    const currentField = newFields[index];

    if (direction === "up") {
      if (index === 0) return; // 先頭の場合は移動できない
      newFields.splice(index, 1); // 現在の場所から削除
      newFields.splice(index - 1, 0, currentField); // 1つ上の位置に挿入
    } else {
      // 'down'
      if (index === newFields.length - 1) return; // 末尾の場合は移動できない
      newFields.splice(index, 1); // 現在の場所から削除
      newFields.splice(index + 1, 0, currentField); // 1つ下の位置に挿入
    }
    setAppSchema({ ...appSchema, fields: newFields }); // appSchema ステートを更新
  };

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <p>アプリスキーマデータを読み込み中...</p>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <p>エラー: {error}</p>
        <Button onClick={() => navigate("/generic-db/app-schemas/list")} variant="contained">
          リストに戻る
        </Button>
      </Box>
    );
  }

  if (id && !appSchema && !isLoading) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <p>指定されたアプリスキーマが見つかりません。</p>
        <Button onClick={() => navigate("/generic-db/app-schemas/list")} variant="contained">
          リストに戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        {" "}
        {/* メインのアプリスキーマフォームをPaperで囲む */}
        <DynamicForm<AppSchema>
          fields={appSchemaFields}
          initialData={appSchema} // appSchema 全体を渡す
          onSubmit={handleAppSchemaSubmit}
          onCancel={handleCancelAppSchemaForm}
          formTitle={id ? "アプリスキーマを編集" : "新しいアプリを作成"}
          submitButtonText={id ? "変更を保存" : "アプリを作成"}
          onFieldChange={(fieldName, value) => {
            // appSchema ステートをリアルタイムで更新
            setAppSchema((prev) => {
              if (!prev) return null; // prev が null の場合は何もしない
              return { ...prev, [fieldName]: value }; // name または description を更新
            });
          }}
        />
      </Paper>

      {/* AppSchemaFieldsEditor に必要な Props を渡す */}
      <AppSchemaFieldsEditor
        fields={appSchema ? appSchema.fields : []} // appSchema の fields を渡す
        onFieldsChange={(newFields) => {
          setAppSchema((prev) => ({ ...prev!, fields: newFields })); // 変更を appSchema ステートに反映
        }}
        onIndexChange={handleMoveField}
      />
    </Box>
  );
};

export default AppSchemaFormPage;
