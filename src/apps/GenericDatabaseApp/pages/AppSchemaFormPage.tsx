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
  FormFieldType,
  FormFieldSelectOption,
  CommonFormFieldComponent,
  Identifiable,
} from "../../../types/interfaces";
import { Edit as EditIcon, Delete as DeleteIcon, Share as ShareIcon } from "@mui/icons-material";

import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx";
import MuiCheckboxWrapper from "../../../components/FormFields/MuiCheckboxWrapper.tsx";
import MuiDatePickerWrapper from "../../../components/FormFields/MuiDatePickerWrapper.tsx";
import MuiSelectFieldWrapper from "../../../components/FormFields/MuiSelectFieldWrapper.tsx";

import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts";

// アプリケーションスキーマ自体のフィールド定義
// これは AppSchema を作成するためのフォームなので、そのフィールドを定義する
const appSchemaFields: FormField<AppSchema, CommonFormFieldComponent<any>>[] = [
  {
    name: "name",
    label: "アプリ名",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
  },
  {
    name: "description",
    label: "説明",
    type: "textarea",
    multiline: true,
    rows: 3,
    component: MuiTextFieldWrapper,
  },
];

// フィールド定義の種類 (name, label, type, required, multiline, rows, options)
// このフィールド定義をさらに動的に追加できるようにする
const baseFieldDefinitionFields: FormField<FormField<any, any>, CommonFormFieldComponent<any>>[] = [
  {
    name: "name",
    label: "フィールド名 (内部)",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
  },
  {
    name: "label",
    label: "表示名",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
  },
  {
    name: "type",
    label: "タイプ",
    type: "select",
    required: true,
    options: [
      { value: "text", label: "テキスト" },
      { value: "textarea", label: "複数行テキスト" },
      { value: "number", label: "数値" },
      { value: "date", label: "日付" },
      { value: "checkbox", label: "チェックボックス" },
      { value: "select", label: "選択リスト" },
    ] as FormFieldSelectOption[],
    component: MuiSelectFieldWrapper,
  },
  {
    name: "required",
    label: "必須",
    type: "checkbox",
    component: MuiCheckboxWrapper,
  },
  // multiline, rows, options は動的に表示を切り替える必要があるが、一旦シンプルに
];

interface AppSchemaFormPageProps {}

