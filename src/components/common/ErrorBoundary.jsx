import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI instead of a blank page crash.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[380px] p-6 bg-card-bg rounded-xl border border-card-border shadow-xs flex flex-col items-center justify-center text-center space-y-4 my-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-text-main">
              {this.props.title || 'Something went wrong displaying this view'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please try again or return to the main dashboard.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>

            {this.props.onBack && (
              <button
                type="button"
                onClick={this.props.onBack}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-card-border text-text-main hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

