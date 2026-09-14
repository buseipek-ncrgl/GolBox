import React from 'react';
import { PlacesPanel } from '../../pages/PlacesPanel';
import { HomeContentPanel } from '../../pages/HomeContentPanel';
import { SettingsPanel } from '../../components/admin/SettingsPanel';
import { useAdminFeedback } from './AdminFeedback';

export function PlacesPage() {
  const { setError, setSuccess } = useAdminFeedback();
  return <PlacesPanel onError={setError} onSuccess={setSuccess} />;
}

export function HomeContentPage() {
  const { setError, setSuccess } = useAdminFeedback();
  return <HomeContentPanel onError={setError} onSuccess={setSuccess} />;
}

export function SettingsPage() {
  const { setError, setSuccess } = useAdminFeedback();
  return <SettingsPanel onError={setError} onSuccess={setSuccess} />;
}
