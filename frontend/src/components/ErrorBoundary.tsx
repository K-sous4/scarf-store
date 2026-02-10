/**
 * ErrorBoundary
 * 
 * Error boundary component to catch and display errors
 * Provides fallback UI when errors occur
 */

'use client'

import React, { ReactNode, Component } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Algo deu errado
              </h1>
              <p className="text-gray-600 mb-4">
                Desculpe, ocorreu um erro inesperado. Tente recarregar a página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Recarregar página
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-3 bg-red-100 rounded text-sm text-red-800 break-words">
                <code>{this.state.error.message}</code>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