const AppSchemaFormPage: FC<AppSchemaFormPageProps> = () => {
  const { id } = useParams<{ id: string }>(); // URLからIDを取得 (編集モード用)
  const navigate = useNavigate();

  const [appSchema, setAppSchema] = useState<AppSchema | null>(null);
  //const [initialAppSchemaData, setInitialAppSchemaData] = useState<AppSchema | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);

  const [currentFieldTypeInModal, setCurrentFieldTypeInModal] = useState<FormFieldType>("text"); // モーダル内のフィールドタイプを追跡

  // フィールド定義追加/編集用のステート
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false); // フィールド編集モーダルの開閉
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null); // 編集中のフィールドのインデックス
  // 編集中のフィールドの初期データ (DynamicForm に渡すため)
  const editingFieldInitialData: Omit<FormField<any, any>, "component"> | null = React.useMemo(() => {
    if (editingFieldIndex !== null && appSchema && appSchema.fields[editingFieldIndex]) {
      const fieldDef = appSchema.fields[editingFieldIndex];

      return {
        ...fieldDef,
      } as Omit<FormField<any, any>, "component">; // 型キャスト
    }
    return null;
  }, [editingFieldIndex, appSchema]);

  // 編集モードの場合、アプリスキーマデータをロード
  useEffect(() => {
    if (id) {
      const fetchAppSchema = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await appSchemaRepository.getById(id);
          if (data) {
            setAppSchema(data);
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
  }, [id]);

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
        fields: appSchema?.fields || [], // 既存のフィールド定義を保持 (今はUIで編集できないため)
      };

      if (id) {
        // 編集モード
        await appSchemaRepository.update(id, appSchemaToSave);
        alert("アプリスキーマが更新されました！");
      } else {
        // 新規作成モード
        await appSchemaRepository.create(appSchemaToSave);
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
  // ★追加: フィールド編集モーダル関連ハンドラ
  const handleAddField = () => {
    setEditingFieldIndex(null); // 新規追加モード
    setIsFieldModalOpen(true);
    setCurrentFieldTypeInModal("text");
  };
  const handleEditField = (index: number) => {
    setEditingFieldIndex(index); // 編集モード
    setIsFieldModalOpen(true);
    if (appSchema && appSchema.fields[index]) {
      // 編集対象のフィールドタイプをモーダルにセット
      setCurrentFieldTypeInModal(appSchema.fields[index].type);
    }
  };

  const handleDeleteField = (index: number) => {
    if (!appSchema) return;
    if (window.confirm("このフィールド定義を本当に削除しますか？")) {
      const updatedFields = appSchema.fields.filter((_, i) => i !== index);
      setAppSchema({ ...appSchema, fields: updatedFields }); // ステートを更新
      alert("フィールドが削除されました。");
      // ★TODO: ローカルストレージにも保存する必要があるが、メインのSubmitでまとめて行う
    }
  };

  const handleFieldModalSubmit = (fieldData: Omit<FormField<any, any>, "component">) => {
    if (!appSchema) return;
    //let updatedFields = [...appSchema.fields];
    let updatedFields: Omit<FormField<any, any>, "component">[] = [...appSchema.fields]; // ★ここ！
    // ★追加: フォームから渡された fieldData の中身を確認
    console.log("DEBUG: handleFieldModalSubmit - Received fieldData:", fieldData);

    const processedFieldData = { ...fieldData }; // fieldData のコピーを作成

    if (processedFieldData.type === "select") {
      console.log(typeof processedFieldData.options);

      // options が文字列として存在する場合、FormFieldSelectOption[] に変換
      if (typeof processedFieldData.options === "string") {
        const optionsString = processedFieldData.options;
        processedFieldData.options = optionsString
          .split(",")
          .map((s) => ({ value: s.trim(), label: s.trim() }));
      } else {
        // もし options が文字列でなければ、空の配列にするなど適切な処理
        processedFieldData.options = [];
      }
    }
    // その他のタイプの場合、options プロパティは存在しないか、適切に処理されるため、変更なし
    // ★追加: 保存しようとしている fieldToSave の中身を確認
    console.log("DEBUG: handleFieldModalSubmit - Prepared fieldToSave:", processedFieldData);

    // rows や multiline も保存されるが、DynamicForm からは適切な型で渡されるはずなのでそのまま

    if (editingFieldIndex !== null) {
      // 編集の場合
      updatedFields[editingFieldIndex] = fieldData;
    } else {
      // 新規追加の場合
      updatedFields.push(fieldData);
    }
    setAppSchema({ ...appSchema, fields: updatedFields }); // ステートを更新
    setIsFieldModalOpen(false); // モーダルを閉じる
    setEditingFieldIndex(null); // 編集状態をリセット
  };

  const handleFieldModalClose = () => {
    setIsFieldModalOpen(false);
    setEditingFieldIndex(null);
  };

  const dynamicFieldDefinitionFields = useMemo(() => {
    // fields の型をよりシンプルに、最終的に FormField<any, CommonFormFieldComponent<any>>[] になるようにする
    const fields: FormField<any, CommonFormFieldComponent<any>>[] = [...baseFieldDefinitionFields]; // ★修正
    switch (currentFieldTypeInModal) {
      case "select":
        fields.push({
          name: "options",
          label: "選択肢 (カンマ区切り)",
          type: "text",
          component: MuiTextFieldWrapper,
          initialValue: "",
        });
        break;
      case "textarea":
        fields.push({
          name: "rows",
          label: "行数",
          type: "number",
          component: MuiTextFieldWrapper,
          initialValue: 4,
        });
        fields.push({
          // textarea の場合、multiline は常に true と見なされることが多いが、定義は残す
          name: "multiline",
          label: "複数行",
          type: "checkbox",
          component: MuiCheckboxWrapper,
          initialValue: true, // textarea のデフォルトは true
        });
        break;
      case "text": // テキストタイプの場合、multiline オプションのみ
        fields.push({
          name: "multiline",
          label: "複数行",
          type: "checkbox",
          component: MuiCheckboxWrapper,
          initialValue: false,
        });
        break;
      // 'number', 'date', 'checkbox' の場合は追加フィールドなし
      default:
        break;
    }
    return fields;
  }, [currentFieldTypeInModal]);

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
        />
      </Paper>

      {/* ★追加: フィールド定義セクション */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            フィールド定義 ({appSchema?.fields.length || 0} 件)
          </Typography>
          <Button variant="contained" onClick={handleAddField}>
            フィールドを追加
          </Button>
        </Box>

        {appSchema?.fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            このアプリにはまだフィールドが定義されていません。
          </Typography>
        ) : (
          <List>
            {appSchema?.fields.map((fieldDef, index) => (
              <React.Fragment key={fieldDef.name as string}>
                {" "}
                {/* key は name を使う */}
                <ListItemButton>
                  <ListItemText
                    primary={`${fieldDef.label} (${fieldDef.name as string})`}
                    secondary={`タイプ: ${fieldDef.type}${fieldDef.required ? " (必須)" : ""}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditField(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteField(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* ★追加: フィールド追加/編集用のモーダル */}
      <Dialog open={isFieldModalOpen} onClose={handleFieldModalClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingFieldIndex !== null ? "フィールドを編集" : "新しいフィールドを追加"}
        </DialogTitle>
        <DialogContent>
          <DynamicForm<Omit<FormField<any, any>, "component">> // フィールド定義自体を DynamicForm で編集
            fields={dynamicFieldDefinitionFields} // ★修正: 動的に生成されたフィールド定義を渡す
            initialData={editingFieldInitialData}
            onSubmit={handleFieldModalSubmit}
            onCancel={handleFieldModalClose} // モーダル内のキャンセルボタン
            submitButtonText={editingFieldIndex !== null ? "保存" : "追加"}
            // ★追加: DynamicForm のフィールド変更を AppSchemaFormPage に通知する
            onFieldChange={(fieldName, value) => {
              if (fieldName === "type") {
                // 変更されたフィールドが 'type' の場合
                setCurrentFieldTypeInModal(value as FormFieldType); // currentFieldTypeInModal を更新
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFieldModalClose} color="secondary">
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppSchemaFormPage;
