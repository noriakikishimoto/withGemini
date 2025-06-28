import React, { FC, useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// 共通の型定義をインポート
import {
  User,
  FormField,
  CommonFormFieldComponent,
  GenericRecord,
  AppSchema,
} from "../../../types/interfaces";
import { userRepository } from "../../../repositories/userRepository.ts";
import { appSchemaRepository } from "../../../repositories/appSchemaRepository.ts";
import DynamicForm from "../../../components/DynamicForm.tsx";
import DynamicList from "../../../components/DynamicList.tsx";
import { getFieldComponentByType } from "../utils/fieldComponentMapper";

// DynamicList に渡すため、MuiTextFieldWrapper と MuiSelectFieldWrapper をインポート
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx";
import MuiSelectFieldWrapper from "../../../components/FormFields/MuiSelectFieldWrapper.tsx";
import { useUserContext } from "../../../contexts/UserContext.tsx";
import { useGlobalDataContext } from "../../../contexts/GlobalDataContext.tsx";

// UserManagementPageProps インターフェース
interface UserManagementPageProps {}

// UserManagementPage コンポーネントの定義
const UserManagementPage: FC<UserManagementPageProps> = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [userSchema, setUserSchema] = useState<AppSchema | null>(null); // ユーザーのカスタムフィールド用スキーマ
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userMode, setUserMode] = useState<"create" | "edit">("create");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState<User | null>(null);

  const { login } = useUserContext();
  const { refetchGlobalData } = useGlobalDataContext();

  // ユーザー情報をロードする関数
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userRepository.getAll();
      setUsers(fetchedUsers);

      // 「ユーザー」アプリのスキーマをロード (カスタムフィールド取得用)
      const allAppSchemas = await appSchemaRepository.getAll();
      const foundUserSchema = allAppSchemas.find((s) => s.name === "ユーザー"); // アプリ名で検索
      setUserSchema(foundUserSchema || null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("ユーザー情報の読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ユーザー作成/編集モーダル関連ハンドラ
  const handleOpenUserModal = (userId?: string) => {
    setIsUserModalOpen(true);
    if (userId) {
      setUserMode("edit");
      setEditingUserId(userId);
      const userToEdit = users.find((u) => u.id === userId);
      setEditingUserData(userToEdit || null);
    } else {
      setUserMode("create");
      setEditingUserId(null);
      // ★修正: 新規ユーザーの初期値に displayName と email を追加
      setEditingUserData({ id: "", username: "", displayName: "", email: "", role: "user" });
    }
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setEditingUserData(null);
  };

  const handleSaveUser = async (data: User) => {
    try {
      if (userMode === "edit" && editingUserId) {
        await userRepository.update(editingUserId, data);
        alert(`ユーザー「${data.displayName || data.username}」が更新されました！`); // displayName を優先
      } else {
        await userRepository.create(data);
        alert(`ユーザー「${data.displayName || data.username}」が作成されました！`); // displayName を優先
      }
      fetchUsers();
      refetchGlobalData();
      handleCloseUserModal();
    } catch (err) {
      console.error("Error saving user:", err);
      alert("ユーザーの保存に失敗しました: " + (err as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("このユーザーを本当に削除しますか？")) {
      try {
        await userRepository.delete(userId);
        alert("ユーザーが削除されました！");
        fetchUsers();
        refetchGlobalData();
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("ユーザーの削除に失敗しました: " + (err as Error).message);
      }
    }
  };

  // DynamicForm に渡すフィールド定義 (固定フィールド + カスタムフィールド)
  const userFormFields = useMemo(() => {
    const baseFields: FormField<User, CommonFormFieldComponent<any>>[] = [
      {
        name: "username",
        label: "ユーザー名",
        type: "text",
        required: true,
        component: MuiTextFieldWrapper,
        initialValue: "",
      },
      // ★追加: displayName (表示名) フィールド
      {
        name: "displayName",
        label: "表示名",
        type: "text",
        required: true,
        component: MuiTextFieldWrapper,
        initialValue: "",
      },
      // ★追加: email (メールアドレス) フィールド
      {
        name: "email",
        label: "メールアドレス",
        type: "email",
        required: true,
        component: MuiTextFieldWrapper,
        initialValue: "",
      },

      {
        name: "role",
        label: "ロール",
        type: "select",
        required: true,
        component: MuiSelectFieldWrapper,
        initialValue: "user",
        options: [
          { value: "admin", label: "管理者" },
          { value: "user", label: "一般ユーザー" },
        ],
      },
    ];

    // ユーザーアプリのカスタムフィールドを追加
    if (userSchema && userSchema.fields) {
      const customFields: FormField<User, CommonFormFieldComponent<any>>[] = userSchema.fields.map(
        (fieldDef) => ({
          ...fieldDef,
          name: fieldDef.name as keyof User, // User 型のキーにキャスト
          component: getFieldComponentByType(fieldDef.type),
        })
      );
      return [...baseFields, ...customFields];
    }
    return baseFields;
  }, [userSchema, userMode]);

  // DynamicList に渡すフィールド定義 (固定フィールド + カスタムフィールド)
  const userListFields = useMemo(() => {
    const baseFields: FormField<User, CommonFormFieldComponent<any>>[] = [
      { name: "username", label: "ユーザー名", type: "text", component: MuiTextFieldWrapper },
      // ★追加: displayName (表示名) フィールド
      { name: "displayName", label: "表示名", type: "text", component: MuiTextFieldWrapper },
      // ★追加: email (メールアドレス) フィールド
      { name: "email", label: "メールアドレス", type: "email", component: MuiTextFieldWrapper },
      { name: "role", label: "ロール", type: "text", component: MuiTextFieldWrapper },
      // パスワードはリストに表示しない
    ];

    if (userSchema && userSchema.fields) {
      const customFields: FormField<User, CommonFormFieldComponent<any>>[] = userSchema.fields.map(
        (fieldDef) => ({
          ...fieldDef,
          name: fieldDef.name as keyof User,
          component: getFieldComponentByType(fieldDef.type),
        })
      );
      return [...baseFields, ...customFields];
    }
    return baseFields;
  }, [userSchema]);

  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          ユーザー情報を読み込み中...
        </Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <Typography variant="body1">エラー: {error}</Typography>
        <Button onClick={fetchUsers} variant="contained">
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: "left", mb: 3 }}>
        ユーザー管理
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenUserModal()}>
          新しいユーザーを作成
        </Button>
      </Box>

      {users.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          まだユーザーが登録されていません。
        </Typography>
      ) : (
        <DynamicList<User>
          items={users}
          fields={userListFields}
          onEdit={(id) => handleOpenUserModal(id)}
          onDelete={handleDeleteUser}
          itemBasePath="/generic-db/users" // ユーザー詳細ページへのパス (必要であれば)
          listTitle="ユーザー"
          // UserManagementPage ではソート・フィルタ・表示列設定は簡易化
          onSortChange={() => {}}
          currentSortConditions={[]}
          onFilterChange={() => {}}
          currentFilterConditions={[]}
          currentViewType={"table"}
        />
      )}

      {/* ユーザー作成/編集モーダル */}
      <Dialog open={isUserModalOpen} onClose={handleCloseUserModal} fullWidth maxWidth="sm">
        <DialogTitle>{userMode === "create" ? "新しいユーザーを作成" : "ユーザーを編集"}</DialogTitle>
        <DialogContent>
          {editingUserData && (
            <DynamicForm<User>
              fields={userFormFields}
              initialData={editingUserData}
              onSubmit={handleSaveUser}
              onCancel={handleCloseUserModal}
              submitButtonText={userMode === "create" ? "作成" : "保存"}
            />
          )}
        </DialogContent>
        <DialogActions>
          {/* DynamicForm 内にボタンがあるため、ここではキャンセルボタンのみ */}
          {!editingUserData && (
            <Button onClick={handleCloseUserModal} color="secondary">
              キャンセル
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ★追加: 各ユーザーにログインボタンと、現在のログインユーザーを表示するUI */}
      <Box sx={{ mt: 3, p: 2, borderTop: "1px solid #eee" }}>
        <Typography variant="h6" gutterBottom>
          操作ユーザーの切り替え
        </Typography>
        <List dense>
          {users.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <Button size="small" variant="outlined" onClick={() => login(user)}>
                  このユーザーでログイン
                </Button>
              }
            >
              <ListItemText primary={`${user.displayName} (${user.username}) - ${user.role}`} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default UserManagementPage;
