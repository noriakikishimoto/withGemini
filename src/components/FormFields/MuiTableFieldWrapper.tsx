import {
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
// ★削除: AddIcon, EditIcon, DeleteIcon (編集機能削除のため)
// import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

// 共通の型定義をインポート
import { CommonFormFieldComponent, FormField, GenericRecord } from "../../types/interfaces";
import { useEffect, useMemo, useState } from "react";
import MuiTextFieldWrapper from "./MuiTextFieldWrapper";
import { genericDataRepository } from "../../repositories/genericDataRepository";

// MuiTableFieldWrapper が受け取る Props の型定義
// T は親フォームのデータ型（GenericRecord）
interface MuiTableFieldWrapperProps<T extends object> {
  label: string;
  name: keyof T; // DynamicForm の formData のキー
  value: GenericRecord[]; // テーブルのデータ（GenericRecord の配列）
  onChange: (value: GenericRecord[]) => void; // 変更時に更新されたテーブルデータを返す (今回は読み取り専用だが残す)
  required?: boolean;

  tableSourceAppId: string; // 参照元アプリのID (テーブル表示データ用)
  tableFilterField?: string; // 抽出条件フィールド名 (テーブル表示データ用)
  tableFilterValue?: string; // 抽出条件値 (テーブル表示データ用)
  tableFields: string;
  parentFormData?: Record<string, any>;
}

// テーブル行のデータを編集するためのモーダルフォーム (DynamicForm を再利用)
// ★削除: 読み取り専用にするため、このコンポーネントは不要になる
// interface TableRowFormProps { ... }
// const TableRowForm: FC<TableRowFormProps> = ({ fields, initialData, onSubmit, onCancel }) => { ... };

// MuiTableFieldWrapper コンポーネントの定義
const MuiTableFieldWrapper: CommonFormFieldComponent<MuiTableFieldWrapperProps<any>> = ({
  label,
  name,
  value, // テーブルのデータ
  onChange, // 読み取り専用なので今回は使用しないが、Propsとして残す
  required = false, // 読み取り専用なので今回は使用しないが、Propsとして残す
  tableSourceAppId,
  tableFilterField,
  tableFilterValue,
  tableFields, // テーブルの列定義
  parentFormData,
}) => {
  // ★追加: テーブル表示用のデータとロード状態
  const [displayTableData, setDisplayTableData] = useState<GenericRecord[]>([]);
  const [isDisplayDataLoading, setIsDisplayDataLoading] = useState(true);
  const [displayDataError, setDisplayDataError] = useState<string | null>(null);

  // ★追加: テーブルに表示する列の実際のフィールド定義 (parsedTableFields)
  const parsedTableFields = useMemo(() => {
    if (!tableFields) return [];
    // カンマ区切り文字列を FormField<any,any> の配列に変換
    return tableFields.split(",").map((fieldName) => ({
      name: fieldName.trim() as keyof GenericRecord, // GenericRecord のキーとして
      label: fieldName.trim(), // ラベルはフィールド名と同じ
      type: "text", // 表示用なので簡易的に text タイプ
      component: MuiTextFieldWrapper, // デフォルトコンポーネント
      initialValue: "",
    }));
  }, [tableFields]);

  // ★追加: テーブルデータをロードする useEffect

  useEffect(() => {
    const fetchTableData = async () => {
      setIsDisplayDataLoading(true);
      setDisplayDataError(null);
      try {
        if (!tableSourceAppId) {
          throw new Error("テーブルの参照元アプリIDが指定されていません。");
        }
        // 参照元アプリの全レコードを取得
        let records = await genericDataRepository.getAll(tableSourceAppId);

        // ★修正: 抽出条件のロジック (tableFilterValue が自身のフィールド名であることを前提)
        let actualFilterValue: string | undefined;
        if (tableFilterField && tableFilterValue && parentFormData) {
          // parentFormData と tableFilterValue (自身のフィールド名) があれば
          actualFilterValue = String(parentFormData[tableFilterValue] ?? ""); // parentFormData から値を取得
        }

        // 抽出条件が指定されていればフィルタリング
        if (tableFilterField && actualFilterValue !== undefined && actualFilterValue !== "") {
          records = records.filter((record) => String(record[tableFilterField]) === actualFilterValue);
        } else if (tableFilterField && (actualFilterValue === undefined || actualFilterValue === "")) {
          // tableFilterField は指定されているが、参照元の値が空の場合、結果を空にする (Kintone の挙動に合わせる)
          records = [];
        }

        setDisplayTableData(records);
      } catch (err) {
        console.error("テーブルデータのロードエラー:", err);
        setDisplayDataError("テーブルデータの読み込みに失敗しました。");
      } finally {
        setIsDisplayDataLoading(false);
      }
    };
    fetchTableData();
  }, [tableSourceAppId, tableFilterField, tableFilterValue, parentFormData]); // 依存配列

  //const tableFierdsArray = tableFields.split(",");

  if (isDisplayDataLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          テーブルデータを読み込み中...
        </Typography>
      </Box>
    );
  }

  if (displayDataError) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <Typography variant="body1">エラー: {displayDataError}</Typography>
      </Box>
    );
  }
  if (tableFields && parsedTableFields.length === 0) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="body1">テーブルの列定義が不正です。</Typography>
      </Box>
    );
  }

  return (
    <FormControl component="fieldset" margin="normal" fullWidth required={required}>
      <FormLabel component="legend">{label}</FormLabel>
      <Paper variant="outlined" sx={{ my: 1, p: 1 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {/* ★修正: parsedTableFields を使ってヘッダーを表示 */}
                {parsedTableFields.map((field) => (
                  <TableCell key={field.name as string} sx={{ fontWeight: "bold" }}>
                    {field.label}
                  </TableCell>
                ))}
                {/* ★削除: アクション列 (編集・削除ボタン) */}
                {/* <TableCell sx={{ fontWeight: 'bold', width: '100px' }} align="right">アクション</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTableData.length === 0 ? ( // ★修正: value ではなく displayTableData をチェック
                <TableRow>
                  <TableCell colSpan={parsedTableFields.length || 1} sx={{ textAlign: "center", py: 2 }}>
                    {" "}
                    {/* colSpan を parsedTableFields.length に修正 */}
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              ) : (
                displayTableData.map(
                  (
                    row,
                    rowIndex // ★修正: value ではなく displayTableData をマップ
                  ) => (
                    <TableRow key={row.id || rowIndex}>
                      {/* ★修正: parsedTableFields を使ってセルデータを表示 */}
                      {parsedTableFields.map((field) => (
                        <TableCell key={field.name as string}>
                          {String(row[field.name as string] ?? "")}
                        </TableCell>
                      ))}
                      {/* ★削除: アクションセル (編集・削除ボタン) */}
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </FormControl>
  );
};

// getInitialValue 静的メソッドの定義 (変更なし)
MuiTableFieldWrapper.getInitialValue = () => "";

export default MuiTableFieldWrapper;
