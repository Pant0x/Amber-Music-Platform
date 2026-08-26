"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  label?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ""}]`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={cn("flex h-full w-full items-center justify-center p-8", this.props.label ? "" : "")}>
          <div className="text-center max-w-md">
            <AlertTriangle className="mx-auto h-16 w-16 text-amber-500/80" />
            <h2 className="mt-4 text-xl font-semibold text-text-primary">
              Something went wrong
            </h2>
            <p className="mt-2 text-text-secondary">
              {this.props.label
                ? `An error occurred in ${this.props.label}.`
                : "An unexpected error occurred."}
            </p>
            {this.state.error && (
              <details className="mt-4 text-left text-xs text-text-muted">
                <summary className="cursor-pointer select-none">Error details</summary>
                <pre className="mt-2 overflow-auto rounded bg-bg-tertiary p-4 text-text-secondary">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleHome}
                className="btn-secondary"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}