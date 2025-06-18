import React, { FC } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, Card, CardContent, CardActions, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// 共通の型定義をインポート
import { FormField, Identifiable } from "../../types/interfaces";

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
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {items.map((item) => (
        <Card key={item.id} variant="outlined" sx={{ minWidth: 275 }}>
          <CardContent sx={{ pb: 1 }}>
            <Link
              to={`${itemBasePath}/${item.id}`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <Typography variant="h6" component="h3" color="primary" sx={{ mb: 0.5 }}>
                {item[fields[0].name] as string}
                {"completed" in item && typeof item.completed === "boolean" && item.completed && (
                  <span style={{ marginLeft: "10px", color: "green", fontSize: "0.8em" }}>✅ 完了</span>
                )}
              </Typography>
              {fields.slice(1).map((field) => (
                <Typography key={field.name as string} variant="body2" color="text.secondary">
                  <strong>{field.label}:</strong> {String(item[field.name]).substring(0, 50)}...
                </Typography>
              ))}
            </Link>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end", pr: 2, pb: 2 }}>
            <IconButton
              aria-label="編集" // アクセシビリティのためにaria-labelを追加
              color="warning" // warning カラー
              onClick={() => onEdit(item.id)}
            >
              <EditIcon /> {/* 編集アイコン */}
            </IconButton>
            <IconButton
              aria-label="削除" // アクセシビリティのためにaria-labelを追加
              color="error" // error カラー
              onClick={() => onDelete(item.id)}
              sx={{ ml: 1 }}
            >
              <DeleteIcon /> {/* 削除アイコン */}
            </IconButton>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
}

export default DynamicCards;
