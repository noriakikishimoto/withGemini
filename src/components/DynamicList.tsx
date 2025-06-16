import React, { FC, useState } from "react"; // ★useState をインポート
// ★修正: DynamicCards と DynamicTable をインポート
import DynamicCards from "./DynamicListViews/DynamicCards.tsx";
import DynamicTable from "./DynamicListViews/DynamicTable.tsx";

// ★追加: ビュー切り替えUIに必要なMUIコンポーネントとアイコン
import { Box, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ViewModuleIcon from "@mui/icons-material/ViewModule"; // カード表示アイコン
import TableViewIcon from "@mui/icons-material/TableView"; // テーブル表示アイコン

// 共通の型定義をインポート
import { FormField, Identifiable } from "../types/interfaces";

// DynamicListが受け取るPropsの型定義 (変更なし)
interface DynamicListProps<T extends Identifiable & object> {
  items: T[];
  fields: FormField<T, any>[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  itemBasePath: string;
  listTitle: string;
}

// DynamicList コンポーネントの定義
function DynamicList<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
  listTitle,
}: DynamicListProps<T>) {
  // ★追加: 現在のビュータイプを管理するステート
  // デフォルトは 'table' に設定
  const [currentView, setCurrentView] = useState<"cards" | "table">("table");

  // ビュータイプを切り替えるハンドラ
  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: "cards" | "table" | null) => {
    if (newView !== null) {
      setCurrentView(newView);
    }
  };

  return (
    <Box sx={{ flex: 1, paddingLeft: "20px" }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        {listTitle} ({items.length} 件)
      </Typography>

      {/* ★追加: ビュー切り替えボタン */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <ToggleButtonGroup
          value={currentView}
          exclusive // どちらか一方のみ選択可能
          onChange={handleViewChange}
          aria-label="list view type"
        >
          <ToggleButton value="cards" aria-label="cards view">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="table" aria-label="table view">
            <TableViewIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: "center" }}>
          まだ {listTitle.replace("既存の", "").replace("リスト", "")} がありません。
        </Typography>
      ) : // ★修正: 選択されたビューコンポーネントをレンダリング
      currentView === "cards" ? (
        <DynamicCards
          items={items}
          fields={fields}
          onEdit={onEdit}
          onDelete={onDelete}
          itemBasePath={itemBasePath}
          listTitle={listTitle} // DynamicCards にもリストタイトルを渡す
        />
      ) : (
        // デフォルトは 'table'
        <DynamicTable
          items={items}
          fields={fields}
          onEdit={onEdit}
          onDelete={onDelete}
          itemBasePath={itemBasePath}
        />
      )}
    </Box>
  );
}

export default DynamicList;
