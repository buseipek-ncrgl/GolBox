import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { adminMapTiles } from '../../lib/mapTiles';

export function AdminMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onChange
}: {
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const circleRef = useRef<import('leaflet').Circle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const L = await import('leaflet');
        if (cancelled || !host.current || mapRef.current) return;
        const start: [number, number] = [37.0662, 37.3781];
        const map = L.map(host.current, { zoomControl: true }).setView(start, 12);
        const tiles = adminMapTiles();
        const layer = L.tileLayer(tiles.url, {
          attribution: tiles.attribution,
          maxZoom: 19
        });
        layer.on('tileerror', () => { if (!cancelled) setState('error'); });
        layer.on('load', () => { if (!cancelled) setState('ready'); });
        layer.addTo(map);
        const icon = L.divIcon({
          className: '',
          html: '<span style="display:flex;width:28px;height:28px;border-radius:999px;background:#1D5F60;border:2px solid #fff"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });
        const marker = L.marker(start, { draggable: true, icon }).addTo(map);
        circleRef.current = L.circle(start, { radius: 40, color: '#1d5f60', weight: 2, fillOpacity: 0.18 }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChangeRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        });
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          onChangeRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        });
        mapRef.current = map;
        markerRef.current = marker;
        window.setTimeout(() => map.invalidateSize(), 80);
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !markerRef.current || !mapRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 14));
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(Number(radiusMeters) || 40);
    }
  }, [latitude, longitude, radiusMeters]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={host}
        role="application"
        tabIndex={0}
        aria-label="Harita üzerinde konum seçin. Ok tuşları ile işaretçiyi kaydırabilirsiniz."
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.001 : 0.0002;
          const lat = Number(latitude);
          const lng = Number(longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          if (event.key === 'ArrowUp') { event.preventDefault(); onChange(Number((lat + step).toFixed(6)), lng); }
          if (event.key === 'ArrowDown') { event.preventDefault(); onChange(Number((lat - step).toFixed(6)), lng); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); onChange(lat, Number((lng - step).toFixed(6))); }
          if (event.key === 'ArrowRight') { event.preventDefault(); onChange(lat, Number((lng + step).toFixed(6))); }
        }}
        style={{ height: 240, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #d7e3e0', background: '#e8f2f2' }}
      />
      {state === 'loading' ? (
        <div className="admin-muted" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(232,242,242,0.85)', borderRadius: 16 }}>Harita yükleniyor…</div>
      ) : null}
      {state === 'error' ? (
        <div role="alert" style={{ marginTop: 8, fontSize: 13, color: '#9f1239' }}>
          Harita yüklenemedi. Koordinatları gelişmiş seçeneklerden girebilirsiniz.
        </div>
      ) : null}
    </div>
  );
}
