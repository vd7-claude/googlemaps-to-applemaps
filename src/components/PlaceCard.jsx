import { useState, useEffect } from 'react';
import { fetchPlaceInfo } from '../utils/wikiPlaceInfo';

export default function PlaceCard({ name, coords }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setInfo(null);
    setImgError(false);

    fetchPlaceInfo(name, coords).then(result => {
      if (!cancelled) { setInfo(result); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [name, coords?.lat, coords?.lng]);

  if (loading) {
    return (
      <div className="place-card-skeleton">
        <div className="skeleton-image" />
        <div className="skeleton-text">
          <div className="skeleton-line" style={{ width: '55%' }} />
          <div className="skeleton-line" style={{ width: '85%' }} />
          <div className="skeleton-line" style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  if (!info) return null;

  const hasImage = info.thumbnail && !imgError;

  return (
    <div className="place-card">
      {hasImage && (
        <div className="place-card-image-wrap">
          <img src={info.thumbnail} alt={info.title || name} className="place-card-image" onError={() => setImgError(true)} loading="lazy" />
          <div className="place-card-image-gradient" />
        </div>
      )}
      <div className="place-card-body" style={hasImage ? {} : { paddingTop: 20 }}>
        <div className="place-card-header">
          <div className="place-card-pin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <div className="place-card-title">{name || info.title}</div>
            {info.title && info.title !== name && <div className="place-card-subtitle">{info.title}</div>}
          </div>
        </div>
        {info.description && <p className="place-card-desc">{info.description}</p>}
        {info.url && (
          <a href={info.url} target="_blank" rel="noopener noreferrer" className="place-card-wiki-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Wikipedia
          </a>
        )}
      </div>
    </div>
  );
}
