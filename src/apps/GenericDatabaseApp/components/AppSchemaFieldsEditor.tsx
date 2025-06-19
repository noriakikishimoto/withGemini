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
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

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
// AppSchemaFormPage から移動されるフィールド定義
const baseFieldDefinitionFields: FormField<
  Omit<FormField<any, any>, "component">,
  CommonFormFieldComponent<any>
>[] = [
  {
    name: "name",
    label: "フィールド名 (内部)",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
    initialValue: "",
  },
  {
    name: "label",
    label: "表示名",
    type: "text",
    required: true,
    component: MuiTextFieldWrapper,
    initialValue: "",
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
    initialValue: "text",
  },
  {
    name: "required",
    label: "必須",
    type: "checkbox",
    component: MuiCheckboxWrapper,
    initialValue: false,
  },
];

interface AppSchemaFieldsEditorProps {
  fields: Omit<FormField<any, any>, "component">[]; // 親から渡される現在のフィールド定義の配列
  onFieldsChange: (newFields: Omit<FormField<any, any>, "component">[]) => void; // 親にフィールド定義の変更を通知するコールバック

  // ★追加: モーダル内のフォームのデータが変更されたときに親に通知するコールバック
  //onFieldModalFormChange: (data: Omit<FormField<any, any>, "component">) => void;
  // ★追加: 編集中のフィールドの初期データ (親から渡される)
  //editingFieldInitialData: Omit<FormField<any, any>, "component"> | null;
}

