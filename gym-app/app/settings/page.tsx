"use client";

import HeaderBar from "../shared/components/HeaderBar";
import { useAppActions } from "../../store/useAppActions";
import { useSettingsShallow } from "../../store/useSettingsStore";
import { useUiShallow } from "../../store/useUiStore";
import { formatWeight, kgToLb, lbToKg } from "../../app/shared/lib/utils";
import type { Command } from "../../commands/types";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettingsShallow((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
  }));
  const { exportData, importData } = useAppActions();
  const { openConfirm, showSnackbar } = useUiShallow((state) => ({
    openConfirm: state.openConfirm,
    showSnackbar: state.showSnackbar,
  }));
  const { motionStyle, setMotionStyle } = useUiShallow((s) => ({
    motionStyle: s.motionStyle,
    setMotionStyle: s.setMotionStyle,
  }));

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

  const inputUnits = settings.unitsPreference;
  const barWeightInput =
    inputUnits === "lb"
      ? Math.round(kgToLb(settings.defaultBarWeight) * 100) / 100
      : settings.defaultBarWeight;

  return (
    <div className="page container">
      <HeaderBar title="Settings" />

      <div className="card">
        <div className="card__body stack">
          <div className="field">
            <span className="label">Input units</span>
            <div className="cluster">
              <div className="segmented">
                <button
                  type="button"
                  className={`button${settings.unitsPreference === "kg" ? " button--primary" : ""}`}
                  onClick={() => updateSettings({ unitsPreference: "kg" })}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={`button${settings.unitsPreference === "lb" ? " button--primary" : ""}`}
                  onClick={() => updateSettings({ unitsPreference: "lb" })}
                >
                  lb
                </button>
              </div>
              <span className="badge">kg & lb always visible</span>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="bar-weight">
              Default bar weight ({inputUnits})
            </label>
            <input
              id="bar-weight"
              className="input"
              inputMode="decimal"
              value={Number.isFinite(barWeightInput) ? barWeightInput : 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                const safe = Number.isFinite(next) ? next : 0;
                const nextKg = inputUnits === "lb" ? lbToKg(safe) : safe;
                updateSettings({ defaultBarWeight: nextKg });
              }}
            />
            <span className="help">Current: {formatWeight(settings.defaultBarWeight)}</span>
          </div>

          <div className="field">
            <span className="label">Animations</span>
            <div className="segmented">
              <button
                type="button"
                className={`button${motionStyle === "lift" ? " button--primary" : ""}`}
                onClick={() => setMotionStyle("lift")}
              >
                💪 Lift
              </button>
              <button
                type="button"
                className={`button${motionStyle === "slide" ? " button--primary" : ""}`}
                onClick={() => setMotionStyle("slide")}
              >
                ⚡ Slide
              </button>
              <button
                type="button"
                className={`button${motionStyle === "spring" ? " button--primary" : ""}`}
                onClick={() => setMotionStyle("spring")}
              >
                🔥 Spring
              </button>
            </div>
            <span className="help">Choose transition style for route changes</span>
          </div>

          <div className="field">
            <label className="label" htmlFor="reduce-motion">
              <span className="checkbox-field">
                <input
                  id="reduce-motion"
                  type="checkbox"
                  className="checkbox"
                  checked={settings.reduceMotion ?? false}
                  onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
                />
                <span>Reduce motion</span>
              </span>
            </label>
            <span className="help">Disable all animations and view transitions</span>
          </div>
        </div>
      </div>

      <section className="page__section">
        <h2 className="card__title">Data</h2>
        <div className="stack">
          <button type="button" className="button button--secondary" onClick={handleExport}>
            Export JSON
          </button>
          <label className="button button--ghost">
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} hidden />
          </label>
        </div>
      </section>

      <section className="page__section">
        <h2 className="card__title">Danger zone</h2>
        <button
          type="button"
          className="button button--danger"
          onClick={() => {
            const command: Command = { type: "RESET_ALL" };
            openConfirm({
              title: "Reset all data?",
              message: "This replaces everything with the default sample data.",
              confirmLabel: "Reset",
              tone: "danger",
              command,
            });
          }}
        >
          Reset all data
        </button>
      </section>
    </div>
  );
}
