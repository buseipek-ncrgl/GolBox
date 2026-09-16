import React from 'react';
import { Button } from './Button';
import { httpErrorCode } from '../../services/api';

const COPY: Record<string, { title: string; description: string }> = {
  '403': {
    title: 'Bu işlem için yetkiniz bulunmuyor.',
    description: 'Bu sayfayı yalnızca yetkili personel kullanabilir. Menüden kendi işinize dönün veya yöneticinizle konuşun.'
  },
  '404': {
    title: 'Kayıt bulunamadı.',
    description: 'Aradığınız kayıt silinmiş veya henüz oluşturulmamış olabilir. Listeye dönüp tekrar deneyin.'
  },
  '409': {
    title: 'Bu işlem başka bir değişiklikle çakıştı. Verileri yenileyip tekrar deneyin.',
    description: 'Kayıt başka bir işlemde güncellenmiş olabilir. Sayfayı yenileyip tekrar deneyin.'
  },
  '500': {
    title: 'İşlem sırasında beklenmeyen bir hata oluştu.',
    description: 'Sunucu yanıt vermedi. Biraz sonra tekrar deneyin. Sorun sürerse yöneticiye bildirin.'
  }
};

export function ErrorState({
  title,
  description,
  retry,
  code,
  error
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  code?: '403' | '404' | '409' | '500' | string;
  error?: unknown;
}) {
  const mappedCode = code || httpErrorCode(error);
  const mapped = mappedCode ? COPY[mappedCode] : undefined;
  return (
    <div className="admin-error" role="alert" data-testid="admin-error" data-error-code={mappedCode || undefined}>
      <h2>{title || mapped?.title || 'İşlem tamamlanamadı'}</h2>
      <p>{mapped?.description || description || 'Lütfen tekrar deneyin.'}</p>
      {retry ? <Button variant="secondary" onClick={retry}>Tekrar dene</Button> : null}
    </div>
  );
}

export function ListError({ message, error, onRetry }: { message?: string; error?: unknown; onRetry: () => void }) {
  return <ErrorState description={message} error={error} retry={onRetry} />;
}
