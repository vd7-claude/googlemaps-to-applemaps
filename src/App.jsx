import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { parseGoogleMapsUrl } from './utils/googleMapsParser';
import { buildAppleMapsUrl, formatCoords } from './utils/appleMapsBuilder';
import MapPreview from './components/MapPreview';
import PlaceCard from './components/PlaceCard';

// ─── Constants ──────────────────────────────────────────────────────────────────

const GOOGLE_MAPS_LOGO = 'https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/web/google/google-maps.webp';
const APPLE_MAPS_LOGO = 'https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/webp/macos/apple-maps.webp';

const EXAMPLES = [
  { label: 'Place', url: 'https://www.google.com/maps/place/Thai+Peacock/@45.5227052,-122.6828203,17z/data=!3m2!4b1!5s0x54950a03c10c2235:0xd8d1bd2bdce2d95d!4m6!3m5!1s0x54950a03c3b0e46f:0x31e91c3ef4602fec!8m2!3d45.5227015!4d-122.6802454!16s%2Fg%2F1tg6vdq4' },
  { label: 'Coordinates', url: 'https://www.google.com/maps/@40.7580,-73.9855,15z' },
  { label: 'Directions', url: 'https://www.google.com/maps/dir/Times+Square,+New+York/Central+Park,+New+York' },
  { label: 'Short link', url: 'https://maps.app.goo.gl/53sJwghFNbwcN5qG9' },
];

const TYPE_LABELS = { place: 'Place', search: 'Search', coords: 'Coordinates', directions: 'Directions', short: 'Short Link', query: 'Query' };

function haptic(p = [10]) { try { navigator.vibrate?.(p); } catch {} }

// ─── Icons ──────────────────────────────────────────────────────────────────────

const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Hooks ──────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < 680);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 680px)');
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return m;
}

