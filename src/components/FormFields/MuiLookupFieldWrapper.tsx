import React, { FC, useState, useEffect } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  IconButton,
  InputAdornment,
  Typography,
  ListItemButton, // InputAdornment を追加
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search"; // 検索アイコン
import CloseIcon from "@mui/icons-material/Close"; // クリアアイコン

// 共通の型定義をインポート
import {
  CommonFormFieldComponent,
  Identifiable,
  AppSchema,
  GenericRecord,
  FormField,
  LookupCopyField,
} from "../../types/interfaces";
import { genericDataRepository } from "../../repositories/genericDataRepository"; // 汎用データのリポジトリ
import { appSchemaRepository } from "../../repositories/appSchemaRepository";

// MuiTextFieldWrapper は直接使わず、TextField を使う

interface MuiLookupFieldWrapperProps {
  label: string;
  name: string;
  value: string; // 表示用の値（通常はキーフィールドの値）
  onChange: (value: string, selectedRecord?: { [key: string]: any }) => void; // 変更時に値と選択レコードを返す
  required?: boolean;
  lookupAppId: string; // ルックアップ元アプリのID (必須)
  lookupKeyField: string; // ルックアップ元アプリのキーとなるフィールド (必須)
  lookupDisplayFields?: string; // ルックアップ元アプリから表示/コピーするフィールド
  lookupCopyToFields?: string; // ★追加: ルックアップ転記フィールドのリスト
}

