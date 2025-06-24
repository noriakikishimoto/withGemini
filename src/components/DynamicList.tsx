import React, { useState } from "react"; // ★useState をインポート
import DynamicCards from "./DynamicListViews/DynamicCards.tsx";
import DynamicTable from "./DynamicListViews/DynamicTable.tsx";

import TableViewIcon from "@mui/icons-material/TableView"; // テーブル表示アイコン
import ViewModuleIcon from "@mui/icons-material/ViewModule"; // カード表示アイコン
import { Box, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import { DynamicListProps, Identifiable } from "../types/interfaces";

function DynamicList<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
  listTitle,
  onEditSchema,
  onSortChange, // ★追加: Propsとして受け取る
  currentSortConditions, // ★追加: Propsとして受け取る
  onFilterChange, // ★追加: Propsとして受け取る
  currentFilterConditions, // ★追加: Propsとして受け取る
}: DynamicListProps<T>) {
  const [currentView, setCurrentView] = useState<"cards" | "table">("table");

  const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: "cards" | "table" | null) => {
    if (newView !== null) {
      setCurrentView(newView);
    }
  };

  return (
    <Box sx={{ flex: 1, paddingLeft: "20px" }}>
      {/* 
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        {listTitle} ({items.length} 件)
      </Typography>
*/}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        {onEditSchema && (
          <IconButton onClick={onEditSchema} sx={{ ml: 2 }} aria-label="アプリ設定">
            <SettingsIcon />
          </IconButton>
        )}
        <ToggleButtonGroup
          value={currentView}
          exclusive
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
      ) : currentView === "cards" ? (
        <DynamicCards
          items={items}
          fields={fields}
          onEdit={onEdit}
          onDelete={onDelete}
          itemBasePath={itemBasePath}
          listTitle={listTitle}
          // ソート関連のPropsは DynamicCards では利用しない
          onSortChange={onSortChange}
          currentSortConditions={currentSortConditions}
          onFilterChange={onFilterChange} // ★追加: onFilterChange を渡す
          currentFilterConditions={currentFilterConditions} // ★追加: currentFilterConditions を渡す
        />
      ) : (
        // デフォルトは 'table'
        <DynamicTable
          items={items}
          fields={fields}
          onEdit={onEdit}
          onDelete={onDelete}
          itemBasePath={itemBasePath}
          // ソート関連のPropsは DynamicCards では利用しない
          onSortChange={onSortChange}
          currentSortConditions={currentSortConditions}
          onFilterChange={onFilterChange} // ★追加: onFilterChange を渡す
          currentFilterConditions={currentFilterConditions} // ★追加: currentFilterConditions を渡す
        />
      )}
    </Box>
  );
}

export default DynamicList;
