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
    layers: [{ id: 'carto-tiles', type: 'raster', source: 'carto', minzoom: 0, maxzoom: 22 }],
  },
  satellite: {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'esri-sat', type: 'raster', source: 'esri', minzoom: 0, maxzoom: 22 }],
  },
};

export default function MapPreview({ coords, zoom = 14, name }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState('dark');

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[mapStyle],
      center: [coords.lng, coords.lat],
      zoom,
      attributionControl: true,
      interactive: true,
      pitch: 45,
      bearing: -15,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    const el = document.createElement('div');
    el.className = 'marker-pin';

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current || !coords) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom,
      pitch: 45,
      bearing: -15,
      duration: 1000,
      essential: true,
    });
    markerRef.current?.setLngLat([coords.lng, coords.lat]);
  }, [coords.lat, coords.lng, zoom]);

  const toggleStyle = () => {
    setMapStyle(s => s === 'dark' ? 'satellite' : 'dark');
  };

  return (
    <div className="map-container" style={{ height: 340, width: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Location label */}
      {name && (
        <div className="map-overlay" style={{ zIndex: 2 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Location</div>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, color: 'rgba(255,255,255,0.95)' }}>{name}</div>
        </div>
      )}

      {/* Style toggle */}
      <button
        onClick={toggleStyle}
        className="map-style-toggle"
        title={mapStyle === 'dark' ? 'Switch to satellite' : 'Switch to map'}
      >
        {mapStyle === 'dark' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
          </svg>
        )}
        <span style={{ fontSize: 11 }}>{mapStyle === 'dark' ? 'Satellite' : 'Map'}</span>
      </button>

      {/* Coordinates */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(10, 12, 20, 0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: 6,
        padding: '3px 7px',
        fontSize: 10,
        fontFamily: "'SF Mono','Fira Code',monospace",
        color: 'rgba(255,255,255,0.5)',
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </div>
    </div>
  );
}
