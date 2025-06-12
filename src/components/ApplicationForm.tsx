// src/components/ApplicationForm.tsx

import React, { useState, FC, FormEvent, useEffect } from 'react'; // ★useEffectをインポート


// 申請データの型を定義します（重要！）
// これにより、titleは文字列、descriptionも文字列、applicantも文字列である、
// ということが明確になります。
interface ApplicationData {
 // ★追加: データの一意性を保つためのID
  id: string;
  title: string;
  description: string;
  applicant: string;
}

// ApplicationFormコンポーネントのPropsの型を定義
// 今回はPropsを受け取らないので空ですが、将来的に増えるかもしれません
interface ApplicationFormProps {
  // 例えば、onSubmit: (data: ApplicationData) => void; のように定義することもあります
}

// FC (FunctionComponent) はReactの関数コンポーネントの型
const ApplicationForm: FC<ApplicationFormProps> = () => {
  // 各入力フィールドの値を管理するためのステートを定義
  // useStateのジェネリクスで型を指定することで、string型のステートであることを明示
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [applicant, setApplicant] = useState<string>('');

  // 申請データを管理するためのステートを追加
  // 初期値は空の配列（ApplicationData型の配列であることを明示）
  const [applications, setApplications] = useState<ApplicationData[]>([]);

    // ★追加: 現在編集中の申請のIDを管理するステート
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);

    // ★追加: コンポーネントがマウントされた時（最初に表示された時）に一度だけ実行される処理
  useEffect(() => {
    // ローカルストレージからデータを読み込む
    const storedApplications = localStorage.getItem('applications');
    if (storedApplications) {
      try {
        // JSON文字列をオブジェクトの配列に変換
        const parsedApplications: ApplicationData[] = JSON.parse(storedApplications);
        setApplications(parsedApplications); // ステートを更新
      } catch (error) {
        console.error("ローカルストレージの解析に失敗しました:", error);
        localStorage.removeItem('applications'); // 不正なデータをクリア
      }
    }
  }, []); // 空の依存配列 `[]` は、このエフェクトがコンポーネントのマウント時に一度だけ実行されることを意味します。

    // ★追加: editingApplicationId が変更された時にフォームにデータを読み込む
  useEffect(() => {
    if (editingApplicationId) {
      const appToEdit = applications.find(app => app.id === editingApplicationId);
      if (appToEdit) {
        setTitle(appToEdit.title);
        setDescription(appToEdit.description);
        setApplicant(appToEdit.applicant);
      }
    } else {
      // 編集モードでない場合はフォームをクリア
      setTitle('');
      setDescription('');
      setApplicant('');
    }
  }, [editingApplicationId, applications]); // editingApplicationId または applications が変更されたら実行


  // フォーム送信時の処理（修正あり）
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingApplicationId) {
      // ★編集モードの場合の処理
      setApplications((prevApplications) => {
        const updatedApplications = prevApplications.map((app) =>
          app.id === editingApplicationId
            ? { ...app, title, description, applicant } // 編集中のIDと一致したら新しいデータで上書き
            : app // そうでなければ元のデータをそのまま
        );
        localStorage.setItem('applications', JSON.stringify(updatedApplications));
        return updatedApplications;
      });
      alert('申請が更新されました！');
      setEditingApplicationId(null); // 編集モードを終了
    } else {
      // ★新規作成モードの場合の処理（既存ロジック）
      const newApplication: ApplicationData = {
        id: Date.now().toString(),
        title,
        description,
        applicant,
      };

      setApplications((prevApplications) => {
        const updatedApplications = [...prevApplications, newApplication];
        localStorage.setItem('applications', JSON.stringify(updatedApplications));
        return updatedApplications;
      });
      alert('申請が保存されました！');
    }

    // フォームをクリアする (編集モード終了時も含む)
    setTitle('');
    setDescription('');
    setApplicant('');
  };

  // 申請を削除する関数（変更なし）
  const handleDelete = (id: string) => {
    setApplications((prevApplications) => {
      const updatedApplications = prevApplications.filter(app => app.id !== id);
      localStorage.setItem('applications', JSON.stringify(updatedApplications));
      return updatedApplications;
    });
    // 削除した項目が編集中の場合、編集モードを終了
    if (editingApplicationId === id) {
        setEditingApplicationId(null);
    }
    alert('申請が削除されました。');
  };

  // ★追加: 申請を編集する関数
  const handleEdit = (id: string) => {
    setEditingApplicationId(id); // 編集中のIDをステートに設定
    // useEffectがこのIDを検知してフォームにデータを読み込む
  };

  // ★追加: 編集キャンセル関数
  const handleCancelEdit = () => {
    setEditingApplicationId(null); // 編集モードを終了
  };

   return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '800px', margin: '20px auto', display: 'flex', gap: '20px' }}>
      {/* フォーム部分 */}
      <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px' }}>
        <h2>申請フォーム</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>
              申請タイトル:
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>
              申請内容:
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', minHeight: '100px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="applicant" style={{ display: 'block', marginBottom: '5px' }}>
              申請者名:
            </label>
            <input
              type="text"
              id="applicant"
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              required
            />
          </div>

          <button
            type="submit"
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            申請を保存
          </button>

          {editingApplicationId && ( // 編集モードの時だけキャンセルボタンを表示
            <button
              type="button" // type="button" にすることでフォーム送信を防ぐ
              onClick={handleCancelEdit}
              style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              キャンセル
            </button>
          )}
        </form>
      </div>

      {/* ★追加: 申請リスト部分 */}
      <div style={{ flex: 1, paddingLeft: '20px' }}>
        <h2>既存の申請 ({applications.length} 件)</h2>
        {applications.length === 0 ? (
          <p>まだ申請がありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {applications.map((app) => (
              <li key={app.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <h3>{app.title}</h3>
                <p><strong>申請者:</strong> {app.applicant}</p>
                <p><strong>内容:</strong> {app.description.substring(0, 50)}...</p> {/* 長い場合は短縮表示 */}
                 {/* ★追加: 編集ボタン */}
                  <button
                    onClick={() => handleEdit(app.id)}
                    style={{ backgroundColor: '#ffc107', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' }}
                  >
                    編集
                  </button>
                {/* 編集・削除ボタンは後で追加 */}
                                {/* ★追加: 削除ボタン */}
                <button
                  onClick={() => handleDelete(app.id)} // クリック時に handleDelete 関数を呼び出す
                  style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
                >
                  削除
                </button>
            
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};



export default ApplicationForm;