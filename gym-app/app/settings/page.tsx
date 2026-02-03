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

      <div className="ui-card card" data-surface="1">
        <div className="ui-card__body card__body stack">
          <div className="ui-field field">
            <span className="ui-label label">Input units</span>
            <div className="cluster">
              <div className="segmented">
                <button
                  type="button"
                  className={`ui-button button${settings.unitsPreference === "kg" ? " button--primary" : ""}`}
                  data-variant={settings.unitsPreference === "kg" ? "primary" : "ghost"}
                  data-state={settings.unitsPreference === "kg" ? "selected" : "default"}
                  data-size="sm"
                  onClick={() => updateSettings({ unitsPreference: "kg" })}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={`ui-button button${settings.unitsPreference === "lb" ? " button--primary" : ""}`}
                  data-variant={settings.unitsPreference === "lb" ? "primary" : "ghost"}
                  data-state={settings.unitsPreference === "lb" ? "selected" : "default"}
                  data-size="sm"
                  onClick={() => updateSettings({ unitsPreference: "lb" })}
                >
                  lb
                </button>
              </div>
              <span className="ui-badge badge" data-variant="neutral">
                kg & lb always visible
              </span>
            </div>
          </div>

          <div className="ui-field field">
            <label className="ui-label label" htmlFor="bar-weight">
              Default bar weight ({inputUnits})
            </label>
            <input
              id="bar-weight"
              className="ui-input input"
              inputMode="decimal"
              value={Number.isFinite(barWeightInput) ? barWeightInput : 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                const safe = Number.isFinite(next) ? next : 0;
                const nextKg = inputUnits === "lb" ? lbToKg(safe) : safe;
                updateSettings({ defaultBarWeight: nextKg });
              }}
            />
            <span className="ui-help help">Current: {formatWeight(settings.defaultBarWeight)}</span>
          </div>

          <div className="ui-field field">
            <span className="ui-label label">Animations</span>
            <div className="segmented">
              <button
                type="button"
                className={`ui-button button${motionStyle === "lift" ? " button--primary" : ""}`}
                data-variant={motionStyle === "lift" ? "primary" : "ghost"}
                data-state={motionStyle === "lift" ? "selected" : "default"}
                data-size="sm"
                onClick={() => setMotionStyle("lift")}
              >
                💪 Lift
              </button>
              <button
                type="button"
                className={`ui-button button${motionStyle === "slide" ? " button--primary" : ""}`}
                data-variant={motionStyle === "slide" ? "primary" : "ghost"}
                data-state={motionStyle === "slide" ? "selected" : "default"}
                data-size="sm"
                onClick={() => setMotionStyle("slide")}
              >
                ⚡ Slide
              </button>
              <button
                type="button"
                className={`ui-button button${motionStyle === "spring" ? " button--primary" : ""}`}
                data-variant={motionStyle === "spring" ? "primary" : "ghost"}
                data-state={motionStyle === "spring" ? "selected" : "default"}
                data-size="sm"
                onClick={() => setMotionStyle("spring")}
              >
                🔥 Spring
              </button>
            </div>
            <span className="ui-help help">Choose transition style for route changes</span>
          </div>

          <div className="ui-field field">
            <label className="ui-label label" htmlFor="reduce-motion">
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
            <span className="ui-help help">Disable all animations and view transitions</span>
          </div>
        </div>
      </div>

      <section className="page__section">
        <h2 className="ui-section-title section-title">Data</h2>
        <div className="stack">
          <button type="button" className="ui-button button button--secondary" data-variant="secondary" onClick={handleExport}>
            Export JSON
          </button>
          <label className="ui-button button button--ghost" data-variant="ghost">
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} hidden />
          </label>
        </div>
      </section>

      <section className="page__section">
        <h2 className="ui-section-title section-title">Danger zone</h2>
        <button
          type="button"
          className="ui-button button button--danger"
          data-variant="danger"
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
