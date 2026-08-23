import type { AppState, Settings } from "../types";
import { stopSpeak } from "../lib/speech";

type Props = {
  state: AppState;
  onSettings: (settings: Partial<Settings>) => void;
  onGoal: (goal: number) => void;
};

export function SettingsFields({ state, onSettings, onGoal }: Props) {
  return (
    <>
      <label className="setting">
        <span>1日の目標</span>
        <span className="stepper">
          <button type="button" onClick={() => onGoal(Math.max(5, state.goal - 5))}>
            −
          </button>
          <b>{state.goal}</b>
          <button type="button" onClick={() => onGoal(Math.min(80, state.goal + 5))}>
            ＋
          </button>
        </span>
      </label>
      <label className="setting">
        <span>
          効果音
          <small>正解・不正解のチャイム</small>
        </span>
        <button
          type="button"
          className={`switch${state.settings.sound ? " on" : ""}`}
          onClick={() => onSettings({ sound: !state.settings.sound })}
          aria-pressed={state.settings.sound}
          aria-label={state.settings.sound ? "効果音をミュート" : "効果音をオン"}
        />
      </label>
      <label className="setting">
        <span>触覚フィードバック</span>
        <button
          type="button"
          className={`switch${state.settings.haptics ? " on" : ""}`}
          onClick={() => onSettings({ haptics: !state.settings.haptics })}
          aria-pressed={state.settings.haptics}
        />
      </label>
      <label className="setting">
        <span>
          自動発音
          <small>カードと英和クイズの読み上げ</small>
        </span>
        <button
          type="button"
          className={`switch${state.settings.autoSpeak ? " on" : ""}`}
          onClick={() => {
            const next = !state.settings.autoSpeak;
            if (!next) stopSpeak();
            onSettings({ autoSpeak: next });
          }}
          aria-pressed={state.settings.autoSpeak}
          aria-label={state.settings.autoSpeak ? "自動発音をミュート" : "自動発音をオン"}
        />
      </label>
    </>
  );
}