const AppSchemaFieldsEditor: FC<AppSchemaFieldsEditorProps> = ({
  fields,
  onFieldsChange,
  // onFieldModalFormChange,
  // editingFieldInitialData, // ★Propsとして受け取る
}) => {
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [currentFieldTypeInModal, setCurrentFieldTypeInModal] = useState<FormFieldType>("text");

  const editingFieldInitialData: Omit<FormField<any, any>, "component"> | null = useMemo(() => {
    if (editingFieldIndex !== null && fields[editingFieldIndex]) {
      const fieldDef = fields[editingFieldIndex];

      let parsedOptions: FormFieldSelectOption[] | undefined;
      if (typeof fieldDef.options === "string") {
        try {
          parsedOptions = (fieldDef.options as string)
            .split(",")
            .map((s: string) => ({ value: s.trim(), label: s.trim() }));
        } catch (e) {
          console.error("Error parsing options string for initial data:", e);
          parsedOptions = undefined;
        }
      } else if (Array.isArray(fieldDef.options)) {
        parsedOptions = fieldDef.options as FormFieldSelectOption[];
      } else {
        parsedOptions = undefined;
      }

      const parsedRows = fieldDef.rows !== undefined ? fieldDef.rows : undefined;
      const parsedMultiline = fieldDef.multiline !== undefined ? fieldDef.multiline : undefined;

      return {
        ...fieldDef,
        options: parsedOptions,
        rows: parsedRows,
        multiline: parsedMultiline,
      } as Omit<FormField<any, any>, "component">;
    }
    return null;
  }, [editingFieldIndex, fields]); // fields も依存配列に入れる

  // useEffect で currentFieldTypeInModal をセットするロジックは必要 (handleEditField から)

  useEffect(() => {
    if (editingFieldIndex !== null && editingFieldInitialData) {
      setCurrentFieldTypeInModal(editingFieldInitialData.type);
    } else {
      setCurrentFieldTypeInModal("text"); // 新規の場合はデフォルト
    }
  }, [editingFieldIndex, editingFieldInitialData]); // editingFieldInitialData が変わったらタイプを更新

  // フィールド編集モーダル関連ハンドラ
  const handleAddField = () => {
    setEditingFieldIndex(null); // 新規追加モード
    setIsFieldModalOpen(true);
    // 新規追加時の initialData は DynamicForm が fields 定義から生成するので、ここで渡す必要はない
    // setCurrentFieldTypeInModal('text'); // handleFieldModalOpen で設定
  };

  const handleEditField = (index: number) => {
    setEditingFieldIndex(index); // 編集モード
    setIsFieldModalOpen(true);
    // currentFieldTypeInModal は useEffect で initialData から設定される
    // if (fields[index]) { setCurrentFieldTypeInModal(fields[index].type); }
  };

  const handleDeleteField = (index: number) => {
    if (window.confirm("このフィールド定義を本当に削除しますか？")) {
      const updatedFields = fields.filter((_, i) => i !== index);
      onFieldsChange(updatedFields); // 親にフィールド定義の変更を通知
      alert("フィールドが削除されました。");
    }
  };

  // フィールドモーダル内の DynamicForm の onSubmit ハンドラ
  const handleFieldModalSubmit = (fieldData: Omit<FormField<any, any>, "component">) => {
    let updatedFields = [...fields]; // 親から渡された fields のコピーを作成

    const fieldDataToSave = { ...fieldData }; // fieldData のコピー

    if (fieldDataToSave.type === "select") {
      if (Array.isArray(fieldDataToSave.options)) {
        fieldDataToSave.options = (fieldDataToSave.options as FormFieldSelectOption[])
          .map((opt) => opt.value)
          .join(",");
      } else {
        fieldDataToSave.options = "";
      }
    } else {
      delete fieldDataToSave.options;
    }
    if (fieldDataToSave.type !== "text" && fieldDataToSave.type !== "textarea") {
      delete fieldDataToSave.multiline;
    }
    if (fieldDataToSave.type !== "textarea") {
      delete fieldDataToSave.rows;
    }

    if (editingFieldIndex !== null) {
      updatedFields[editingFieldIndex] = fieldDataToSave;
    } else {
      updatedFields.push(fieldDataToSave);
    }
    onFieldsChange(updatedFields); // 親にフィールド定義の変更を通知
    setIsFieldModalOpen(false);
    setEditingFieldIndex(null);
  };

  const handleFieldModalClose = () => {
    setIsFieldModalOpen(false);
    setEditingFieldIndex(null);
  };

  // フィールドタイプに応じて DynamicForm に渡すフィールド定義を動的に生成
  const dynamicFieldDefinitionFields = useMemo(() => {
    const fields: FormField<Omit<FormField<any, any>, "component">, CommonFormFieldComponent<any>>[] = [
      ...baseFieldDefinitionFields,
    ];

    if (currentFieldTypeInModal === "select") {
      fields.push({
        name: "options",
        label: "選択肢 (カンマ区切り)",
        type: "text",
        component: MuiTextFieldWrapper,
        initialValue: "",
      });
    }

    if (currentFieldTypeInModal === "textarea" || currentFieldTypeInModal === "text") {
      fields.push({
        name: "multiline",
        label: "複数行",
        type: "checkbox",
        component: MuiCheckboxWrapper,
        initialValue: false,
      });
      if (currentFieldTypeInModal === "textarea") {
        fields.push({
          name: "rows",
          label: "行数",
          type: "number",
          component: MuiTextFieldWrapper,
          initialValue: 4,
        });
      }
    }

    return fields;
  }, [currentFieldTypeInModal]);

  return (
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

      {/* フィールド追加/編集用のモーダル */}
      <Dialog open={isFieldModalOpen} onClose={handleFieldModalClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingFieldIndex !== null ? "フィールドを編集" : "新しいフィールドを追加"}
        </DialogTitle>
        <DialogContent>
          <DynamicForm<Omit<FormField<any, any>, "component">>
            fields={dynamicFieldDefinitionFields}
            initialData={editingFieldInitialData} // initialData は親から渡される
            onSubmit={handleFieldModalSubmit}
            onCancel={handleFieldModalClose}
            submitButtonText={editingFieldIndex !== null ? "保存" : "追加"}
            // ★修正: DynamicForm のフィールド変更を AppSchemaFieldsEditor の initialData にも反映
            // onFieldChange コールバックは親から渡された onFieldModalFormChange を呼び出す
            onFieldChange={(fieldName, value) => {
              if (fieldName === "type") {
                setCurrentFieldTypeInModal(value as FormFieldType);
              }
              // この onFieldChange イベントを親に伝える
              //  onFieldModalFormChange({
              // 仮のオブジェクトを渡している
              //    ...(editingFieldInitialData || {}), // null 対策
              //    [fieldName]: value,
              //  } as Omit<FormField<any, any>, "component">);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFieldModalClose} color="secondary">
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AppSchemaFieldsEditor;
