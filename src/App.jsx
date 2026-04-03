import { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { parseGoogleMapsUrl } from './utils/googleMapsParser';
import { buildAppleMapsUrl, formatCoords } from './utils/appleMapsBuilder';
import MapPreview from './components/MapPreview';
import PlaceCard from './components/PlaceCard';

// ─── Constants ──────────────────────────────────────────────────────────────────

const GMAPS_LOGO = 'https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/web/google/google-maps.webp';
const AMAPS_LOGO = 'https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/webp/macos/apple-maps.webp';

const EXAMPLES = [
  { label: 'Place', url: 'https://www.google.com/maps/place/Thai+Peacock/@45.5227052,-122.6828203,17z/data=!3m2!4b1!5s0x54950a03c10c2235:0xd8d1bd2bdce2d95d!4m6!3m5!1s0x54950a03c3b0e46f:0x31e91c3ef4602fec!8m2!3d45.5227015!4d-122.6802454!16s%2Fg%2F1tg6vdq4' },
  { label: 'Coordinates', url: 'https://www.google.com/maps/@40.7580,-73.9855,15z' },
  { label: 'Directions', url: 'https://www.google.com/maps/dir/Times+Square,+New+York/Central+Park,+New+York' },
  { label: 'Short link', url: 'https://maps.app.goo.gl/53sJwghFNbwcN5qG9' },
];

const TYPES = { place: 'Place', search: 'Search', coords: 'Coords', directions: 'Directions', short: 'Short Link', query: 'Query' };

function haptic(p = [10]) { try { navigator.vibrate?.(p); } catch {} }

// ─── Tiny SVG icons ─────────────────────────────────────────────────────────────

const Arrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const Copy = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const Check = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Chevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

// ─── Hook ───────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 680);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 680px)');
    const h = e => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return m;
}

// ─── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  const r = useRef(null);

  const go = useCallback(async () => {
    haptic([5]);
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setOk(true);
    if (r.current) gsap.fromTo(r.current, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' });
    setTimeout(() => setOk(false), 2000);
  }, [text]);

  return (
    <button ref={r} className={`btn-ghost ${ok ? 'copied' : ''}`} onClick={go}>
      {ok ? <Check /> : <Copy />}
      {ok ? 'Copied' : 'Copy URL'}
    </button>
  );
}

// ─── Details ────────────────────────────────────────────────────────────────────

function Details({ parsed }) {
  if (!parsed.name && !parsed.coords && !parsed.directions?.from && !parsed.directions?.to) return null;
  return (
    <div className="details-card">
      {parsed.name && <div className="detail-row"><span className="detail-label">Name</span><span className="detail-value">{parsed.name}</span></div>}
      {parsed.coords && <div className="detail-row"><span className="detail-label">Coords</span><span className="detail-value mono">{formatCoords(parsed.coords)}</span></div>}
      {parsed.zoom && <div className="detail-row"><span className="detail-label">Zoom</span><span className="detail-value mono">{parsed.zoom}×</span></div>}
      {parsed.directions?.from && <div className="detail-row"><span className="detail-label">From</span><span className="detail-value">{parsed.directions.from}</span></div>}
      {parsed.directions?.to && <div className="detail-row"><span className="detail-label">To</span><span className="detail-value">{parsed.directions.to}</span></div>}
    </div>
  );
}

function Drawer({ parsed, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = () => { haptic([5]); setClosing(true); setTimeout(onClose, 250); };
  return (
    <>
      <div className="drawer-backdrop" onClick={close} />
      <div className={`drawer ${closing ? 'closing' : ''}`}>
        <div className="drawer-handle" />
        <Details parsed={parsed} />
        <button onClick={close} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 16 }}>Close</button>
      </div>
    </>
  );
}

// ─── Result ─────────────────────────────────────────────────────────────────────

