import { render, screen, cleanup, within } from "@testing-library/react"; // within を追加
import userEvent from "@testing-library/user-event";
import { describe, it, expect, afterEach, vi } from "vitest";
import ApplicationList from "../components/ApplicationList";

afterEach(cleanup);

// テスト用のダミーデータ
const mockApplications = [
  { id: "1", title: "申請1", description: "内容1", applicant: "Aさん" },
  { id: "2", title: "申請2", description: "内容2", applicant: "Bさん" },
  { id: "3", title: "申請3", description: "内容3", applicant: "Cさん" },
];

describe("ApplicationList コンポーネント", () => {
  it("データが渡されないときに「まだ申請がありません」と表示されること", () => {
    render(<ApplicationList applications={[]} onDelete={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByText("まだ申請がありません。")).toBeInTheDocument();
  });

  it("アプリケーションデータが正しくリスト表示されること", () => {
    render(<ApplicationList applications={mockApplications} onDelete={vi.fn()} onEdit={vi.fn()} />);

    // リストの件数が正しいことを確認
    expect(screen.getByRole("heading", { name: "既存の申請 (3 件)" })).toBeInTheDocument();

    // 各申請のタイトルが表示されていることを確認
    expect(screen.getByText("申請1")).toBeInTheDocument();
    expect(screen.getByText("申請2")).toBeInTheDocument();
    expect(screen.getByText("申請3")).toBeInTheDocument();

    // 各申請に編集/削除ボタンがあることを確認
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(mockApplications.length); // リストアイテムの数
    listItems.forEach((item) => {
      // within を使って、各リストアイテム内で要素を検索
      expect(within(item).getByRole("button", { name: "編集" })).toBeInTheDocument();
      expect(within(item).getByRole("button", { name: "削除" })).toBeInTheDocument();
    });
  });

  it("削除ボタンをクリックするとonDeleteが正しいIDで呼び出されること", async () => {
    const mockOnDelete = vi.fn();
    render(<ApplicationList applications={mockApplications} onDelete={mockOnDelete} onEdit={vi.fn()} />);

    const user = userEvent.setup();

    // 最初のリストアイテムの削除ボタンをクリック
    const deleteButtonForApp1 = screen.getAllByRole("button", { name: "削除" })[0];
    await user.click(deleteButtonForApp1);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith("1"); // ID '1' で呼び出されたことを確認
  });

  it("編集ボタンをクリックするとonEditが正しいIDで呼び出されること", async () => {
    const mockOnEdit = vi.fn();
    render(<ApplicationList applications={mockApplications} onDelete={vi.fn()} onEdit={mockOnEdit} />);

    const user = userEvent.setup();

    // 2番目のリストアイテムの編集ボタンをクリック
    const editButtonForApp2 = screen.getAllByRole("button", { name: "編集" })[1];
    await user.click(editButtonForApp2);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith("2"); // ID '2' で呼び出されたことを確認
  });
});
