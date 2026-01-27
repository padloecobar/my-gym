"use client";

import HeaderBar from "../components/HeaderBar";
import { useGymStore } from "../../store/gym";
import { formatKg } from "../../lib/utils";

export default function SettingsPage() {
  const settings = useGymStore((state) => state.settings);
  const updateSettings = useGymStore((state) => state.updateSettings);
  const exportData = useGymStore((state) => state.exportData);
  const importData = useGymStore((state) => state.importData);
  const openConfirm = useGymStore((state) => state.openConfirm);
  const resetAll = useGymStore((state) => state.resetAll);
  const showSnackbar = useGymStore((state) => state.showSnackbar);

  const handleExport = async () => {
    const payload = await exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gym-export-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importData(parsed);
      showSnackbar("Data imported");
    } catch {
      showSnackbar("Import failed");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="page container">
      <HeaderBar title="Settings" />

      <div className="card">
        <div className="card__body stack">
          <div className="field">
            <span className="label">Units preference</span>
            <div className="cluster">
              <button
                type="button"
                className={`btn${settings.unitsPreference === "kg" ? " btn--primary" : ""}`}
                onClick={() => updateSettings({ unitsPreference: "kg" })}
              >
                kg
              </button>
              <button
                type="button"
                className={`btn${settings.unitsPreference === "lb" ? " btn--primary" : ""}`}
                onClick={() => updateSettings({ unitsPreference: "lb" })}
              >
                lb
              </button>
              <span className="badge">kg always visible</span>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="bar-weight">
              Default bar weight
            </label>
            <input
              id="bar-weight"
              className="input"
              inputMode="decimal"
              value={settings.defaultBarWeight}
              onChange={(event) => {
                const next = Number(event.target.value);
                updateSettings({ defaultBarWeight: Number.isFinite(next) ? next : 0 });
              }}
            />
            <span className="help">Current: {formatKg(settings.defaultBarWeight)} kg</span>
          </div>
        </div>
      </div>

      <section className="page__section">
        <h2 className="card__title">Data</h2>
        <div className="stack">
          <button type="button" className="btn" onClick={handleExport}>
            Export JSON
          </button>
          <label className="btn btn--ghost">
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} hidden />
          </label>
        </div>
      </section>

      <section className="page__section">
        <h2 className="card__title">Danger zone</h2>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() =>
            openConfirm({
              title: "Reset all data?",
              message: "This replaces everything with the default sample data.",
              confirmLabel: "Reset",
              tone: "danger",
              onConfirm: () => resetAll(),
            })
          }
        >
          Reset all data
        </button>
      </section>
    </div>
  );
}
