import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TableSortLabel,
  Box,
} from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
// 共通の型定義をインポート
import {
  FilterCondition,
  FormField,
  Identifiable,
  SortCondition,
  SortDirection,
} from "../../types/interfaces";
// ★追加: ソートアイコン
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

// DynamicTableが受け取るPropsの型定義
interface DynamicTableProps<T extends Identifiable & object> {
  items: T[]; // 表示するデータの配列
  fields: FormField<T, any>[]; // 表示するフィールドの定義
  onEdit: (id: string) => void; // 編集ボタンが押されたときに呼ばれるコールバック
  onDelete: (id: string) => void; // 削除ボタンが押されたときに呼ばれるコールバック
  itemBasePath: string; // 詳細ページへのリンクのベースパス
  // ★修正: ソート関連のProps
  onSortChange: (newSortConditions: SortCondition<T>[]) => void;
  currentSortConditions?: SortCondition<T>[];
  // ★追加: フィルタリング関連のProps
  onFilterChange?: (newFilterConditions: FilterCondition<T>[]) => void;
  currentFilterConditions?: FilterCondition<T>[];
}

// DynamicTable コンポーネントの定義
function DynamicTable<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
  onSortChange,
  currentSortConditions,
  onFilterChange, // Propsとして受け取る
  currentFilterConditions, // Propsとして受け取る
}: DynamicTableProps<T>) {
  // ★追加: renderFieldValue 関数をここに定義
  const renderFieldValue = (item: T, field: FormField<T, any>): React.ReactNode => {
    const value = item[field.name as keyof T]; // 型は any なので、as keyof T でアクセスを安全にする

    // ★修正: table タイプの場合の表示ロジック
    if (field.type === "table") {
      if (Array.isArray(value)) {
        return `明細 ${value.length} 件`; // 例: 「明細 3 件」
      }
      return "明細なし"; // テーブルデータがなければ
    }

    // completed フィールドの表示ロジック (以前のものを再利用)
    if (field.name === "completed") {
      return value === true || value === "true" ? (
        <span style={{ marginLeft: "10px", color: "green", fontSize: "0.8em" }}>✅ 完了</span>
      ) : (
        <span style={{ marginLeft: "10px", color: "gray", fontSize: "0.8em" }}>❌ 未完了</span>
      );
    }

    // その他のフィールドは単純に文字列として表示
    return String(value ?? ""); // nullish coalescing を使用して undefined の場合も安全に
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="dynamic list table">
        <TableHead>
          <TableRow>
            {fields.map((field) => {
              // 現在のフィールドがソート条件に含まれているか、何番目かをチェック
              const currentSortCondition = currentSortConditions?.find(
                (cond) => cond.field === field.name
              );
              const sortIndex = currentSortConditions?.findIndex((cond) => cond.field === field.name);
              const isActive = sortIndex !== undefined && sortIndex !== -1;

              // ソートクリックハンドラ
              const handleHeaderClick = () => {
                let newSortConditions = [...(currentSortConditions || [])];
                const existingIndex = newSortConditions.findIndex((cond) => cond.field === field.name);

                if (existingIndex !== -1) {
                  // 既にソート条件にある場合
                  const currentDir = newSortConditions[existingIndex].direction;
                  if (currentDir === "asc") {
                    newSortConditions[existingIndex].direction = "desc"; // 昇順 -> 降順
                  } else {
                    newSortConditions.splice(existingIndex, 1); // 降順 -> 解除 (配列から削除)
                  }
                } else {
                  // 新しいソート条件を追加 (デフォルトは昇順)
                  newSortConditions.push({ field: field.name, direction: "asc" });
                }
                onSortChange(newSortConditions);
              };

              return (
                <TableCell key={field.name as string} sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={isActive} // active はソートが適用されていて、かつソート解除状態ではない
                    direction={currentSortCondition?.direction} // ソート方向
                    onClick={handleHeaderClick}
                  >
                    {field.label}
                    {isActive && sortIndex !== undefined && sortIndex !== -1 && (
                      <Typography variant="caption" sx={{ ml: 0.5, color: "text.secondary" }}>
                        {sortIndex + 1}
                      </Typography>
                    )}
                  </TableSortLabel>
                </TableCell>
              );
            })}
            <TableCell sx={{ fontWeight: "bold", width: "150px" }} align="right">
              アクション
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={fields.length + 1} sx={{ textAlign: "center", py: 2 }}>
                該当するデータがありません
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                {fields.map((field) => (
                  <TableCell key={field.name as string}>
                    {field.name === fields[0].name ? (
                      <Link
                        to={`${itemBasePath}/${item.id}`}
                        style={{ textDecoration: "none", color: "primary.main", fontWeight: "bold" }}
                      >
                        {renderFieldValue(item, field)}
                      </Link>
                    ) : (
                      <Typography variant="body2">{renderFieldValue(item, field)}</Typography>
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton aria-label="編集" color="warning" onClick={() => onEdit(item.id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="削除"
                    color="error"
                    onClick={() => onDelete(item.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DynamicTable;