const MuiLookupFieldWrapper: CommonFormFieldComponent<MuiLookupFieldWrapperProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  lookupAppId,
  lookupKeyField,
  lookupDisplayFields,
  lookupCopyToFields,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || ""); // モーダルの検索フィールドの初期値は現在の値
  const [searchResults, setSearchResults] = useState<GenericRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ★追加: ルックアップ元アプリのスキーマとデータをロードするステート
  const [lookupAppSchema, setLookupAppSchema] = useState<AppSchema | null>(null);
  const [allLookupRecords, setAllLookupRecords] = useState<GenericRecord[]>([]);
  const [isLookupDataLoading, setIsLookupDataLoading] = useState(true);
  const [lookupDataError, setLookupDataError] = useState<string | null>(null);

  // ★追加: ルックアップ元アプリのスキーマと全データを初期ロード
  useEffect(() => {
    const fetchLookupInitialData = async () => {
      setIsLookupDataLoading(true);
      setLookupDataError(null);
      try {
        if (!lookupAppId) {
          setLookupDataError("ルックアップ元アプリIDが指定されていません。");
          return;
        }
        // 1. ルックアップ元アプリのスキーマを取得
        const appSchema = await appSchemaRepository.getById(lookupAppId);
        if (!appSchema) {
          setLookupDataError("指定されたルックアップ元アプリのスキーマが見つかりません。");
          return;
        }
        setLookupAppSchema(appSchema);

        // 2. ルックアップ元アプリの全レコードデータを取得
        const records = await genericDataRepository.getAll(lookupAppId);
        setAllLookupRecords(records);
      } catch (err) {
        console.error("ルックアップ元データのロードエラー:", err);
        setLookupDataError("ルックアップ元データの読み込みに失敗しました。");
      } finally {
        setIsLookupDataLoading(false);
      }
    };
    fetchLookupInitialData();
  }, [lookupAppId]); // lookupAppId が変更されたら再実行

  // モーダルが開かれたときに検索を実行
  useEffect(() => {
    if (isModalOpen && searchTerm) {
      // モーダルが開かれ、かつ検索キーワードがあれば
      handleSearch();
    } else if (isModalOpen && !searchTerm) {
      // モーダルが開かれ、検索キーワードがなければ全件表示
      setSearchResults(allLookupRecords);
    }
  }, [isModalOpen, allLookupRecords, searchTerm]);

  // 検索処理
  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!lookupAppId || !lookupKeyField) {
        throw new Error("ルックアップ設定が不完全です。");
      }
      // allLookupRecords からフィルタリング
      const filtered = allLookupRecords.filter((record) =>
        String(record[lookupKeyField])?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("ルックアップ検索エラー:", err);
      setError("検索中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // 検索フィールドのリセット
  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults(allLookupRecords); // クリアしたら全件表示
  };

  // レコード選択ハンドラ
  const handleSelectRecord = (record: GenericRecord) => {
    const copyValues: { [key: string]: any } = {}; // 結果を格納するオブジェクト
    if (lookupCopyToFields && lookupCopyToFields.length > 0) {
      // 1. カンマで分割
      const pairs = lookupCopyToFields.split(",");
      // 2. 各ペアを処理
      pairs.forEach((pair) => {
        const parts = pair.split(":");
        if (parts.length === 2) {
          const from = parts[0].trim(); // キーの前後の空白を除去
          const to = parts[1].trim(); // 値の前後の空白を除去
          copyValues[to] = record[from];
        } else {
          // フォーマットが不正な場合（例: "名前" や "名前:顧客名:追加"）はエラーを出すか無視する
          console.warn(`Skipping malformed pair: "${pair}" in input string "${lookupCopyToFields}"`);
        }
      });
    }

    onChange(String(record[lookupKeyField]), copyValues); // 親にキーフィールドの値と選択されたレコード全体を渡す
    // onChange(String(record[lookupKeyField]), recordToCopy); // キーフィールドの値と選択されたレコード全体を渡す
    setIsModalOpen(false); // モーダルを閉じる
    setSearchTerm(String(record[lookupKeyField])); // 選択された値を検索フィールドに反映
  };

  // テキスト入力フィールドの値変更ハンドラ (表示用)
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, undefined); // キーフィールドの値のみ更新、選択レコードはなし
  };

  if (isLookupDataLoading) {
    return (
      <TextField
        fullWidth
        margin="normal"
        label={label}
        value="ルックアップデータを読み込み中..."
        disabled
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ),
        }}
      />
    );
  }

  if (lookupDataError) {
    return (
      <TextField
        fullWidth
        margin="normal"
        label={label}
        value={`エラー: ${lookupDataError}`}
        disabled
        error
        variant="outlined"
      />
    );
  }
  if (!lookupAppSchema) {
    return (
      <TextField
        fullWidth
        margin="normal"
        label={label}
        value="ルックアップ設定が不完全です。"
        disabled
        error
        variant="outlined"
      />
    );
  }
  return (
    // ★修正: 最も外側の TextField が Dialog を子として持たないように変更
    // TextField と Dialog は兄弟要素としてレンダリングする
    <>
      <TextField
        fullWidth
        margin="normal"
        label={label}
        id={name}
        name={name}
        value={value} // 表示用の値
        onChange={handleTextChange} // 直接入力も許可
        required={required}
        variant="outlined"
        InputProps={{
          // InputProps を使ってアイコンを追加
          readOnly: true, // 基本的に直接入力はさせず、モーダルで選択させる
          endAdornment: (
            <InputAdornment position="end">
              {value && ( // 値があればクリアボタンを表示
                <IconButton onClick={() => onChange("", undefined)} size="small" edge="end">
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton onClick={() => setIsModalOpen(true)} edge="end">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {/* 検索モーダル */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{label} の検索</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="検索キーワード"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }} // Enterキーで検索
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {searchTerm && (
                    <IconButton onClick={handleClearSearch} size="small" edge="end">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton onClick={handleSearch} edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ my: 2 }}>
              {error}
            </Typography>
          ) : searchResults.length === 0 ? (
            <Typography sx={{ my: 2 }}>
              {searchTerm ? "該当するレコードがありません。" : "検索してください。"}
            </Typography>
          ) : (
            <List>
              {searchResults.map((record) => (
                <ListItemButton key={record.id} onClick={() => handleSelectRecord(record)}>
                  <ListItemText
                    primary={String(record[lookupKeyField])} // キーフィールドの値を primary に表示
                    secondary={
                      // lookupDisplayFields は "顧客名,住所,電話番号" のような文字列
                      (lookupDisplayFields || "")
                        .split(",")
                        .map((fieldName) => {
                          const value = record[fieldName.trim()]; // record['顧客名'] のようにアクセス
                          return value ? `${fieldName.trim()}: ${String(value)}` : "";
                        })
                        .filter(Boolean)
                        .join(" | ") // 空の文字列を除去して '|' で結合
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} color="secondary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// getInitialValue 静的メソッドの定義
MuiLookupFieldWrapper.getInitialValue = () => ""; // ルックアップフィールドの初期値は空文字列

export default MuiLookupFieldWrapper;
