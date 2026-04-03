import { useState, useCallback, useRef } from 'react';
import { parseGoogleMapsUrl } from './utils/googleMapsParser';
import { buildAppleMapsUrl, formatCoords } from './utils/appleMapsBuilder';
import MapPreview from './components/MapPreview';

const GMAPS = 'https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/webp/google/google-maps.webp';
const AMAPS = 'https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/webp/macos/apple-maps.webp';

const EXAMPLES = [
  { label: 'Place', url: 'https://www.google.com/maps/place/Thai+Peacock/@45.5227052,-122.6828203,17z/data=!3m2!4b1!5s0x54950a03c10c2235:0xd8d1bd2bdce2d95d!4m6!3m5!1s0x54950a03c3b0e46f:0x31e91c3ef4602fec!8m2!3d45.5227015!4d-122.6802454!16s%2Fg%2F1tg6vdq4' },
  { label: 'Coordinates', url: 'https://www.google.com/maps/@40.7580,-73.9855,15z' },
  { label: 'Directions', url: 'https://www.google.com/maps/dir/Times+Square,+New+York/Central+Park,+New+York' },
  { label: 'Short link', url: 'https://maps.app.goo.gl/53sJwghFNbwcN5qG9' },
];

function haptic(p = [10]) { try { navigator.vibrate?.(p); } catch {} }

// Lucide-style icons
const IcoArrowRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const IcoPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
// Lucide "send" / arrow-up-right for convert
const IcoSend = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
// Lucide "link" for copy
const IcoLink = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
// Lucide "check"
const IcoCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
// Lucide "external-link" / map
const IcoExternalLink = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  const ref = useRef(null);

  const go = useCallback(async (e) => {
    haptic([8, 30, 5]);
    if (ref.current) {
      const btn = ref.current;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
    }
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setOk(true);
    setTimeout(() => setOk(false), 1800);
  }, [text]);

  return (
    <button ref={ref} className={`btn-icon ${ok ? 'copied' : ''}`} onClick={go} title={ok ? 'Copied!' : 'Copy URL'}>
      {ok ? <IcoCheck /> : <IcoLink />}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-row">
          <div className="skel skel-circle" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skel skel-title" />
            <div className="skel skel-sub" />
          </div>
          <div className="skel skel-btn-open" />
          <div className="skel skel-btn-sm" />
        </div>
      </div>
      <div className="skel skel-map" />
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const convert = useCallback((urlOverride) => {
    const value = (urlOverride !== undefined ? urlOverride : input).trim();
    if (!value) return;
    document.activeElement?.blur();
    setError(null); setResult(null); setLoading(true);
    haptic([10]);
    setTimeout(() => {
      const parsed = parseGoogleMapsUrl(value);
      if (parsed.error && parsed.type !== 'short') { setError(parsed.error); setLoading(false); return; }
      const appleUrl = buildAppleMapsUrl(parsed);
      setResult({ parsed, appleUrl });
      setLoading(false);
      haptic([5, 20, 5]);
    }, 150);
  }, [input]);

  const handleSubmit = e => { e.preventDefault(); convert(); };
  const loadExample = url => { setInput(url); setResult(null); setError(null); requestAnimationFrame(() => convert(url)); };
  const handlePaste = e => { const p = e.clipboardData.getData('text').trim(); if (p && (p.startsWith('http') || p.includes('google') || p.includes('goo.gl'))) { setInput(p); requestAnimationFrame(() => convert(p)); } };

  const parsed = result?.parsed;
  const appleUrl = result?.appleUrl;
  const name = parsed?.name || (parsed?.directions ? `${parsed.directions.from || ''} → ${parsed.directions.to || ''}`.trim() : null);

  return (
    <div className="app">
      <div className="hero">
        <div className="hero-logos">
          <img src={GMAPS} className="hero-logo" alt="Google Maps" />
          <span className="hero-arrow"><IcoArrowRight /></span>
          <img src={AMAPS} className="hero-logo" alt="Apple Maps" />
        </div>
        <h1>Maps <span className="g">Converter</span></h1>
        <p>Paste a Google Maps link. Get an Apple Maps link.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {parsed?.type === 'short' && (
        <div className="short-notice">
          <strong>Short link detected</strong><br/>
          <span className="dim">Open in Google Maps, tap Share → Copy link, and paste the full URL.</span>
        </div>
      )}

      {loading && <Skeleton />}

      {appleUrl && (
        <div className="result-card">
          {/* Single row: pin + name/coords + buttons */}
          <div className="result-row">
            <div className="result-pin"><IcoPin /></div>
            <div className="result-info">
              <div className="result-name">{name || 'Location'}</div>
              {parsed.coords && <div className="result-coords">{formatCoords(parsed.coords)}</div>}
            </div>
            <div className="result-btns">
              <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="btn-open" onClick={() => haptic([10])} title="Open in Apple Maps">
                <IcoExternalLink />
                Open in Maps
              </a>
              <CopyBtn text={appleUrl} />
            </div>
          </div>
          {parsed.coords && (
            <MapPreview coords={parsed.coords} zoom={Math.min(parsed.zoom || 15, 17)} name={name} />
          )}
        </div>
      )}

      <div className="footer">
        <span>All URL formats</span>
        <span className="dot">·</span>
        <span>Client-side only</span>
      </div>

      <div className="input-dock">
        <div className="input-dock-inner">
          <form onSubmit={handleSubmit} className="input-row">
            <input className="url-input" type="text" value={input}
              onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
              onPaste={handlePaste} placeholder="Paste a Google Maps URL..."
              autoFocus spellCheck={false} autoComplete="off" />
            <button type="submit" className="btn-go" disabled={!input.trim()} title="Convert">
              <IcoSend />
            </button>
          </form>
          <div className="pills">
            <span className="pills-label">Try:</span>
            {EXAMPLES.map(e => <button key={e.label} className="pill" onClick={() => loadExample(e.url)}>{e.label}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}
