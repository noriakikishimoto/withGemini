import React, { FC, useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  IconButton,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

import DynamicForm from "../../../components/DynamicForm.tsx"; // 汎用フォーム
import {
  CommonFormFieldComponent,
  FormField,
  FormFieldSelectOption,
  FormFieldType,
} from "../../../types/interfaces"; // 共通型
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx"; // フィールド定義フォームで使うため
import MuiCheckboxWrapper from "../../../components/FormFields/MuiCheckboxWrapper.tsx"; // フィールド定義フォームで使うため
import MuiSelectFieldWrapper from "../../../components/FormFields/MuiSelectFieldWrapper.tsx"; // フィールド定義フォームで使うため

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
      { value: "radio", label: "ラジオボタン" },
      { value: "email", label: "メールアドレス" },
      { value: "lookup", label: "ルックアップ" },
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

interface AppSchemaFieldsEditorProps {
  fields: Omit<FormField<any, any>, "component">[]; // 親から渡される現在のフィールド定義の配列
  onFieldsChange: (newFields: Omit<FormField<any, any>, "component">[]) => void; // 親にフィールド定義の変更を通知するコールバック
  onIndexChange: (index: number, direction: "up" | "down") => void;
}

const AppSchemaFieldsEditor: FC<AppSchemaFieldsEditorProps> = ({
  fields,
  onFieldsChange,
  onIndexChange,
}) => {
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [currentFieldTypeInModal, setCurrentFieldTypeInModal] = useState<FormFieldType>("text");

  const editingFieldInitialData: Omit<FormField<any, any>, "component"> | null = React.useMemo(() => {
    if (editingFieldIndex !== null && fields && fields[editingFieldIndex]) {
      const fieldDef = fields[editingFieldIndex];

      return {
        ...fieldDef,
      } as Omit<FormField<any, any>, "component">; // 型キャスト
    }
    return null;
  }, [editingFieldIndex, fields]);

  const handleAddField = () => {
    setEditingFieldIndex(null); // 新規追加モード
    setIsFieldModalOpen(true);
    setCurrentFieldTypeInModal("text");
  };
  const handleEditField = (index: number) => {
    setEditingFieldIndex(index); // 編集モード
    setIsFieldModalOpen(true);
    if (fields && fields[index]) {
      // 編集対象のフィールドタイプをモーダルにセット
      setCurrentFieldTypeInModal(fields[index].type);
    }
  };

  const handleDeleteField = (index: number) => {
    if (window.confirm("このフィールド定義を本当に削除しますか？")) {
      const updatedFields = fields.filter((_, i) => i !== index);
      onFieldsChange(updatedFields); // 親に通知
      alert("フィールドが削除されました。");
    }
  };

  const handleFieldModalSubmit = (fieldData: Omit<FormField<any, any>, "component">) => {
    let updatedFields: Omit<FormField<any, any>, "component">[] = [...fields];

    const processedFieldData = { ...fieldData }; // fieldData のコピーを作成

    if (processedFieldData.type === "select") {
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

    if (processedFieldData.type === "lookup") {
      processedFieldData.lookupDisplayFields = processedFieldData.lookupDisplayFields ?? "";

      if (Array.isArray(processedFieldData.lookupCopyToFields)) {
        try {
          processedFieldData.lookupCopyToFields = processedFieldData.lookupCopyToFields;
        } catch (e) {
          console.error("Error stringifying lookupCopyToFields:", e);
          processedFieldData.lookupCopyToFields = "";
        }
      } else {
        processedFieldData.lookupCopyToFields = "";
      }
    } else {
      delete processedFieldData.lookupAppId;
      delete processedFieldData.lookupKeyField;
      delete processedFieldData.lookupDisplayFields;
    }

    // rows や multiline も保存されるが、DynamicForm からは適切な型で渡されるはずなのでそのまま

    if (
      processedFieldData.type !== "text" &&
      processedFieldData.type !== "textarea" &&
      processedFieldData.type !== "number" &&
      processedFieldData.type !== "email" &&
      processedFieldData.type !== "lookup"
    ) {
      delete processedFieldData.multiline;
    }
    if (processedFieldData.type !== "textarea") {
      delete processedFieldData.rows;
    }
    // ★追加: group, xs, sm, md のクリーンアップ
    const hasLayoutProps =
      processedFieldData.group !== undefined ||
      processedFieldData.xs !== undefined ||
      processedFieldData.sm !== undefined ||
      processedFieldData.md !== undefined;

    if (!hasLayoutProps) {
      // もし layoutProps が設定されていなければ削除
      delete processedFieldData.group;
      delete processedFieldData.xs;
      delete processedFieldData.sm;
      delete processedFieldData.md;
    }

    if (editingFieldIndex !== null) {
      // 編集の場合
      updatedFields[editingFieldIndex] = fieldData;
    } else {
      // 新規追加の場合
      updatedFields.push(fieldData);
    }
    onFieldsChange(updatedFields); // ステートを更新
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
      case "radio":
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
      case "lookup":
        fields.push({
          name: "lookupAppId",
          label: "参照元アプリID",
          type: "text", // 将来的にアプリ選択ドロップダウンに
          component: MuiTextFieldWrapper,
          required: true,
          initialValue: "",
        });
        fields.push({
          name: "lookupKeyField",
          label: "キーフィールド名",
          type: "text", // 将来的にフィールド選択ドロップダウンに
          component: MuiTextFieldWrapper,
          required: true,
          initialValue: "",
        });
        fields.push({
          name: "lookupDisplayFields",
          label: "表示フィールド (カンマ区切り)",
          type: "text", // 複数フィールドをカンマ区切りで入力
          component: MuiTextFieldWrapper,
          initialValue: "",
        });
        // ★追加: lookupCopyToFields の入力欄 (from/to のペア)
        fields.push({
          name: "lookupCopyToFields",
          label: "コピー先フィールド (元フィールド名:コピー先フィールド名, ...)", // 例: "氏名:顧客名, 住所:顧客住所"
          type: "text",
          component: MuiTextFieldWrapper,
          initialValue: "",
        });
        break;
      // 'number', 'date', 'checkbox' の場合は追加フィールドなし
      default:
        break;
    }
    // ★追加: group, xs, sm, md の入力フィールドを常に表示
    // どのタイプでもレイアウト設定は可能
    fields.push({
      name: "group",
      label: "グループ名",
      type: "text",
      component: MuiTextFieldWrapper,
      initialValue: "",
    });
    fields.push({
      name: "xs",
      label: "幅 (xs)",
      type: "number",
      component: MuiTextFieldWrapper,
      initialValue: 12,
    });
    fields.push({
      name: "sm",
      label: "幅 (sm)",
      type: "number",
      component: MuiTextFieldWrapper,
      initialValue: 12,
    });
    fields.push({
      name: "md",
      label: "幅 (md)",
      type: "number",
      component: MuiTextFieldWrapper,
      initialValue: 6,
    }); // デフォルトを6に

    return fields;
  }, [currentFieldTypeInModal]);

  return (
    <>
      <Paper sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            フィールド定義 ({fields.length || 0} 件)
          </Typography>
          <Button variant="contained" onClick={handleAddField}>
            フィールドを追加
          </Button>
        </Box>

        {fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            このアプリにはまだフィールドが定義されていません。
          </Typography>
        ) : (
          <List>
            {fields.map((fieldDef, index) => (
              <React.Fragment key={fieldDef.name as string}>
                {" "}
                {/* key は name を使う */}
                <ListItemButton>
                  <ListItemText
                    primary={`${fieldDef.label} (${fieldDef.name as string}) `}
                    secondary={`タイプ: ${fieldDef.type}${fieldDef.required ? " (必須)" : ""}／グループ：${fieldDef.group ? (fieldDef.group as string) : "設定なし"}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditField(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteField(index)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="move up"
                      onClick={() => onIndexChange(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="move down"
                      onClick={() => onIndexChange(index, "down")}
                      disabled={index === fields.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
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
    </>
  );
};

export default AppSchemaFieldsEditor;
