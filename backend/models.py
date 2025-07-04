from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import enum
import numpy as np


# フロントエンドの src/types/interfaces.ts の FormFieldType に対応
class FormFieldType(str, enum.Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    DATE = "date"
    CHECKBOX = "checkbox"
    SELECT = "select"
    RADIO = "radio"
    EMAIL = "email"
    LOOKUP = "lookup"
    TABLE = "table"
    USER_SELECT = "user_select"


# フロントエンドの src/types/interfaces.ts の CommonFormFieldComponent に対応
# class CommonFormFieldComponent(str):
#    pass


# フロントエンドの src/types/interfaces.ts の FieldDefinition に対応
class FieldDefinition(BaseModel):
    name: str
    label: str
    type: FormFieldType  # FormFieldType は Enum として扱う
    required: Optional[bool] = False
    unique: Optional[bool] = False
    component: Optional[str] = None
    options: Optional[List[Dict[str, str]]] = None  # type: 'select' の場合に使用
    lookupAppId: Optional[str] = None
    lookupAppFieldId: Optional[str] = None
    lookupDisplayFieldId: Optional[str] = None
    initialValue: Optional[Any] = None
    # 新しいフィールドの追加 (interfaces.ts にある width, minWidth, maxWidth, readOnly, valueFormatter)
    width: Optional[str] = None
    minWidth: Optional[str] = None
    maxWidth: Optional[str] = None
    readOnly: Optional[bool] = False


# フロントエンドの src/types/interfaces.ts の AppSchema に対応
class AppSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    fields: List[FieldDefinition] = Field(
        default_factory=list
    )  # フィールド定義のリスト

    # Pydantic の設定: ORMモードを有効にすると、
    # 辞書やORMオブジェクトからモデルを作成する際に、
    # ドット記法でアクセスできるようになる (例: obj.id)
    class Config:
        from_attributes = True
        # ★追加: Enum の値を直接使うように設定 (AppSchema 全体にも影響)


# ★追加: FAQ モデルの定義
class FAQ(BaseModel):
    id: Optional[str] = None  # IDはオプションにし、API/DB層で生成することも可能に
    question: str
    answer: str
    # ★修正: question_embedding を Optional で Field(default=None) に
    question_embedding: Optional[List[float]] = Field(default=None)

    class Config:
        from_attributes = True
        # ★追加: NumPy 配列を JSON に変換するためのエンコーダ (埋め込みが NumPy の場合)
        json_encoders = {np.ndarray: lambda x: x.tolist()}
