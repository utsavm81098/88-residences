import { Component } from "react";
import { logger } from "@/utils/logger";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("UI Crash", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#050505] text-white p-6 text-center">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-white/60 mb-8 max-w-md">
              An unexpected error occurred in the 3D viewer. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
