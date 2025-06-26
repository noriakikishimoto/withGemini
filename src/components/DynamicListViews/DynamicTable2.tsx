import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  createTheme,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// 共通の型定義をインポート
import { FilterCondition, FormField, Identifiable, SortCondition } from "../../types/interfaces";
import { useDrawerContext } from "../../contexts/DrawerContext";
// ★追加: ソートアイコン

// DynamicTableが受け取るPropsの型定義
interface DynamicTable2Props<T extends Identifiable & object> {
  items: T[]; // 表示するデータの配列
  fields: FormField<T, any>[]; // 表示するフィールドの定義
  onEdit: (id: string) => void; // 編集ボタンが押されたときに呼ばれるコールバック
  onDelete: (id: string) => void; // 削除ボタンが押されたときに呼ばれるコールバック
  itemBasePath: string; // 詳細ページへのリンクのベースパス
  // ★修正: ソート関連のProps
  onSortChange: (newSortConditions: SortCondition<T>[]) => void;
  currentSortConditions?: SortCondition<T>[];
  // ★追加: フィルタリング関連のProps
  onFilterChange?: (newFilterConditions: FilterCondition<T>[]) => void;
  currentFilterConditions?: FilterCondition<T>[];
}

// DynamicTable コンポーネントの定義
function DynamicTable2<T extends Identifiable & object>({
  items,
  fields,
  onEdit,
  onDelete,
  itemBasePath,
  onSortChange,
  currentSortConditions,
  onFilterChange, // Propsとして受け取る
  currentFilterConditions, // Propsとして受け取る
}: DynamicTable2Props<T>) {
  // ★追加: ヘッダ要素の参照用 useRef
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const ghostHeaderRef = useRef<HTMLTableSectionElement>(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false); // ヘッダが固定されているかどうか

  const { drawerOpen } = useDrawerContext();

  // ★追加: 列幅を同期するための useEffect
  useEffect(() => {
    const syncColumnWidths = () => {
      if (headerRef.current && ghostHeaderRef.current) {
        const originalThs = headerRef.current.querySelectorAll("th");
        const ghostThs = ghostHeaderRef.current.querySelectorAll("th");

        if (originalThs.length === ghostThs.length) {
          originalThs.forEach((originalTh, index) => {
            // originalTh.offsetWidth はパディングやボーダーを含む実際の幅
            ghostThs[index].style.width = `${originalTh.offsetWidth}px`;
            ghostThs[index].style.minWidth = `${originalTh.offsetWidth}px`; // minWidthも設定
            ghostThs[index].style.maxWidth = `${originalTh.offsetWidth}px`; // maxWidthも設定
          });
        }
      }
    };

    // Intersection Observer を設定
    const observer = new IntersectionObserver(
      ([entry]) => {
        // isIntersecting が false かつ intersectionRatio が 0 なら画面外に出た
        // intersectionRatio が 0 で、かつ isIntersecting が false なら画面上部を通過した
        // isIntersecting が true で、かつ intersectionRatio が 1 なら完全に画面内に入った
        // 複雑なので、簡易的に isIntersecting で判定
        setIsHeaderSticky(!entry.isIntersecting || entry.intersectionRatio < 1); // 画面外に出るか、部分的にしか見えない場合に sticky に

        // sticky 状態が切り替わるタイミングで幅を同期
        if (!entry.isIntersecting || entry.intersectionRatio < 1) {
          syncColumnWidths();
        }
      },
      {
        threshold: [0, 1], // 要素が0%または100%表示されたときにコールバックを実行
        root: null, // ビューポートをルートとする
        rootMargin: "0px 0px 0px 0px", // AppBar の高さを考慮してオフセット
      }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    // ウィンドウリサイズ時にも幅を同期
    window.addEventListener("resize", syncColumnWidths);

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
      window.removeEventListener("resize", syncColumnWidths);
    };
  }, [items, fields, currentSortConditions, drawerOpen]); // 依存配列にデータやフィールド定義を追加して再実行

  const renderFieldValue = (item: T, field: FormField<T, any>): React.ReactNode => {
    const value = item[field.name as keyof T]; // 型は any なので、as keyof T でアクセスを安全にする

    // ★修正: table タイプの場合の表示ロジック
    if (field.type === "table") {
      if (Array.isArray(value)) {
        return `明細 ${value.length} 件`; // 例: 「明細 3 件」
      }
      return "明細なし"; // テーブルデータがなければ
    }

    // completed フィールドの表示ロジック (以前のものを再利用)
    if (field.name === "completed") {
      return value === true || value === "true" ? (
        <span style={{ marginLeft: "10px", color: "green", fontSize: "0.8em" }}>✅ 完了</span>
      ) : (
        <span style={{ marginLeft: "10px", color: "gray", fontSize: "0.8em" }}>❌ 未完了</span>
      );
    }

    // その他のフィールドは単純に文字列として表示
    return String(value ?? ""); // nullish coalescing を使用して undefined の場合も安全に
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      {/* ★追加: ゴーストヘッダ (sticky になるヘッダ) */}
      <Table
        sx={{
          position: "fixed",
          top: "0px", // AppBar の高さ（要調整）
          left: drawerOpen ? "224px" : "24px", // ドロワーの幅（要調整）
          zIndex: 100, // 高い z-index で他のコンテンツの上に
          width: "auto", // 幅は JavaScript で調整される
          backgroundColor: "background.paper", // 背景色を設定
          visibility: isHeaderSticky ? "visible" : "hidden", // 表示/非表示を制御
          boxShadow: isHeaderSticky ? "0px 2px 4px rgba(0,0,0,0.1)" : "none", // 影
        }}
      >
        <TableHead ref={ghostHeaderRef}>
          <TableRow>
            {fields.map((field) => (
              <TableCell key={`ghost-${field.name as string}`} sx={{ fontWeight: "bold" }}>
                <TableSortLabel active={false} direction={undefined}>
                  {" "}
                  {/* ゴーストヘッダではソートボタンは非アクティブ */}
                  {field.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell sx={{ fontWeight: "bold", width: "150px" }} align="right">
              アクション
            </TableCell>
          </TableRow>
        </TableHead>
      </Table>

      <Table sx={{ minWidth: 650 }} aria-label="dynamic list table">
        <TableHead ref={headerRef}>
          <TableRow>
            {fields.map((field) => {
              // 現在のフィールドがソート条件に含まれているか、何番目かをチェック
              const currentSortCondition = currentSortConditions?.find(
                (cond) => cond.field === field.name
              );
              const sortIndex = currentSortConditions?.findIndex((cond) => cond.field === field.name);
              const isActive = sortIndex !== undefined && sortIndex !== -1;

              // ソートクリックハンドラ
              const handleHeaderClick = () => {
                let newSortConditions = [...(currentSortConditions || [])];
                const existingIndex = newSortConditions.findIndex((cond) => cond.field === field.name);

                if (existingIndex !== -1) {
                  // 既にソート条件にある場合
                  const currentDir = newSortConditions[existingIndex].direction;
                  if (currentDir === "asc") {
                    newSortConditions[existingIndex].direction = "desc"; // 昇順 -> 降順
                  } else {
                    newSortConditions.splice(existingIndex, 1); // 降順 -> 解除 (配列から削除)
                  }
                } else {
                  // 新しいソート条件を追加 (デフォルトは昇順)
                  newSortConditions.push({ field: field.name, direction: "asc" });
                }
                onSortChange(newSortConditions);
              };

              return (
                <TableCell key={field.name as string} sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={isActive} // active はソートが適用されていて、かつソート解除状態ではない
                    direction={currentSortCondition?.direction} // ソート方向
                    onClick={handleHeaderClick}
                  >
                    {field.label}
                    {isActive && sortIndex !== undefined && sortIndex !== -1 && (
                      <Typography variant="caption" sx={{ ml: 0.5, color: "text.secondary" }}>
                        {sortIndex + 1}
                      </Typography>
                    )}
                  </TableSortLabel>
                </TableCell>
              );
            })}
            <TableCell sx={{ fontWeight: "bold", width: "150px" }} align="right">
              アクション
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={fields.length + 1} sx={{ textAlign: "center", py: 2 }}>
                該当するデータがありません
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                {fields.map((field) => (
                  <TableCell key={field.name as string}>
                    {field.name === fields[0].name ? (
                      <Link
                        to={`${itemBasePath}/${item.id}`}
                        style={{ textDecoration: "none", color: "primary.main", fontWeight: "bold" }}
                      >
                        {renderFieldValue(item, field)}
                      </Link>
                    ) : (
                      <Typography variant="body2">{renderFieldValue(item, field)}</Typography>
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton aria-label="編集" color="warning" onClick={() => onEdit(item.id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="削除"
                    color="error"
                    onClick={() => onDelete(item.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DynamicTable2;