function Result({ parsed, appleUrl }) {
  const mobile = useIsMobile();
  const [drawer, setDrawer] = useState(false);
  const ref = useRef(null);
  const hasInfo = parsed.name || parsed.coords || parsed.directions?.from;

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { y: 30, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power4.out' }
    );
    // Stagger the two sides
    const sides = ref.current.querySelectorAll('.result-left, .result-right');
    gsap.fromTo(sides,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 0.45, ease: 'power3.out', delay: 0.15 }
    );
  }, []);

  return (
    <>
      <div className="result-panel" ref={ref}>
        <div className="result-grid">
          <div className="result-left">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="tag tag-src"><img src={GMAPS_LOGO} width={14} height={14} alt="" style={{ borderRadius: 3 }} crossOrigin="anonymous" /> Google Maps</span>
              <span className="tag tag-type">{TYPES[parsed.type] || parsed.type}</span>
            </div>
            <div className="url-display">{parsed.originalUrl}</div>
            {hasInfo && (
              mobile
                ? <button className="btn-ghost" onClick={() => { haptic([5]); setDrawer(true); }} style={{ alignSelf: 'flex-start' }}>Details <Chevron /></button>
                : <Details parsed={parsed} />
            )}
          </div>

          <div className="result-arrow-col"><Arrow /></div>

          <div className="result-right">
            {parsed.type === 'short' ? (
              <div className="short-warning"><strong>Shortened URL</strong><br/><span className="dim">Open in Google Maps, tap Share → Copy link, then paste here.</span></div>
            ) : appleUrl ? (
              <>
                <span className="tag tag-dest"><img src={AMAPS_LOGO} width={14} height={14} alt="" style={{ borderRadius: 3 }} crossOrigin="anonymous" /> Apple Maps</span>
                <div className="url-display green">{appleUrl}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="btn-apple" onClick={() => haptic([15, 50, 10])}>
                    <img src={AMAPS_LOGO} width={18} height={18} alt="" style={{ borderRadius: 5 }} crossOrigin="anonymous" />
                    Open in Apple Maps
                  </a>
                  <CopyBtn text={appleUrl} />
                </div>
              </>
            ) : (
              <div className="error-bar" style={{ margin: 0, width: '100%' }}><span>⚠</span> Insufficient data.</div>
            )}
          </div>
        </div>
      </div>
      {drawer && <Drawer parsed={parsed} onClose={() => setDrawer(false)} />}
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const appRef = useRef(null);
  const previewRef = useRef(null);

  // Mount animation
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Logos
    tl.from('.hero-logo', {
      y: 40, opacity: 0, scale: 0.6, stagger: 0.12, duration: 0.7, ease: 'back.out(1.4)',
    })
    .from('.hero-arrow', {
      opacity: 0, x: -10, duration: 0.3,
    }, '-=0.4')
    // Title
    .from('.hero h1', {
      y: 30, opacity: 0, duration: 0.6,
    }, '-=0.3')
    // Subtitle
    .from('.hero-sub', {
      y: 20, opacity: 0, duration: 0.5,
    }, '-=0.35')
    // Input card
    .from('.input-card', {
      y: 24, opacity: 0, scale: 0.97, duration: 0.6,
    }, '-=0.3')
    // Pills
    .from('.pill', {
      opacity: 0, y: 8, stagger: 0.04, duration: 0.3,
    }, '-=0.3');
  }, []);

  // Preview section animate
  useEffect(() => {
    if (!previewRef.current || !result?.parsed?.coords) return;
    gsap.fromTo(previewRef.current,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power4.out', delay: 0.15 }
    );
  }, [result]);

  const convert = useCallback((urlOverride) => {
    const value = (urlOverride !== undefined ? urlOverride : input).trim();
    if (!value) return;
    setError(null);
    setResult(null);
    haptic([12]);

    const parsed = parseGoogleMapsUrl(value);
    if (parsed.error && parsed.type !== 'short') {
      haptic([30, 50, 30]);
      setError(parsed.error);
      return;
    }

    const appleUrl = buildAppleMapsUrl(parsed);
    haptic([5, 30, 8]);
    setResult({ parsed, appleUrl });

    // Button bounce
    gsap.fromTo('.btn-convert', { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.3)' });
  }, [input]);

  const handleSubmit = e => { e.preventDefault(); convert(); };

  const loadExample = url => {
    haptic([5]);
    setInput(url);
    setResult(null);
    setError(null);
    requestAnimationFrame(() => convert(url));
  };

  const handlePaste = e => {
    const p = e.clipboardData.getData('text').trim();
    if (p && (p.startsWith('http') || p.includes('google') || p.includes('goo.gl'))) {
      setInput(p);
      requestAnimationFrame(() => convert(p));
    }
  };

  return (
    <div className="app" ref={appRef}>
      <div className="hero">
        <div className="hero-logos">
          <img src={GMAPS_LOGO} className="hero-logo" alt="Google Maps" crossOrigin="anonymous" />
          <span className="hero-arrow"><Arrow /></span>
          <img src={AMAPS_LOGO} className="hero-logo" alt="Apple Maps" crossOrigin="anonymous" />
        </div>
        <h1>Maps <span className="accent">Converter</span></h1>
        <p className="hero-sub">Paste any Google Maps URL and get the Apple Maps equivalent.</p>
      </div>

      <div className="input-card">
        <form onSubmit={handleSubmit} className="input-row">
          <input
            ref={inputRef}
            className="url-input"
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
            onPaste={handlePaste}
            placeholder="Paste a Google Maps URL..."
            autoFocus spellCheck={false} autoComplete="off"
          />
          <button type="submit" className="btn-convert" disabled={!input.trim()}>Convert</button>
        </form>
        <div className="pills">
          <span className="pills-label">Try:</span>
          {EXAMPLES.map(e => <button key={e.label} className="pill" onClick={() => loadExample(e.url)}>{e.label}</button>)}
        </div>
      </div>

      {error && <div className="error-bar"><span>⚠</span> {error}</div>}

      {result && <Result parsed={result.parsed} appleUrl={result.appleUrl} />}

      {result?.parsed?.coords && (
        <div className="preview-section" ref={previewRef}>
          {result.parsed.name && (
            <>
              <PlaceCard name={result.parsed.name} coords={result.parsed.coords} />
              <div className="preview-divider" />
            </>
          )}
          <MapPreview
            coords={result.parsed.coords}
            zoom={Math.min(result.parsed.zoom || 14, 17)}
            name={result.parsed.name}
          />
        </div>
      )}

      <div className="footer">
        <span>All URL formats</span><span>·</span>
        <span>Runs in browser</span><span>·</span>
        <span>No data sent</span>
      </div>
    </div>
  );
}
