import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <p className="tiny">ERROR</p>
          <h1>表示できませんでした</h1>
          <p className="muted">画面を再読み込みしてください。</p>
          <button className="cta" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
