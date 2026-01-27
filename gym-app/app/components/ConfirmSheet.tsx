"use client";

import BottomSheet from "./BottomSheet";
import { useGymStore } from "../../store/gym";

export default function ConfirmSheet() {
  const sheet = useGymStore((state) => state.ui.sheet);
  const closeSheet = useGymStore((state) => state.closeSheet);

  if (sheet.type !== "confirm") return null;

  const { title, message, confirmLabel, tone, onConfirm } = sheet.payload;

  return (
    <BottomSheet
      open={sheet.open}
      title={title}
      onClose={closeSheet}
      footer={
        <div className="sheet__actions">
          <button type="button" className="btn btn--ghost" onClick={closeSheet}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${tone === "danger" ? "btn--danger" : "btn--primary"}`}
            onClick={() => {
              onConfirm();
              closeSheet();
            }}
          >
            {confirmLabel ?? "Confirm"}
          </button>
        </div>
      }
    >
      <p className="muted">{message}</p>
    </BottomSheet>
  );
}
