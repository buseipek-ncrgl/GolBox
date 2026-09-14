import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import('leaflet');
      if (cancelled || !host.current || mapRef.current) return;
      const start: [number, number] = [37.0662, 37.3781];
      const map = L.map(host.current, { zoomControl: true }).setView(start, 12);
      const tiles = adminMapTiles();
      L.tileLayer(tiles.url, {
        attribution: tiles.attribution,
        maxZoom: 19
      }).addTo(map);
      const icon = L.divIcon({
        className: '',
        html: '<span style="display:flex;width:28px;height:28px;border-radius:999px;background:#1D5F60;border:2px solid #fff"></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });
      const marker = L.marker(start, { draggable: true, icon }).addTo(map);
      circleRef.current = L.circle(start, { radius: 40, color: '#1d5f60', fillOpacity: 0.15 }).addTo(map);
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
      if (radiusMeters) circleRef.current.setRadius(Number(radiusMeters) || 40);
    }
  }, [latitude, longitude, radiusMeters]);

  return <div ref={host} style={{ height: 240, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #d7e3e0' }} />;
}
