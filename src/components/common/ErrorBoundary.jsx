import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="h-20 w-20 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              We've encountered an unexpected error. Don't worry, your data is safe. 
              Please try refreshing the application.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200"
              >
                <RefreshCcw size={18} />
                Refresh Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50">
               <p className="text-[10px] text-slate-400 font-mono break-all uppercase">
                 Error: {this.state.error?.message || "Unknown Error"}
               </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
