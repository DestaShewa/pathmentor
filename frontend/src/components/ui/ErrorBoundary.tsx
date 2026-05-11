import React, { Component, ErrorInfo, ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { GlassButton } from "./GlassButton";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <GlassCard className="p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Something went wrong</h2>
            <p className="text-muted-foreground text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <GlassButton 
                variant="primary" 
                onClick={this.handleRetry}
                className="w-full"
              >
                <RefreshCw size={16} /> Try Again
              </GlassButton>
              <GlassButton 
                variant="secondary" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </GlassButton>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-400 mt-2 p-2 bg-black/20 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;