import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="app-recovery">
          <a href="/" aria-label="Codovate home">
            <img src="/logo-light.png" alt="Codovate" />
          </a>
          <span className="eyebrow">LET’S GET YOU BACK ON TRACK</span>
          <h1>This page needs a fresh start.</h1>
          <p>
            Something unexpected interrupted the screen. Reload to try again.
            Any unsaved form changes may need to be entered again.
          </p>
          <div className="career-controls">
            <button className="button" onClick={() => window.location.reload()}>
              Reload application
            </button>
            <a className="button secondary" href="/">
              Go to home
            </a>
          </div>
        </main>
      );
    return this.props.children;
  }
}
