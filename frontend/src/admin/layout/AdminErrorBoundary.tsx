import React from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

class ErrorBoundaryInner extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          code="500"
          title="Bu ekran yüklenemedi"
          description="Menüden başka bir sayfaya geçebilir veya tekrar deneyebilirsiniz. Diğer yönetim ekranları çalışmaya devam eder."
          retry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function AdminErrorBoundary({ children }: Props) {
  const location = useLocation();
  return <ErrorBoundaryInner key={location.pathname}>{children}</ErrorBoundaryInner>;
}
