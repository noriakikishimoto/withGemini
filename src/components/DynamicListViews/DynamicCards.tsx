// src/components/DynamicListViews/DynamicCards.tsx

import React, { FC } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, Card, CardContent, CardActions, IconButton } from "@mui/material"; // IconButton をインポート

// 共通の型定義をインポート
import { FormField, Identifiable } from "../../types/interfaces";

// 必要なMUIアイコンをインポート
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// DynamicCardsが受け取るPropsの型定義
interface DynamicCardsProps<T extends Identifiable & object> {
  items: T[]; // 表示するデータの配列
  fields: FormField<T, any>[]; // 表示するフィールドの定義
  onEdit: (id: string) => void; // 編集ボタンが押されたときに呼ばれるコールバック
  onDelete: (id: string) => void; // 削除ボタンが押されたときに呼ばれるコールバック
  itemBasePath: string; // 詳細ページへのリンクのベースパス (例: '/generic-db/tasks')
  listTitle: string; // DynamicListから渡されるリストタイトル（メッセージ表示用）
}

// DynamicCards コンポーネントの定義
function DynamicCards<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
  listTitle,
}: DynamicCardsProps<T>) {
  // ★追加: renderFieldValue 関数をここに定義
  const renderFieldValue = (item: T, field: FormField<T, any>): React.ReactNode => {
    const value = item[field.name as keyof T]; // ★修正: table タイプの場合の表示ロジック

    if (field.type === "table") {
      if (Array.isArray(value)) {
        return `明細 ${value.length} 件`; // 例: 「明細 3 件」
      }
      return "明細なし"; // テーブルデータがなければ
    } // completed フィールドの表示ロジック

    if (field.name === "completed") {
      return value === true || value === "true" ? (
        <span style={{ marginLeft: "10px", color: "green", fontSize: "0.8em" }}>✅ 完了</span>
      ) : (
        <span style={{ marginLeft: "10px", color: "gray", fontSize: "0.8em" }}>❌ 未完了</span>
      );
    } // その他のフィールドは単純に文字列として表示

    return String(value ?? ""); // nullish coalescing を使用して undefined の場合も安全に
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {" "}
      {items.map((item) => (
        <Card key={item.id} variant="outlined" sx={{ minWidth: 275 }}>
          {" "}
          <CardContent sx={{ pb: 1 }}>
            {" "}
            <Link
              to={`${itemBasePath}/${item.id}`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              {" "}
              <Typography variant="h6" component="h3" color="primary" sx={{ mb: 0.5 }}>
                {renderFieldValue(item, fields[0])} {/* ★修正: renderFieldValue を呼び出す */}{" "}
              </Typography>{" "}
              {fields.slice(1).map((field) => (
                <Typography key={field.name as string} variant="body2" color="text.secondary">
                  <strong>{field.label}:</strong> {renderFieldValue(item, field)}
                  {/* ★修正: renderFieldValue を呼び出す */}{" "}
                </Typography>
              ))}{" "}
            </Link>{" "}
          </CardContent>{" "}
          <CardActions sx={{ justifyContent: "flex-end", pr: 2, pb: 2 }}>
            {" "}
            <IconButton aria-label="編集" color="warning" onClick={() => onEdit(item.id)}>
              <EditIcon />{" "}
            </IconButton>{" "}
            <IconButton aria-label="削除" color="error" onClick={() => onDelete(item.id)} sx={{ ml: 1 }}>
              <DeleteIcon />{" "}
            </IconButton>{" "}
          </CardActions>{" "}
        </Card>
      ))}{" "}
    </Box>
  );
}

export default DynamicCards;
