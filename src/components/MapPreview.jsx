import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

const STYLES = {
  dark: {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        attribution: '&copy; CARTO, &copy; OpenStreetMap contributors',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'tiles', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 22 }],
  },
  satellite: {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '&copy; Esri',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'tiles', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 22 }],
  },
};

export default function MapPreview({ coords, zoom = 14, name }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [style, setStyle] = useState('dark');

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[style],
      center: [coords.lng, coords.lat],
      zoom,
      pitch: 50,
      bearing: -12,
      attributionControl: true,
      interactive: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    const el = document.createElement('div');
    el.className = 'marker-pin';

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    return () => { marker.remove(); map.remove(); mapRef.current = null; };
  }, [style]);

  useEffect(() => {
    if (!mapRef.current || !coords) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom, pitch: 50, bearing: -12,
      duration: 1000, essential: true,
    });
    markerRef.current?.setLngLat([coords.lng, coords.lat]);
  }, [coords.lat, coords.lng, zoom]);

  return (
    <div className="map-container" style={{ height: 340, width: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {name && (
        <div className="map-overlay">
          <div className="map-overlay-label">Location</div>
          <div className="map-overlay-name">{name}</div>
        </div>
      )}

      <button
        onClick={() => setStyle(s => s === 'dark' ? 'satellite' : 'dark')}
        className="map-style-toggle"
      >
        {style === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        )}
        {style === 'dark' ? 'Satellite' : 'Map'}
      </button>

      <div className="map-coords-badge">
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </div>
    </div>
  );
}
