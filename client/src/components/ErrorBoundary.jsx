import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CLIENT RUNTIME ERROR]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: '#09090B',
            color: '#FAFAFA',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              padding: '36px',
              borderRadius: '20px',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.6, margin: '0 0 24px' }}>
              An unexpected error occurred while loading this section of the portal.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#09090B',
                  color: '#F87171',
                  textAlign: 'left',
                  overflowX: 'auto',
                  margin: '0 0 24px'
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              Reload Overview
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
