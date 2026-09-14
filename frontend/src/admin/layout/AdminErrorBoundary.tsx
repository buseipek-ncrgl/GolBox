import React from 'react';
import { ErrorState } from '../components/ErrorState';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class AdminErrorBoundary extends React.Component<Props, State> {
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
