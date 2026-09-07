import { useEffect, useState } from "react";
import "./ActionButton.css";
import "./Field.css";
import { Modal } from "./Modal";

type ConfirmDeleteModalProps = {
  title: string;
  subjectName: string;
  prompt: string;
  open: boolean;
  deleting: boolean;
  confirmLabel?: string;
  busyLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  title,
  subjectName,
  prompt,
  open,
  deleting,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (open) {
      setConfirmName("");
    }
  }, [open, subjectName]);

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <p className="modal-copy">{prompt}</p>
      <label className="field">
        <span className="visually-hidden">Type {subjectName} to confirm</span>
        <input
          type="text"
          value={confirmName}
          onChange={(event) => setConfirmName(event.target.value)}
          autoComplete="off"
          disabled={deleting}
        />
      </label>
      <div className="modal-actions">
        <button type="button" className="action-button action-button--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="action-button action-button--danger"
          disabled={deleting || confirmName !== subjectName}
          onClick={onConfirm}
        >
          {deleting ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
