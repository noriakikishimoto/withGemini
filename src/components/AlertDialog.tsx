import React, { FC } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  severity?: "error" | "warning" | "info" | "success";
  confirmText?: string;
  // ★追加: 確認ボタンが押されたときに呼ばれるコールバック
  onConfirm?: () => void;
}

const AlertDialog: FC<AlertDialogProps> = ({
  open,
  onClose,
  title,
  message,
  severity = "info",
  confirmText = "OK",
  onConfirm, // ★追加: onConfirm をプロップとして受け取る
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{message}</DialogContentText>

        {/*   <Alert severity={severity} sx={{ width: "100%" }}>
          <DialogContentText id="alert-dialog-description" component="span">
            {message}
          </DialogContentText>
        </Alert>
        */}
      </DialogContent>
      <DialogActions>
        {/* キャンセルボタン（onClose を呼び出す） */}
        {onConfirm && ( // onConfirm が存在する場合のみキャンセルボタンも表示
          <Button onClick={onClose}>キャンセル</Button>
        )}
        {/* 確認ボタン（onConfirm を呼び出すか、onClose を呼び出す） */}
        <Button onClick={onConfirm || onClose} autoFocus>
          {" "}
          {/* onConfirm があればそれを、なければ onClose を呼ぶ */}
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
