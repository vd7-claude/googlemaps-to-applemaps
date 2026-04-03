import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

// Dark matter tiles — high contrast against the parchment UI
const MAP_STYLE = {
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
};

export default function MapPreview({ coords, zoom = 14, name }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [coords.lng, coords.lat],
      zoom,
      attributionControl: true,
      interactive: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

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
  }, []);

  useEffect(() => {
    if (!mapRef.current || !coords) return;
    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom,
      duration: 800,
      essential: true,
    });
    markerRef.current?.setLngLat([coords.lng, coords.lat]);
  }, [coords.lat, coords.lng, zoom]);

  return (
    <div className="map-container" style={{ height: 300, width: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {name && (
        <div className="map-overlay" style={{ zIndex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Location</div>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, color: 'rgba(255,255,255,0.95)' }}>{name}</div>
        </div>
      )}
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
        zIndex: 1,
      }}>
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </div>
    </div>
  );
}
