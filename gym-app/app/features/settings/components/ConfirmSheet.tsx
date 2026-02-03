"use client";

import BottomSheet from "../../../shared/components/BottomSheet";
import { useCommandExecutor } from "../../../../commands/useCommandExecutor";
import { useUiShallow } from "../../../../store/useUiStore";

export default function ConfirmSheet() {
  const { sheet, closeSheet } = useUiShallow((state) => ({
    sheet: state.sheet,
    closeSheet: state.closeSheet,
  }));
  const executeCommand = useCommandExecutor();

  if (sheet.type !== "confirm") return null;

  const { title, message, confirmLabel, tone, command } = sheet.payload;

  return (
    <BottomSheet
      open={sheet.open}
      title={title}
      onClose={closeSheet}
      footer={
        <div className="ui-sheet__actions sheet__actions">
          <button type="button" className="ui-button button button--ghost" data-variant="ghost" onClick={closeSheet}>
            Cancel
          </button>
          <button
            type="button"
            className={`ui-button button ${tone === "danger" ? "button--danger" : "button--primary"}`}
            data-variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => {
              executeCommand(command);
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
