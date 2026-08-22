import type { AppState, Settings } from "../types";

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
        <span>効果音</span>
        <button
          type="button"
          className={`switch${state.settings.sound ? " on" : ""}`}
          onClick={() => onSettings({ sound: !state.settings.sound })}
          aria-pressed={state.settings.sound}
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
        <span>カードを開いたら発音</span>
        <button
          type="button"
          className={`switch${state.settings.autoSpeak ? " on" : ""}`}
          onClick={() => onSettings({ autoSpeak: !state.settings.autoSpeak })}
          aria-pressed={state.settings.autoSpeak}
        />
      </label>
    </>
  );
}
