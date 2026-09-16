import React from 'react';
import { Button } from './Button';

const COPY: Record<string, { title: string; description: string }> = {
  '403': {
    title: 'Bu işlem için yetkiniz yok',
    description: 'Bu sayfayı yalnızca yetkili personel kullanabilir. Menüden kendi işinize dönün veya yöneticinizle konuşun.'
  },
  '404': {
    title: 'Kayıt bulunamadı',
    description: 'Aradığınız kayıt silinmiş veya henüz oluşturulmamış olabilir. Listeye dönüp tekrar deneyin.'
  },
  '409': {
    title: 'Bu işlem şu an yapılamaz',
    description: 'Kayıt başka bir işlemde kullanılıyor veya durum değişmiş. Sayfayı yenileyip tekrar deneyin.'
  },
  '500': {
    title: 'Bir şeyler ters gitti',
    description: 'Sunucu yanıt vermedi. Biraz sonra tekrar deneyin. Sorun sürerse yöneticiye bildirin.'
  }
};

export function ErrorState({
  title,
  description,
  retry,
  code
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  code?: '403' | '404' | '409' | '500' | string;
}) {
  const mapped = code ? COPY[code] : undefined;
  return (
    <div className="admin-error" role="alert">
      <h2>{title || mapped?.title || 'İşlem tamamlanamadı'}</h2>
      <p>{description || mapped?.description || 'Lütfen tekrar deneyin.'}</p>
      {retry ? <Button variant="secondary" onClick={retry}>Tekrar dene</Button> : null}
    </div>
  );
}

export function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorState description={message} retry={onRetry} />;
}
