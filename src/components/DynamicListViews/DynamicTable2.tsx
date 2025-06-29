import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import {
  Badge,
  createTheme,
  IconButton,
  Paper,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// 共通の型定義をインポート
import { FilterCondition, FormField, Identifiable, SortCondition } from "../../types/interfaces";
import { useDrawerContext } from "../../contexts/DrawerContext";
import { isVisible } from "@testing-library/user-event/dist/cjs/utils/index.js";

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
  isStickyHeader?: boolean;
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
  isStickyHeader,
}: DynamicTable2Props<T>) {
  // ★追加: ヘッダ要素の参照用 useRef
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const ghostHeaderRef = useRef<HTMLTableSectionElement>(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false); // ヘッダが固定されているかどうか

  const { drawerOpen } = useDrawerContext();

  const drawerWidth = 200; // Layout.tsx の drawerWidth と一致させる
  const appBarHeight = 0; // Layout.tsx の AppBar の高さ (仮定)
  const mainContentPadding = 24; // Layout.tsx の main Box の p:3 (24px)

  useEffect(() => {
    let animationFrameId: number | null = null;

    const syncColumnWidthsAndPosition = () => {
      if (headerRef.current && ghostHeaderRef.current) {
        const originalThs = headerRef.current.querySelectorAll("th");
        const ghostThs = ghostHeaderRef.current.querySelectorAll("th");

        if (originalThs.length === ghostThs.length) {
          const mainContentElement = document.querySelector("main");
          const mainContentRect = mainContentElement?.getBoundingClientRect();

          if (mainContentElement && mainContentRect) {
            const scrollLeft = mainContentElement.scrollLeft; // main コンテンツのスクロール量

            // ゴーストヘッダの left の初期基準点（main の左端 + そのパディング）
            // drawerOpen の状態によって main の left が変わる
            const baseLeftOffset = mainContentRect.left + mainContentPadding;

            // ゴーストヘッダの left プロパティ（ビューポート基準）
            // transform を使うので、left は初期位置に固定
            ghostHeaderRef.current.style.left = `${baseLeftOffset}px`;

            // ゴーストヘッダの幅は、メインコンテンツの表示可能なコンテンツ幅に合わせる
            // mainContentRect.width は padding を含むので、コンテンツ幅は mainContentRect.width - (mainContentPadding * 2)
            ghostHeaderRef.current.style.width = `${mainContentRect.width - mainContentPadding * 2}px`;

            // 横スクロール量に応じて translateX を調整
            ghostHeaderRef.current.style.transform = `translateX(${-scrollLeft}px)`;

            originalThs.forEach((originalTh, index) => {
              ghostThs[index].style.width = `${originalTh.offsetWidth}px`;
              ghostThs[index].style.minWidth = `${originalTh.offsetWidth}px`;
              ghostThs[index].style.maxWidth = `${originalTh.offsetWidth}px`;
            });
          }
        }
      }
      animationFrameId = null;
    };

    const handleScroll = () => {
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(syncColumnWidthsAndPosition);
      }
    };
    // ★修正: Intersection Observer の条件を厳密に
    const observer = new IntersectionObserver(
      ([entry]) => {
        // isIntersecting: 要素がルート（ビューポート）と交差しているかどうか
        // boundingClientRect.bottom: 要素の下端がビューポート上端からの距離

        // isHeaderSticky を true にするのは、元のヘッダが AppBar の下を完全に通過して上にスクロールした時
        // つまり、本来のヘッダの下端が AppBar の下端よりも上に移動した時
        // または、isIntersecting が false (要素が見えていない) になった時

        // 以下の条件がより正確:
        // 1. entry.isIntersecting が false になった場合 (要素が完全にビューポートから外れた)
        // 2. もしくは、要素の上端が AppBarHeight の位置を完全に超えた場合

        // ゴーストヘッダを表示する条件:
        // 元のヘッダの上端が AppBar の下端よりも上にスクロールし、
        // かつ、元のヘッダがまだ部分的にでも表示されている場合
        // intersectionRatio が 0 になった（完全に画面外に出た）時が最も確実

        // 元のヘッダが、AppBar の下端より上に来たら sticky にする
        //const headerTopRelativeToViewport = entry.boundingClientRect.top;
        //const headerBottomRelativeToViewport = entry.boundingClientRect.bottom;

        // ゴーストヘッダをアクティブにする条件:
        // (1) 元のヘッダの上端が AppBar の下端を越えて上にスクロールした
        // AND (2) 元のヘッダがまだビューポート内に部分的にでも見えている (isIntersecting)
        // OR (3) 元のヘッダが完全にビューポートから上に出てしまった (isIntersecting: false, intersectionRatio: 0)

        // ゴーストヘッダを非表示にする条件:
        // 元のヘッダが AppBar の下端より下に戻ってきた (画面内に戻ってきた)
        // AND (2) 元のヘッダがビューポート内に部分的にでも見えている (isIntersecting)

        // 簡易的かつ効果的な条件:
        // isIntersecting が false になった = 縦方向にもう見えていない
        // または、上端が AppBar の位置を越えて上に隠れていて、それでも IntersectionObserver が交差していると判定している場合
        // setIsHeaderSticky(entry.boundingClientRect.top < appBarHeight && !entry.isIntersecting);

        // 最も分かりやすいのは、元のヘッダが AppBar の下端を越えて上にスクロールし始めたら isSticky = true
        // isSticky = false は、元のヘッダの bottom が AppBar の下端より下に来たら
        // このために threshold を細かく設定するか、boundingClientRect.bottom を使う

        // シンプルな解決策:
        // 元のヘッダの上端が AppBar の下端より上にスクロールした
        // かつ、元のヘッダの高さがゴーストヘッダの高さよりも大きい場合 (折り返し検知)

        // isHeaderSticky は、元のヘッダが AppBar の高さを超えてスクロールしたときに true に、
        // そうでなければ false にする。
        // 横幅の折り返しは isHeaderSticky の判定とは独立させる。

        // `rootMargin` を `-${appBarHeight}px` にすると、その `root` 基準での `isIntersecting` を使う
        // ルートのビューポートをAppBarの下に設定しているので、
        // ヘッダがその「新しいルート」に入ってきたら isIntersecting=true
        // ヘッダがその「新しいルート」から出て行ったら isIntersecting=false

        // ゴーストヘッダを出す条件: 元のヘッダが AppBar の下を通過して**上に消え去る瞬間**
        // ゴーストヘッダを消す条件: 元のヘッダが AppBar の下に戻ってきて**再度表示される瞬間**

        // `rootMargin` を `-${appBarHeight}px` に設定した場合、
        // `entry.isIntersecting` が `false` になった時 (元のヘッダが AppBar の下の領域から完全に上に出て行った時) に `true`
        // `entry.isIntersecting` が `true` になった時 (元のヘッダが AppBar の下の領域に入ってきた時) に `false`

        setIsHeaderSticky(!entry.isIntersecting); // ★修正: isIntersecting が false なら sticky

        // Sticky 状態が切り替わるタイミングで幅と位置を同期
        syncColumnWidthsAndPosition();
      },
      {
        threshold: [0], // 0%表示された時点でコールバック
        root: null,
        rootMargin: `-${appBarHeight}px 0px 0px 0px`, // AppBar の高さ分をオフセット
      }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    const mainContentElement = document.querySelector("main");
    if (mainContentElement) {
      mainContentElement.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", syncColumnWidthsAndPosition);
    }

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
      if (mainContentElement) {
        mainContentElement.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", syncColumnWidthsAndPosition);
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [items, fields, currentSortConditions, drawerOpen, appBarHeight]);

  const renderFieldValue = (item: T, field: FormField<T, any>): React.ReactNode => {
    const value = item[field.name as keyof T]; // 型は any なので、as keyof T でアクセスを安全にする

    const displayValue = String(value ?? "");
    if (field.type === "table") {
      return "(詳細画面で表示)";
    }

    const maxLength = 50; // 切り詰める最大長
    const isTruncated = displayValue.length > maxLength;
    const truncatedValue = isTruncated ? `${displayValue.substring(0, maxLength)}..sss.` : displayValue;

    // completed フィールドの表示ロジック (以前のものを再利用)
    if (field.name === "completed") {
      return value === true || value === "true" ? (
        <span style={{ marginLeft: "10px", color: "green", fontSize: "0.8em" }}>✅ 完了</span>
      ) : (
        <span style={{ marginLeft: "10px", color: "gray", fontSize: "0.8em" }}>❌ 未完了</span>
      );
    }

    // 切り詰めとツールチップを適用
    return isTruncated ? (
      <Tooltip title={displayValue} placement="top">
        <Typography
          variant="body1"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: field.maxWidth || "none", // maxWidth があれば適用
          }}
        >
          {truncatedValue}
        </Typography>
      </Tooltip>
    ) : (
      <Typography
        variant="body1"
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: field.maxWidth || "none", // maxWidth があれば適用
        }}
      >
        {displayValue}
      </Typography>
    );
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2, overflow: "inherit" }}>
      {/* ★追加: ゴーストヘッダ (sticky になるヘッダ) */}
      {isStickyHeader && (
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
                <TableCell
                  key={`ghost-${field.name as string}`}
                  sx={{
                    //    fontWeight: "bold",
                    width: field.width || "auto", // ★追加: width
                    minWidth: field.minWidth || "auto", // ★追加: minWidth
                    maxWidth: field.maxWidth || "auto", // ★追加: maxWidth
                    height: "48px", // ★追加: ヘッダセルの高さを固定
                    whiteSpace: "nowrap", // ★追加: テキストを折り返さない
                    overflow: "hidden", // ★追加: はみ出したテキストを隠す
                    //textOverflow: "ellipsis", // ★追加: はみ出しテキストを...で表示
                  }}
                >
                  <TableSortLabel active={false} direction={undefined}>
                    {" "}
                    {/* ゴーストヘッダではソートボタンは非アクティブ */}
                    {field.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell
                sx={{
                  width: "100px",
                  height: "48px", // ★追加: ヘッダセルの高さを固定
                  whiteSpace: "nowrap", // ★追加: テキストを折り返さない
                  overflow: "hidden", // ★追加: はみ出したテキストを隠す
                  textOverflow: "ellipsis", // ★追加: はみ出しテキストを...で表示
                }}
              ></TableCell>
            </TableRow>
          </TableHead>
        </Table>
      )}

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
                <TableCell
                  key={field.name as string}
                  sx={{
                    //fontWeight: "bold",
                    width: field.width || "auto", // ★追加: width
                    minWidth: field.minWidth || "auto", // ★追加: minWidth
                    maxWidth: field.maxWidth || "auto", // ★追加: maxWidth
                    height: "48px", // ★追加: ヘッダセルの高さを固定
                    whiteSpace: "nowrap", // ★追加: テキストを折り返さない
                    overflow: "hidden", // ★追加: はみ出したテキストを隠す
                    // textOverflow: "ellipsis", // ★追加: はみ出しテキストを...で表示
                  }}
                >
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
            <TableCell
              sx={{
                width: "100px",
                height: "48px", // ★追加: ヘッダセルの高さを固定
                whiteSpace: "nowrap", // ★追加: テキストを折り返さない
                overflow: "hidden", // ★追加: はみ出したテキストを隠す
                textOverflow: "ellipsis", // ★追加: はみ出しテキストを...で表示
              }}
            ></TableCell>
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
              //<TableRow key={item.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableRow key={item.id}>
                {fields.map((field) => (
                  <TableCell
                    key={field.name as string}
                    sx={{
                      width: field.width || "auto", // ★追加: width
                      minWidth: field.minWidth || "auto", // ★追加: minWidth
                      maxWidth: field.maxWidth || "auto", // ★追加: maxWidth
                    }}
                  >
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
                <TableCell
                  sx={{
                    height: "48px", // ★追加: ヘッダセルの高さを固定
                    whiteSpace: "nowrap", // ★追加: テキストを折り返さない
                    overflow: "hidden", // ★追加: はみ出したテキストを隠す
                    textOverflow: "ellipsis", // ★追加: はみ出しテキストを...で表示
                  }}
                >
                  <IconButton aria-label="編集" color="secondary" onClick={() => onEdit(item.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="削除"
                    color="secondary"
                    onClick={() => onDelete(item.id)}
                    sx={{ ml: 0 }}
                  >
                    <DeleteForeverIcon fontSize="small" />
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
