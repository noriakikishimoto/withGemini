// src/__tests__/App.test.tsx

import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import App from '../App';
// applicationRepository モジュール全体をインポート。これはモック化される対象
import * as applicationRepository from '../repositories/applicationRepository';
import { ApplicationData,  BaseRepository, Identifiable } from '../types/interfaces'; // 型をインポート

afterEach(cleanup); // 各テストが終了した後にDOMをクリーンアップ

// モックデータを定義（これは各テストで共通の初期状態）
const INITIAL_MOCK_APPLICATIONS: ApplicationData[] = [
  { id: '1', title: 'テスト申請1', description: 'テスト内容1', applicant: 'テストA' },
  { id: '2', title: 'テスト申請2', description: 'テスト内容2', applicant: 'テストB' },
];

// applicationRepository モジュール全体をモック化
// ここでは、モック関数の骨格だけを定義し、具体的な実装は beforeEach で行う
vi.mock('../repositories/applicationRepository', () => {
  // ここでエクスポートされる applicationRepository の型を定義
  const mockedRepoInstance: ApplicationRepository = {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return {
    applicationRepository: mockedRepoInstance,
    // __resetMockData は不要になるので削除
  };
});


describe('App コンポーネント (統合テスト)', () => {
  // ★修正: vi.mocked を使ってモックされたリポジトリインスタンスを取得
  const mockedRepo = vi.mocked(applicationRepository.applicationRepository);

  // 各テストの前に実行されるフック
  beforeEach(() => {
    // 1. 各モック関数の呼び出し履歴をクリア
    mockedRepo.getAll.mockClear();
    mockedRepo.create.mockClear();
    mockedRepo.update.mockClear();
    mockedRepo.delete.mockClear();
    
    // 2. window.alert をモック化し、呼び出されても実行をブロックしないようにする
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 3. ★重要: 各テストケースの前に、モックの振る舞いを「そのテスト専用」に定義し直す
    // テストごとの独立したデータセット
    let currentApplicationsForThisTest: ApplicationData[] = [...INITIAL_MOCK_APPLICATIONS];

    mockedRepo.getAll.mockImplementation(() => Promise.resolve(currentApplicationsForThisTest));
    
    mockedRepo.create.mockImplementation((data: Omit<ApplicationData, 'id'>) => {
        const newApp: ApplicationData = { ...data, id: String(Date.now()) };
        currentApplicationsForThisTest.push(newApp);
        // 新規作成後は、Appコンポーネントがステートを直接更新するので、
        // 次の getAll の呼び出しは不要になることが多い。
        // もし App が作成後にリストを再フェッチするなら、mockedRepo.getAll.mockImplementationOnce などで対応
        return Promise.resolve(newApp);
    });

    mockedRepo.update.mockImplementation((id: string, data: Partial<Omit<ApplicationData, 'id'>>) => {
        let updatedApp: ApplicationData | undefined;
        currentApplicationsForThisTest = currentApplicationsForTest.map(app => {
            if (app.id === id) {
                updatedApp = { ...app, ...data };
                return updatedApp;
            }
            return app;
        }).filter((app): app is ApplicationData => app !== undefined); // undefined を除去する型ガード

        if (!updatedApp) return Promise.reject(new Error('App not found for update mock'));
        // 更新後も同様
        return Promise.resolve(updatedApp);
    });

    mockedRepo.delete.mockImplementation((id: string) => {
        currentApplicationsForThisTest = currentApplicationsForThisTest.filter(app => app.id !== id);
        // 削除後も同様
        return Promise.resolve();
    });
  });

  // テストヘルパー関数: App コンポーネントを MemoryRouter でレンダリング
  const renderAppWithRouter = (initialEntries = ['/list']) => {
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    );
  };

  // --- テストケース ---

  it('初期状態で申請リストが表示され、APIからデータをロードすること', async () => {
    renderAppWithRouter();
    await waitFor(() => {
      expect(screen.queryByText('データを読み込み中...')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '既存の申請 (2 件)' })).toBeInTheDocument();
      expect(screen.getByText('テスト申請1')).toBeInTheDocument();
      expect(screen.getByText('テスト申請2')).toBeInTheDocument();
    });
    expect(mockedRepo.getAll).toHaveBeenCalledTimes(1);
  });

  it('新規申請フォームからデータを保存し、APIが呼び出され、リストに遷移すること', async () => {
    renderAppWithRouter(['/new']);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.queryByText('データを読み込み中...')).not.toBeInTheDocument());

    const titleInput = screen.getByLabelText('申請タイトル:');
    const descriptionInput = screen.getByLabelText('申請内容:');
    const applicantInput = screen.getByLabelText('申請者名:');
    const saveButton = screen.getByRole('button', { name: '申請を保存' });

    const newTitle = '新しい申請タイトルXYZ';
    await user.type(titleInput, newTitle);
    await user.type(descriptionInput, '新しい申請内容です。');
    await user.type(applicantInput, '新しい申請者');
    await user.click(saveButton);

    expect(mockedRepo.create).toHaveBeenCalledTimes(1);
    expect(mockedRepo.create).toHaveBeenCalledWith({
      title: newTitle,
      description: '新しい申請内容です。',
      applicant: '新しい申請者',
    });

    await waitFor(() => {
        expect(vi.mocked(window.alert)).toHaveBeenCalledWith('申請が保存されました！');
    });

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: '既存の申請 (3 件)' })).toBeInTheDocument();
        expect(screen.getByText(newTitle)).toBeInTheDocument();
    });
  });

  it('リストから項目を削除し、APIが呼び出されること', async () => {
    renderAppWithRouter(['/list']);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.queryByText('データを読み込み中...')).not.toBeInTheDocument());

    expect(screen.getByRole('heading', { name: '既存の申請 (2 件)' })).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: '削除' });
    await user.click(deleteButtons[0]); // ID: '1'

    expect(mockedRepo.delete).toHaveBeenCalledTimes(1);
    expect(mockedRepo.delete).toHaveBeenCalledWith('1');

    await waitFor(() => {
        expect(vi.mocked(window.alert)).toHaveBeenCalledWith('申請が削除されました。');
    });

    await waitFor(() => {
        expect(screen.queryByText('テスト申請1')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '既存の申請 (1 件)' })).toBeInTheDocument();
    });
  });

  it('リストから項目を編集し、フォームにデータが読み込まれ、APIで更新されること', async () => {
    renderAppWithRouter(['/list']);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.queryByText('データを読み込み中...')).not.toBeInTheDocument());

    const editButtons = screen.getAllByRole('button', { name: '編集' });
    await user.click(editButtons[0]); // ID: '1'

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: '申請を編集' })).toBeInTheDocument();
      expect(screen.getByLabelText('申請タイトル:')).toHaveValue('テスト申請1');
    });

    const titleInput = screen.getByLabelText('申請タイトル:');
    await user.clear(titleInput);
    await user.type(titleInput, '更新されたタイトル');
    const saveButton = screen.getByRole('button', { name: '変更を保存' });
    await user.click(saveButton);

    expect(mockedRepo.update).toHaveBeenCalledTimes(1);
    expect(mockedRepo.update).toHaveBeenCalledWith('1', {
      title: '更新されたタイトル',
      description: 'テスト内容1',
      applicant: 'テストA',
    });

    await waitFor(() => {
        expect(vi.mocked(window.alert)).toHaveBeenCalledWith('申請が更新されました！');
    });

    await waitFor(() => {
        expect(screen.getByRole('heading', { name: '既存の申請 (2 件)' })).toBeInTheDocument();
        expect(screen.getByText('更新されたタイトル')).toBeInTheDocument();
    });
  });

  it('編集モードでキャンセルするとリストページに戻ること', async () => {
    renderAppWithRouter(['/list']);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.queryByText('データを読み込み中...')).not.toBeInTheDocument());

    const editButtons = screen.getAllByRole('button', { name: '編集' });
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: '申請を編集' })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '既存の申請 (2 件)')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '申請を編集' })).not.toBeInTheDocument();
    });
  });
});