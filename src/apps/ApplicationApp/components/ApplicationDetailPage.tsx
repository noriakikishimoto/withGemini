import React, { FC, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ★追加: useParams, useNavigate をインポート
import { ApplicationData } from "../../../types/interfaces.ts"; // 共通の型をインポート
import { applicationRepository } from "../../../repositories/applicationRepository.ts"; // ★追加: リポジトリをインポート
import Layout from "../../../components/Layout.tsx"; // レイアウトコンポーネント
import styles from "./ApplicationDetailPage.module.css"; // ★追加: ページ専用のCSS Modules

// ★修正: MUIのコンポーネントをインポート
import { Box, Typography, Button, Paper, CircularProgress } from "@mui/material"; // Paperはdivのようなもの、CircularProgressはローディング表示

interface ApplicationDetailPageProps {
  // 編集ボタンが押されたときに、IDを親に伝えるコールバック関数
  onEditProps: (id: string) => void;
}

const ApplicationDetailPage: FC<ApplicationDetailPageProps> = ({ onEditProps }) => {
  const { id } = useParams<{ id: string }>(); // ★URLから :id の値を取得
  const navigate = useNavigate(); // ★ページ遷移のためのフック

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // コンポーネントがマウントされた時、またはIDが変更された時にデータを取得
  useEffect(() => {
    if (!id) {
      setError("申請IDが指定されていません。");
      setIsLoading(false);
      return;
    }

    const fetchApplication = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await applicationRepository.getById(id); // ★リポジトリからデータを取得
        if (data) {
          setApplication(data);
        } else {
          setError("指定された申請は見つかりませんでした。");
        }
      } catch (err) {
        console.error("Error fetching application details:", err);
        setError("データの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplication();
  }, [id]); // id が変更されたら再実行

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Layout>
        <Box
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}
        >
          <CircularProgress /> {/* MUIのローディングスピナー */}
          <Typography variant="body1" sx={{ ml: 2 }}>
            詳細データを読み込み中...
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
          <Typography variant="body1">エラー: {error}</Typography>
          <Button onClick={() => navigate("/applications/list")} variant="contained">
            リストに戻る
          </Button>
        </Box>
      </Layout>
    );
  }

  // データが見つからない場合
  if (!application) {
    return (
      <Layout>
        <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
          <Typography variant="body1">申請データが見つかりません。</Typography>
          <Button onClick={() => navigate("/applications/list")} variant="contained">
            リストに戻る
          </Button>
        </Box>
      </Layout>
    );
  }

  // 正常表示
  return (
    // ★修正: div を Paper コンポーネントに置き換え
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4 }}>
      {" "}
      {/* Paper に sx でスタイル */}
      <Typography variant="h4" component="h2" align="center" gutterBottom>
        申請詳細
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">
          <strong>タイトル:</strong>
        </Typography>
        <Typography variant="body1">{application.title}</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">
          <strong>申請者:</strong>
        </Typography>
        <Typography variant="body1">{application.applicant}</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">
          <strong>内容:</strong>
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {application.description}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          onClick={() => {
            if (application) {
              onEditProps(application.id);
            }
          }}
          variant="contained"
          color="warning"
          sx={{ mr: 1 }}
        >
          編集
        </Button>
        <Button onClick={() => navigate("/applications/list")} variant="outlined" color="secondary">
          リストに戻る
        </Button>
      </Box>
    </Paper>
  );
};

export default ApplicationDetailPage;
