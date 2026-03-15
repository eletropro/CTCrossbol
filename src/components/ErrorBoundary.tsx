import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            if (parsed.error.includes('Missing or insufficient permissions')) {
              errorMessage = 'Você não tem permissão para acessar estes dados. Verifique seu login.';
            } else if (parsed.error.includes('The query requires an index')) {
              errorMessage = 'O sistema está sendo atualizado (índice necessário). Tente novamente em alguns minutos.';
            } else {
              errorMessage = `Erro no banco de dados: ${parsed.error}`;
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
          <div className="bg-[#121214] rounded-[2.5rem] p-10 border border-white/5 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Ops! Algo deu errado</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-zinc-800 text-white font-bold py-4 rounded-2xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-3"
            >
              <RefreshCw size={20} />
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
