import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

const STYLES = {
  dark: {
    version: 8,
    sources: { carto: { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png','https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'], tileSize: 256, attribution: '&copy; CARTO', maxzoom: 19 } },
    layers: [{ id: 't', type: 'raster', source: 'carto' }],
  },
  sat: {
    version: 8,
    sources: { esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: '&copy; Esri', maxzoom: 19 } },
    layers: [{ id: 't', type: 'raster', source: 'esri' }],
  },
};

export default function MapPreview({ coords, zoom = 14, name }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [style, setStyle] = useState('dark');

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({ container: ref.current, style: STYLES[style], center: [coords.lng, coords.lat], zoom, pitch: 45, bearing: -10, attributionControl: true, interactive: true });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    const el = document.createElement('div'); el.className = 'marker-pin';
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([coords.lng, coords.lat]).addTo(map);
    mapRef.current = map; markerRef.current = marker;
    return () => { marker.remove(); map.remove(); };
  }, [style]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom, pitch: 45, bearing: -10, duration: 800, essential: true });
    markerRef.current?.setLngLat([coords.lng, coords.lat]);
  }, [coords.lat, coords.lng, zoom]);

  return (
    <div className="map-wrap">
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      {name && <div className="map-overlay"><div className="map-overlay-sub">Location</div><div className="map-overlay-title">{name}</div></div>}
      <button onClick={() => setStyle(s => s === 'dark' ? 'sat' : 'dark')} className="map-toggle">
        {style === 'dark' ? '🛰 Satellite' : '🗺 Map'}
      </button>
      <div className="map-coords">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
    </div>
  );
}