// ─── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const btnRef = useRef(null);

  const handleCopy = useCallback(async () => {
    haptic([5]);
    try { await navigator.clipboard.writeText(text); }
    catch { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(true);
    gsap.fromTo(btnRef.current, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button ref={btnRef} className={`btn-ghost ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied' : 'Copy URL'}
    </button>
  );
}

// ─── Details ────────────────────────────────────────────────────────────────────

function DetailsContent({ parsed }) {
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

function DetailsDrawer({ parsed, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = () => { haptic([5]); setClosing(true); setTimeout(onClose, 200); };
  return (
    <>
      <div className="drawer-backdrop" onClick={close} />
      <div className={`drawer ${closing ? 'closing' : ''}`}>
        <div className="drawer-handle" />
        <DetailsContent parsed={parsed} />
        <button onClick={close} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 14 }}>Close</button>
      </div>
    </>
  );
}

// ─── Result panel ───────────────────────────────────────────────────────────────

function ResultPanel({ parsed, appleUrl }) {
  const isMobile = useIsMobile();
  const [showDrawer, setShowDrawer] = useState(false);
  const panelRef = useRef(null);
  const hasDetails = parsed.name || parsed.coords || parsed.directions?.from || parsed.directions?.to;

  useLayoutEffect(() => {
    if (!panelRef.current) return;
    const el = panelRef.current;
    gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    // Stagger children
    const left = el.querySelector('.result-left');
    const arrow = el.querySelector('.result-arrow-col');
    const right = el.querySelector('.result-right');
    gsap.fromTo([left, arrow, right].filter(Boolean),
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out', delay: 0.15 }
    );
  }, [parsed]);

  return (
    <>
      <div className="result-panel" ref={panelRef} style={{ opacity: 0 }}>
        <div className="result-grid">
          {/* Left: source */}
          <div className="result-left">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="tag tag-src"><img src={GOOGLE_MAPS_LOGO} width={14} height={14} alt="" style={{ borderRadius: 3 }} /> Google Maps</span>
              <span className="tag tag-type">{TYPE_LABELS[parsed.type] || parsed.type}</span>
            </div>
            <div className="url-display">{parsed.originalUrl}</div>
            {hasDetails && (
              isMobile ? (
                <button className="btn-ghost" onClick={() => { haptic([5]); setShowDrawer(true); }} style={{ alignSelf: 'flex-start' }}>
                  Details <ChevronDown />
                </button>
              ) : (
                <DetailsContent parsed={parsed} />
              )
            )}
          </div>

          {/* Arrow */}
          <div className="result-arrow-col"><ArrowRight /></div>

          {/* Right: output */}
          <div className="result-right">
            {parsed.type === 'short' ? (
              <div className="short-warning">
                <strong>Shortened URL</strong><br/>
                <span className="dim">Open it in Google Maps, tap Share → Copy link, then paste the full URL here.</span>
              </div>
            ) : appleUrl ? (
              <>
                <span className="tag tag-dest"><img src={APPLE_MAPS_LOGO} width={14} height={14} alt="" style={{ borderRadius: 3 }} /> Apple Maps</span>
                <div className="url-display green">{appleUrl}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={appleUrl} target="_blank" rel="noopener noreferrer" className="btn-apple" onClick={() => haptic([15, 50, 10])}>
                    <img src={APPLE_MAPS_LOGO} width={18} height={18} alt="" style={{ borderRadius: 4 }} />
                    Open in Apple Maps
                  </a>
                  <CopyButton text={appleUrl} />
                </div>
              </>
            ) : (
              <div className="error-bar" style={{ margin: 0, width: '100%' }}>
                <span>⚠</span> Insufficient data to generate URL.
              </div>
            )}
          </div>
        </div>
      </div>

      {showDrawer && <DetailsDrawer parsed={parsed} onClose={() => setShowDrawer(false)} />}
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const headerRef = useRef(null);
  const inputCardRef = useRef(null);
  const previewRef = useRef(null);

  // ── Hero animation on mount ──
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.header-logos img',
        { opacity: 0, scale: 0.5, y: 16 },
        { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 0.6 }
      )
      .fromTo('.header-arrow',
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.4 },
        '-=0.3'
      )
      .fromTo('.header h1',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.2'
      )
      .fromTo('.header p',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4 },
        '-=0.25'
      )
      .fromTo('.input-card',
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5 },
        '-=0.2'
      );
    }, headerRef);

    return () => ctx.revert();
  }, []);

  // ── Preview animate in ──
  useEffect(() => {
    if (!previewRef.current || !result?.parsed?.coords) return;
    gsap.fromTo(previewRef.current,
      { opacity: 0, y: 32, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 }
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

    // Pulse the convert button
    const btn = document.querySelector('.btn-convert');
    if (btn) gsap.fromTo(btn, { scale: 0.93 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
  }, [input]);

  const handleSubmit = (e) => { e.preventDefault(); convert(); };

  const loadExample = (url) => {
    haptic([5]);
    setInput(url);
    setResult(null);
    setError(null);
    requestAnimationFrame(() => convert(url));
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted && (pasted.startsWith('http') || pasted.includes('google') || pasted.includes('goo.gl'))) {
      setInput(pasted);
      requestAnimationFrame(() => convert(pasted));
    }
  };

  return (
    <div className="app" ref={headerRef}>
      {/* Header */}
      <div className="header">
        <div className="header-logos">
          <img src={GOOGLE_MAPS_LOGO} width={44} height={44} alt="Google Maps" />
          <span className="header-arrow"><ArrowRight /></span>
          <img src={APPLE_MAPS_LOGO} width={44} height={44} alt="Apple Maps" />
        </div>
        <h1>
          Maps <span className="green">Converter</span>
        </h1>
        <p>Paste any Google Maps URL and get the Apple Maps equivalent.</p>
      </div>

      {/* Input */}
      <div className="input-card" ref={inputCardRef}>
        <form onSubmit={handleSubmit} className="input-row">
          <input
            ref={inputRef}
            className="url-input"
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
            onPaste={handlePaste}
            placeholder="Paste a Google Maps URL..."
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className="btn-convert" disabled={!input.trim()}>
            Convert
          </button>
        </form>

        <div className="pills">
          <span className="pills-label">Try:</span>
          {EXAMPLES.map(ex => (
            <button key={ex.label} className="pill" onClick={() => loadExample(ex.url)}>{ex.label}</button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-bar"><span>⚠</span> {error}</div>}

      {/* Results */}
      {result && <ResultPanel parsed={result.parsed} appleUrl={result.appleUrl} />}

      {/* Preview: place card + map */}
      {result?.parsed?.coords && (
        <div className="preview-section" ref={previewRef} style={{ opacity: 0 }}>
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

      {/* Footer */}
      <div className="footer">
        <span>All URL formats</span>
        <span>·</span>
        <span>Runs in browser</span>
        <span>·</span>
        <span>No data sent</span>
      </div>
    </div>
  );
}
