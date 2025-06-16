import React, { FC } from "react";
import { Link } from "react-router-dom";
// ★追加: テーブル表示に必要なMUIコンポーネントをインポート
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Typography,
  Box,
} from "@mui/material";

// 共通の型定義をインポート
import { FormField, Identifiable } from "../../types/interfaces";

// DynamicTableが受け取るPropsの型定義
interface DynamicTableProps<T extends Identifiable & object> {
  items: T[]; // 表示するデータの配列
  fields: FormField<T, any>[]; // 表示するフィールドの定義
  onEdit: (id: string) => void; // 編集ボタンが押されたときに呼ばれるコールバック
  onDelete: (id: string) => void; // 削除ボタンが押されたときに呼ばれるコールバック
  itemBasePath: string; // 詳細ページへのリンクのベースパス
}

// DynamicTable コンポーネントの定義
function DynamicTable<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
}: DynamicTableProps<T>) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      {" "}
      {/* Paper で囲む */}
      <Table sx={{ minWidth: 650 }} aria-label="dynamic list table">
        <TableHead>
          <TableRow>
            {fields.map((field) => (
              <TableCell key={field.name as string} sx={{ fontWeight: "bold" }}>
                {field.label}
              </TableCell>
            ))}
            <TableCell sx={{ fontWeight: "bold", width: "150px" }} align="right">
              アクション
            </TableCell>{" "}
            {/* アクション列 */}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              {fields.map((field) => (
                <TableCell key={field.name as string}>
                  {field.name === fields[0].name ? ( // 最初のフィールドは詳細リンク
                    <Link
                      to={`${itemBasePath}/${item.id}`}
                      style={{ textDecoration: "none", color: "primary.main", fontWeight: "bold" }}
                    >
                      {/* ★修正: completed の表示ロジックを削除するか、field.name で判定 */}
                      {/* DynamicTable は汎用なので、'completed' という特定のフィールド名に依存しない */}
                      {/* もし 'completed' フィールドがあれば、その値に応じて表示 */}
                      {field.name === "completed" &&
                      (item[field.name] === true || item[field.name] === "true") ? (
                        <span style={{ marginLeft: "10px", color: "green", fontSize: "0.8em" }}>✅</span>
                      ) : (
                        // 他のフィールドの表示
                        (item[field.name] as string) // string としてキャスト
                      )}
                    </Link>
                  ) : (
                    <Typography variant="body2">
                      {/* ★修正: completed フィールドの表示ロジックを汎用的にする */}
                      {field.name === "completed"
                        ? // 'completed' という名前のフィールドがあれば、その真偽値に応じて表示
                          item[field.name] === true || item[field.name] === "true"
                          ? "完了"
                          : "未完了"
                        : // それ以外のフィールドは単純に文字列として表示
                          String(item[field.name])}
                    </Typography>
                  )}
                </TableCell>
              ))}
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => onEdit(item.id)}
                  sx={{ mr: 1 }}
                >
                  編集
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => onDelete(item.id)}>
                  削除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DynamicTable;
