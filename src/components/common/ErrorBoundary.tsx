import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Bhu3D ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#070b13] text-slate-100 p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/95 border border-red-500/30 shadow-2xl backdrop-blur-md text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">
              {this.props.fallbackTitle || '3D Globe Component Issue'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {this.state.error?.message || this.props.fallbackMessage || 'The 3D WebGL renderer encountered an unexpected issue.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 mx-auto transition-all shadow-lg shadow-sky-500/20 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload 3D Scene</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
