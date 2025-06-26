import DynamicCards from "./DynamicListViews/DynamicCards.tsx";
import DynamicTable from "./DynamicListViews/DynamicTable.tsx";

import { Box, Typography } from "@mui/material";

import { FilterCondition, FormField, Identifiable, SortCondition } from "../types/interfaces.ts";
import DynamicTable2 from "./DynamicListViews/DynamicTable2.tsx";
//import { DynamicListProps, Identifiable } from "../types/interfaces";
interface DynamicListProps<T extends Identifiable & object> {
  items: T[];
  fields: FormField<T, any>[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  itemBasePath: string;
  listTitle: string;
  // onEditSchema?: () => void;
  // ★修正: ソート関連のProps
  onSortChange: (newSortConditions: SortCondition<T>[]) => void; // ソート条件全体を通知
  currentSortConditions?: SortCondition<T>[]; // 現在のソート条件の配列
  // ★追加: フィルタリング関連のProps
  onFilterChange?: (newFilterConditions: FilterCondition<T>[]) => void; // フィルタリング条件全体を通知
  currentFilterConditions?: FilterCondition<T>[]; // 現在のフィルタリング条件の配列
  currentViewType: "table" | "cards"; // DynamicList は table または cards のみ扱う
  isStickyHeader?: boolean;
}

function DynamicList<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
  listTitle,
  onSortChange, // ★追加: Propsとして受け取る
  currentSortConditions, // ★追加: Propsとして受け取る
  onFilterChange, // ★追加: Propsとして受け取る
  currentFilterConditions, // ★追加: Propsとして受け取る
  currentViewType,
  isStickyHeader = false,
}: DynamicListProps<T>) {
  return (
    <Box sx={{ flex: 1 }}>
      {items.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: "center" }}>
          まだ {listTitle.replace("既存の", "").replace("リスト", "")} がありません。
        </Typography>
      ) : currentViewType === "cards" ? (
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
      ) : currentViewType === "table" && isStickyHeader ? (
        // デフォルトは 'table'
        <DynamicTable2
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
      ) : currentViewType === "table" && !isStickyHeader ? (
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
      ) : null}
    </Box>
  );
}

export default DynamicList;
