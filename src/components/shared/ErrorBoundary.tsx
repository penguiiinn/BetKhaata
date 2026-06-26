import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in BetKhaata:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear localStorage values as a last resort option or just reload
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark text-white font-sans flex items-center justify-center p-4">
          <div className="bg-surface card-border rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-loss/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-loss" />
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-base font-bold">Something went wrong</h1>
              <p className="text-xs text-muted leading-relaxed">
                An unexpected rendering error occurred. You can attempt to reload the application.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-dark/60 rounded-xl p-3 text-[10px] text-left font-mono overflow-auto max-h-32 text-loss border border-loss/10">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gold text-dark font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-gold-dim transition-colors tap-effect"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.children;
  }
}
