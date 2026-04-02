import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-surface-0">
          <div className="max-w-md rounded-2xl border border-border bg-surface-1 p-8 text-center shadow-2xl">
            <AlertTriangle
              size={40}
              className="mx-auto mb-4 text-warning"
              strokeWidth={1.5}
            />
            <h2 className="mb-2 text-lg font-semibold text-zinc-100">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-zinc-400">
              {this.props.fallbackMessage ??
                "An unexpected error occurred in the workspace. This is usually recoverable by refreshing."}
            </p>
            {this.state.error && (
              <pre className="mb-4 max-h-24 overflow-auto rounded-lg bg-surface-2 p-3 text-left font-mono text-2xs text-red-400">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleDismiss}
                className="rounded-md border border-border px-4 py-2 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-200"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent/80"
              >
                <RefreshCw size={14} />
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
