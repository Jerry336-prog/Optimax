import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <section className="container page empty-state">
        <h1>We hit a snag.</h1>
        <p>Please reload the page and try again.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload page
        </button>
      </section>
    ) : (
      this.props.children
    );
  }
}
