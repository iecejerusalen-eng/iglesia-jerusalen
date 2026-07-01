import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouteError } from 'react-router-dom';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 mx-auto">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              
              <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
                Algo salió mal
              </h2>
              
              <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                Ha ocurrido un error inesperado en la aplicación. Por favor, intenta recargar la página o volver al inicio.
              </p>

              {this.state.error && (
                <div className="mb-6">
                  <details className="text-sm bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
                    <summary className="text-slate-700 dark:text-slate-300 cursor-pointer font-medium outline-none">
                      Detalles técnicos
                    </summary>
                    <pre className="mt-2 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="h-5 w-5" />
                  Recargar página
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium"
                >
                  <Home className="h-5 w-5" />
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
            Error al cargar esta sección
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300/80 mb-3 line-clamp-2">
            {error?.message || 'Ha ocurrido un error inesperado.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
