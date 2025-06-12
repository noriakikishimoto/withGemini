import { render, screen, fireEvent } from '@testing-library/react'; // React Testing Libraryから必要なものをインポート
import '@testing-library/jest-dom'; // カスタムマッチャーを使えるようにするため（setupTests.tsで設定済みですが、念のため）

import ApplicationForm from './ApplicationForm'; // テスト対象のコンポーネントをインポート

// describeブロックでテストのグループを定義
describe('ApplicationForm', () => {
  // it (または test) ブロックで個々のテストケースを定義
  test('フォームのタイトルが正しく表示されること', () => {
    // コンポーネントをレンダリング
    render(<ApplicationForm />);

    // 画面上に「申請フォーム」というテキストがあるかを確認
    // getByText は、テキストコンテンツで要素を探すメソッド
    expect(screen.getByText('申請フォーム')).toBeInTheDocument();
  });

  test('入力フィールドに値が入力できること', () => {
    render(<ApplicationForm />);

    // ロールとプレースホルダー/ラベルテキストで入力フィールドを取得
    const titleInput = screen.getByLabelText('申請タイトル:');
    const descriptionInput = screen.getByLabelText('申請内容:');
    const applicantInput = screen.getByLabelText('申請者名:');

    // fireEvent を使って入力イベントをシミュレート
    fireEvent.change(titleInput, { target: { value: 'テスト申請タイトル' } });
    fireEvent.change(descriptionInput, { target: { value: 'テスト申請内容' } });
    fireEvent.change(applicantInput, { target: { value: 'テスト申請者' } });

    // 入力フィールドの値が正しく更新されたかを確認
    expect(titleInput).toHaveValue('テスト申請タイトル');
    expect(descriptionInput).toHaveValue('テスト申請内容');
    expect(applicantInput).toHaveValue('テスト申請者');
  });

  test('フォーム送信時にアラートが表示されること', async () => {
    // `spyOn` を使って `window.alert` をモック化し、実際にアラートが出ないようにする
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ApplicationForm />);

    // 各フィールドに値を入力
    const titleInput = screen.getByLabelText('申請タイトル:');
    const descriptionInput = screen.getByLabelText('申請内容:');
    const applicantInput = screen.getByLabelText('申請者名:');
    fireEvent.change(titleInput, { target: { value: 'テスト' } });
    fireEvent.change(descriptionInput, { target: { value: 'テスト内容' } });
    fireEvent.change(applicantInput, { target: { value: 'テスト太郎' } });

    // 送信ボタンを取得し、クリックイベントをシミュレート
    const submitButton = screen.getByRole('button', { name: /申請を保存/i }); // 大文字小文字を無視してボタンを探す
    fireEvent.click(submitButton);

    // アラートが1回呼び出されたことを確認
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledWith('申請が保存されました！');

    // モックを復元
    alertMock.mockRestore();
  });
});