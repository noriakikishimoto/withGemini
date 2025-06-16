import React, { useState, FC, FormEvent, useEffect } from "react";
// ★修正: MUIのコンポーネントをインポート
import { TextField, Button, Box } from "@mui/material"; // BoxはdivのMUI版のようなもの

import styles from "./ApplicationForm.module.css";
import { ApplicationData } from "../../../types/interfaces.ts";

// ApplicationFormが親から受け取るPropsの型を定義
interface ApplicationFormProps {
  // フォーム送信時に親にデータを伝える関数
  onSubmit: (data: Omit<ApplicationData, "id">) => void; // 新規作成時はIDなし
  // 編集モード時にフォームに表示する初期データ（オプション）
  initialData?: ApplicationData | null; // nullも許容
  // 編集キャンセル時に親に伝える関数
  onCancelEdit?: () => void; // オプション
}

const ApplicationForm: FC<ApplicationFormProps> = ({ onSubmit, initialData, onCancelEdit }) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [applicant, setApplicant] = useState<string>("");

  // ★変更：editingApplicationId ステートは不要になる（initialDataで判断）

  // ★追加：initialData が変更された時にフォームにデータを読み込む
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setApplicant(initialData.applicant);
    } else {
      // initialData がない場合はフォームをクリア
      setTitle("");
      setDescription("");
      setApplicant("");
    }
  }, [initialData]); // initialData が変更されたら実行

  // フォーム送信時の処理（修正あり）
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // フォームから取得したデータ（IDなし）
    const formData = {
      title,
      description,
      applicant,
    };

    // 親コンポーネントから渡された onSubmit 関数を呼び出す
    onSubmit(formData);

    // フォームをクリアする (onSubmit呼び出し後に親が処理するのでここでは最小限)
    // 今回は onSubmit 呼び出し後に親でフォームクリアを行うので、ここでは不要だが、
    // フォーム自体をクリアしたい場合は残す
    setTitle("");
    setDescription("");
    setApplicant("");
  };

  return (
    // ★修正: 外側の div を Box コンポーネントに置き換え、スタイルを Props に移行
    <Box className={`section ${styles.formSection}`}>
      <h2>{initialData ? "申請を編集" : "新規申請フォーム"}</h2> {/* タイトルを動的に変更 */}
      <form onSubmit={handleSubmit}>
        {/* ★修正: TextField コンポーネントに置き換え */}
        <TextField
          fullWidth // 幅を100%にする
          margin="normal" // 上下のマージンを適用
          label="申請タイトル" // ラベル
          id="title"
          name="title" // name属性も追加
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required // 必須
          variant="outlined" // 外枠付きのデザイン
        />

        <TextField
          fullWidth
          margin="normal"
          label="申請内容"
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          multiline // テキストエリアにする
          rows={4} // 表示行数
          variant="outlined"
        />

        <TextField
          fullWidth
          margin="normal"
          label="申請者名"
          id="applicant"
          name="applicant"
          value={applicant}
          onChange={(e) => setApplicant(e.target.value)}
          required
          variant="outlined"
        />

        {/* ★修正: Button コンポーネントに置き換え */}
        <Box sx={{ mt: 3, mb: 2 }}>
          {" "}
          {/* ボタンのグループをMUIのBoxで囲み、マージンを設定 (sxはstyleのようなもの) */}
          <Button
            type="submit"
            variant="contained" // 塗りつぶしボタン
            color="primary" // テーマのprimary色
            sx={{ mr: 1 }} // 右マージン
          >
            {initialData ? "変更を保存" : "申請を保存"}
          </Button>
          {initialData && onCancelEdit && (
            <Button
              type="button"
              variant="outlined" // 枠線だけのボタン
              color="secondary" // テーマのsecondary色
              onClick={onCancelEdit}
            >
              キャンセル
            </Button>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default ApplicationForm;
