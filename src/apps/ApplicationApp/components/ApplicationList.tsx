import React, { FC, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { Box, Typography, Button, Card, CardContent, CardActions, TextField } from "@mui/material"; // Card系コンポーネント

import { ApplicationData } from "../../../types/interfaces.ts";

interface ApplicationListProps {
  applications: ApplicationData[]; // 表示する申請データの配列
  onDelete: (id: string) => void; // 削除ボタンが押されたときに親に伝える関数
  onEdit: (id: string) => void; // 編集ボタンが押されたときに親に伝える関数
}

const ApplicationList: FC<ApplicationListProps> = ({ applications, onDelete, onEdit }) => {
  // ★追加: 検索キーワードを管理するステート
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ★追加: フィルタリングされたアプリケーションリストを計算する (useMemoで最適化)
  const filteredApplications = useMemo(() => {
    if (!searchTerm) {
      return applications; // 検索キーワードがなければ全て返す
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return applications.filter(
      (app) =>
        app.title.toLowerCase().includes(lowercasedSearchTerm) ||
        app.description.toLowerCase().includes(lowercasedSearchTerm) ||
        app.applicant.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [applications, searchTerm]); // applications または searchTerm が変更されたら再計算

  return (
    // ★修正: 外側の div を Box コンポーネントに置き換え
    <Box sx={{ flex: 1, paddingLeft: "20px" }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        既存の申請 ({filteredApplications.length} 件) {/* ★変更: filteredApplications.length を表示 */}
      </Typography>
      {/* ★追加: 検索入力フィールド */}
      <TextField
        fullWidth
        label="検索キーワード"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }} // 下マージン
      />
      {filteredApplications.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: "center" }}>
          {searchTerm ? "該当する申請が見つかりません。" : "まだ申請がありません。"}{" "}
          {/* 検索結果がない場合のメッセージ */}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {" "}
          {/* リストの代わりにBoxで間隔を制御 */}
          {filteredApplications.map((app) => (
            // ★修正: li を Card コンポーネントに置き換え
            <Card key={app.id} variant="outlined" sx={{ minWidth: 275 }}>
              <CardContent sx={{ pb: 1 }}>
                {" "}
                {/* CardContent の padding-bottom を調整 */}
                <Link
                  to={`/applications/${app.id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  {" "}
                  {/* Link のスタイル */}
                  <Typography variant="h6" component="h3" color="primary" sx={{ mb: 0.5 }}>
                    {" "}
                    {/* タイトル */}
                    {app.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>申請者:</strong> {app.applicant}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>内容:</strong> {app.description.substring(0, 50)}...
                  </Typography>
                </Link>
              </CardContent>

              <CardActions sx={{ justifyContent: "flex-end", pr: 2, pb: 2 }}>
                {" "}
                {/* ボタンを右寄せ、内側のパディング */}
                {/* ★修正: Button コンポーネントに置き換え */}
                <Button
                  size="small" // 小さいボタン
                  variant="outlined"
                  color="warning" // テーマのwarning色
                  onClick={() => onEdit(app.id)}
                >
                  編集
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error" // テーマのerror色
                  onClick={() => onDelete(app.id)}
                  sx={{ ml: 1 }} // 左マージン
                >
                  削除
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ApplicationList;
