// src/__tests__/ApplicationForm.test.tsx

import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // ★追加: user-event をインポート
import { describe, it, expect, afterEach, vi } from "vitest"; // ★追加: vi (Vitestのモック機能) をインポート
import ApplicationForm from "../components/ApplicationForm";

afterEach(cleanup);

describe("ApplicationForm コンポーネント", () => {
  // 元のテストケース（変更なし）
  it("フォームのタイトルが正しく表示されること", () => {
    render(<ApplicationForm onSubmit={vi.fn()} />);
    const formTitle = screen.getByRole("heading", { level: 2, name: "新規申請フォーム" });
    expect(formTitle).toBeInTheDocument();
  });

  it("必須入力フィールドが全て存在すること", () => {
    render(<ApplicationForm onSubmit={vi.fn()} />);
    const titleInput = screen.getByLabelText("申請タイトル:");
    const descriptionInput = screen.getByLabelText("申請内容:");
    const applicantInput = screen.getByLabelText("申請者名:");
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toBeRequired();
    expect(descriptionInput).toBeInTheDocument();
    expect(descriptionInput).toBeRequired();
    expect(applicantInput).toBeInTheDocument();
    expect(applicantInput).toBeRequired();
  });

  it("「申請を保存」ボタンが初期状態で表示されること", () => {
    render(<ApplicationForm onSubmit={vi.fn()} />);
    const submitButton = screen.getByRole("button", { name: "申請を保存" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  // ★追加: 新規申請のフォーム入力とonSubmitのテスト
  it("フォームにデータを入力し、onSubmitが正しく呼び出されること", async () => {
    // onSubmit 関数が呼び出されたか検証するためのモック関数を作成
    const mockOnSubmit = vi.fn(); // Vitestのモック関数

    render(<ApplicationForm onSubmit={mockOnSubmit} />);

    const user = userEvent.setup(); // user-event のセットアップ

    // 各入力フィールドを取得
    const titleInput = screen.getByLabelText("申請タイトル:");
    const descriptionInput = screen.getByLabelText("申請内容:");
    const applicantInput = screen.getByLabelText("申請者名:");
    const submitButton = screen.getByRole("button", { name: "申請を保存" });

    // フォームに値を入力 (user.type はユーザーの入力イベントをシミュレート)
    await user.type(titleInput, "テスト申請タイトル");
    await user.type(descriptionInput, "これはテスト用の申請内容です。");
    await user.type(applicantInput, "テスト申請者");

    // 送信ボタンをクリック
    await user.click(submitButton);

    // onSubmit が1回呼び出されたことを確認
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    // onSubmit が正しいデータで呼び出されたことを確認 (id は含まれない)
    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: "テスト申請タイトル",
      description: "これはテスト用の申請内容です。",
      applicant: "テスト申請者",
    });
  });

  // ★追加: 編集モード時のフォームの表示と更新のテスト
  it("initialDataが渡されたときに、フォームが編集モードで表示されること", () => {
    const mockInitialData = {
      id: "edit-123",
      title: "編集対象タイトル",
      description: "編集対象内容",
      applicant: "編集対象者",
    };
    const mockOnSubmit = vi.fn();
    const mockOnCancelEdit = vi.fn();

    render(
      <ApplicationForm
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
        onCancelEdit={mockOnCancelEdit}
      />
    );

    // タイトルが「申請を編集」になっていること
    const formTitle = screen.getByRole("heading", { level: 2, name: "申請を編集" });
    expect(formTitle).toBeInTheDocument();

    // ボタンが「変更を保存」になっていること
    const saveButton = screen.getByRole("button", { name: "変更を保存" });
    expect(saveButton).toBeInTheDocument();

    // キャンセルボタンが表示されていること
    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    expect(cancelButton).toBeInTheDocument();

    // フォームフィールドに初期データが読み込まれていること
    expect(screen.getByLabelText("申請タイトル:")).toHaveValue("編集対象タイトル");
    expect(screen.getByLabelText("申請内容:")).toHaveValue("編集対象内容");
    expect(screen.getByLabelText("申請者名:")).toHaveValue("編集対象者");
  });

  // ★追加: 編集モードでキャンセルボタンが機能すること
  it("編集モードでキャンセルボタンをクリックするとonCancelEditが呼び出されること", async () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancelEdit = vi.fn();
    const mockInitialData = {
      id: "edit-123",
      title: "テスト",
      description: "テスト",
      applicant: "テスト",
    };

    render(
      <ApplicationForm
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
        onCancelEdit={mockOnCancelEdit}
      />
    );

    const user = userEvent.setup();
    const cancelButton = screen.getByRole("button", { name: "キャンセル" });

    await user.click(cancelButton);

    expect(mockOnCancelEdit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled(); // 保存はされない
  });
});
