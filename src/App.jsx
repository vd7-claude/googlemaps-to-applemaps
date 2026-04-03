import { useState, useCallback, useRef, useEffect } from 'react';
import { parseGoogleMapsUrl } from './utils/googleMapsParser';
import { buildAppleMapsUrl, formatCoords } from './utils/appleMapsBuilder';
import MapPreview from './components/MapPreview';

// ─── Haptics helper ─────────────────────────────────────────────────────────────

function haptic(pattern = [10]) {
  try { navigator.vibrate?.(pattern); } catch {}
}

// ─── Icons ──────────────────────────────────────────────────────────────────────

function IconGoogle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function IconAppleMaps() {
  // Apple Maps app icon representation
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#63DA38"/>
      <rect width="24" height="12" y="12" rx="0" fill="#45B649" />
      <rect width="24" height="24" rx="5.5" fill="url(#amg)" />
      <defs>
        <linearGradient id="amg" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#63DA38"/>
          <stop offset="0.5" stopColor="#3DB83D"/>
          <stop offset="1" stopColor="#1B9E46"/>
        </linearGradient>
      </defs>
      {/* Road */}
      <path d="M3 18 L10 6 L14 14 L21 6" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Pin */}
      <circle cx="17" cy="7.5" r="3" fill="#EA4335" stroke="white" strokeWidth="1.5"/>
      <circle cx="17" cy="7" r="1" fill="white"/>
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );
}

function IconLocation() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ─── Responsive hook ────────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 700);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

// ─── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    haptic([5]);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      className={`btn-secondary ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'Copied' : 'Copy URL'}
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  place: 'Place', search: 'Search', coords: 'Coordinates',
  directions: 'Directions', short: 'Short Link', query: 'Query',
};

// ─── Details drawer (mobile) or inline (desktop) ─────────────────────────────────

function DetailsContent({ parsed }) {
  if (!parsed.name && !parsed.coords && !parsed.directions?.from && !parsed.directions?.to) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="info-label" style={{ marginBottom: 2 }}>Extracted Details</div>
      {parsed.name && (
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="info-label" style={{ paddingTop: 2, minWidth: 52 }}>Name</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{parsed.name}</span>
        </div>
      )}
      {parsed.coords && (
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="info-label" style={{ paddingTop: 2, minWidth: 52 }}>Coords</span>
          <span style={{ fontSize: 12, color: 'var(--ink-light)', fontFamily: "'SF Mono','Fira Code',monospace" }}>
            {formatCoords(parsed.coords)}
          </span>
        </div>
      )}
      {parsed.zoom && (
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="info-label" style={{ paddingTop: 2, minWidth: 52 }}>Zoom</span>
          <span style={{ fontSize: 12, color: 'var(--ink-light)', fontFamily: "'SF Mono','Fira Code',monospace" }}>
            {parsed.zoom}x
          </span>
        </div>
      )}
      {parsed.directions?.from && (
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="info-label" style={{ paddingTop: 2, minWidth: 52 }}>From</span>
          <span style={{ fontSize: 13 }}>{parsed.directions.from}</span>
        </div>
      )}
      {parsed.directions?.to && (
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="info-label" style={{ paddingTop: 2, minWidth: 52 }}>To</span>
          <span style={{ fontSize: 13 }}>{parsed.directions.to}</span>
        </div>
      )}
    </div>
  );
}

function DetailsDrawer({ parsed, onClose }) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    haptic([5]);
    setClosing(true);
    setTimeout(onClose, 250);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={close} />
      <div className={`drawer ${closing ? 'closing' : ''}`}>
        <div className="drawer-handle" />
        <DetailsContent parsed={parsed} />
        <div style={{ marginTop: 16, paddingBottom: 8 }}>
          <button onClick={close} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Translation result layout ──────────────────────────────────────────────────

function TranslationResult({ parsed, appleUrl }) {
  const isMobile = useIsMobile();
  const [showDrawer, setShowDrawer] = useState(false);
  const hasDetails = parsed.name || parsed.coords || parsed.directions?.from || parsed.directions?.to;

  return (
    <div className="fade-in">
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="translation-layout">
          {/* LEFT: Google Maps source */}
          <div className="translation-side">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="tag tag-google"><IconGoogle /> Google</span>
              <span className="tag tag-type">{TYPE_LABELS[parsed.type] || parsed.type}</span>
            </div>
            <div className="url-box">
              {parsed.originalUrl}
            </div>
            {/* Details — inline on desktop, drawer trigger on mobile */}
            {hasDetails && (
              isMobile ? (
                <button
                  className="btn-secondary"
                  onClick={() => { haptic([5]); setShowDrawer(true); }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Details <IconChevronDown />
                </button>
              ) : (
                <div className="card" style={{ padding: '12px 14px', marginTop: 4 }}>
                  <DetailsContent parsed={parsed} />
                </div>
              )
            )}
          </div>

          {/* CENTER: Arrow */}
          <div className="translation-arrow">
            <IconArrowRight />
          </div>

          {/* RIGHT: Apple Maps output */}
          <div className="translation-side">
            {parsed.type === 'short' ? (
              <div style={{
                background: 'rgba(199, 90, 58, 0.06)',
                border: '1px solid var(--rust-border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                color: 'var(--rust)',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Short URL</div>
                <div style={{ color: 'var(--ink-light)', fontSize: 12 }}>
                  Open the link in Google Maps, tap <strong>Share → Copy link</strong>, then paste the full URL.
                </div>
              </div>
            ) : appleUrl ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tag tag-apple"><IconAppleMaps /> Apple Maps</span>
                </div>
                <div className="url-box success">
                  {appleUrl}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={appleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-apple"
                    onClick={() => haptic([15, 50, 10])}
                  >
                    <IconAppleMaps />
                    Open in Apple Maps
                  </a>
                  <CopyButton text={appleUrl} />
                </div>
              </>
            ) : (
              <div style={{
                background: 'rgba(199, 90, 58, 0.06)',
                border: '1px solid var(--rust-border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                color: 'var(--rust)',
              }}>
                Could not generate Apple Maps URL — insufficient data.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {showDrawer && (
        <DetailsDrawer parsed={parsed} onClose={() => setShowDrawer(false)} />
      )}
    </div>
  );
}

// ─── Examples ───────────────────────────────────────────────────────────────────

const EXAMPLES = [
  {
    label: 'Place',
    url: 'https://www.google.com/maps/place/Thai+Peacock/@45.5227052,-122.6828203,17z/data=!3m2!4b1!5s0x54950a03c10c2235:0xd8d1bd2bdce2d95d!4m6!3m5!1s0x54950a03c3b0e46f:0x31e91c3ef4602fec!8m2!3d45.5227015!4d-122.6802454!16s%2Fg%2F1tg6vdq4',
  },
  {
    label: 'Coordinates',
    url: 'https://www.google.com/maps/@40.7580,-73.9855,15z',
  },
  {
    label: 'Directions',
    url: 'https://www.google.com/maps/dir/Times+Square,+New+York/Central+Park,+New+York',
  },
  {
    label: 'Short link',
    url: 'https://maps.app.goo.gl/53sJwghFNbwcN5qG9',
  },
];

// ─── App ─────────────────────────────────────────────────────────────────────────

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

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
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    convert();
  };

  const loadExample = (url) => {
    haptic([5]);
    setInput(url);
    setResult(null);
    setError(null);
    requestAnimationFrame(() => convert(url));
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted && (pasted.startsWith('http') || pasted.includes('google.com/maps') || pasted.includes('maps.app.goo.gl'))) {
      setInput(pasted);
      requestAnimationFrame(() => convert(pasted));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'calc(24px + var(--safe-top, 0px)) 16px calc(32px + var(--safe-bottom, 0px))',
      maxWidth: 960,
      margin: '0 auto',
      width: '100%',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid var(--border-light)',
          borderRadius: 100,
          fontSize: 10, color: 'var(--ink-muted)',
          marginBottom: 14,
          letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase',
        }}>
          <IconLocation /> Maps Converter
        </div>

        <h1 className="heading-serif" style={{
          fontSize: 'clamp(28px, 6vw, 44px)',
          lineHeight: 1.15,
          marginBottom: 10,
        }}>
          Google → Apple Maps
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--ink-light)',
          lineHeight: 1.6,
          maxWidth: 380,
          margin: '0 auto',
        }}>
          Paste any Google Maps URL and get the Apple Maps equivalent.
        </p>
      </div>

      {/* Input area */}
      <div className="card-strong" style={{
        width: '100%',
        padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        marginBottom: 16,
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            className="parchment-input"
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
            onPaste={handlePaste}
            placeholder="Paste a Google Maps URL..."
            style={{ padding: '11px 14px', flex: 1 }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-convert"
            disabled={!input.trim()}
            style={{ padding: '11px 20px', flexShrink: 0 }}
          >
            Convert
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 500 }}>Try:</span>
          {EXAMPLES.map(ex => (
            <button key={ex.label} className="pill" onClick={() => loadExample(ex.url)}>
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="fade-in" style={{
          width: '100%',
          background: 'var(--rust-bg)',
          border: '1px solid var(--rust-border)',
          borderRadius: 12, padding: '10px 14px',
          fontSize: 13, color: 'var(--rust)',
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 16,
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span> {error}
        </div>
      )}

      {/* Translation result — left-to-right */}
      {result && (
        <div style={{ width: '100%', marginBottom: 16 }}>
          <TranslationResult parsed={result.parsed} appleUrl={result.appleUrl} />
        </div>
      )}

      {/* Map at bottom — dark inset */}
      {result?.parsed?.coords && (
        <div className="fade-in" style={{ width: '100%' }}>
          <div className="map-wrapper">
            <MapPreview
              coords={result.parsed.coords}
              zoom={Math.min(result.parsed.zoom || 14, 17)}
              name={result.parsed.name}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 32,
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--ink-faint)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px 14px',
        justifyContent: 'center',
        lineHeight: 1.6,
      }}>
        <span>All URL formats</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>Runs in browser</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>No data sent</span>
      </div>
    </div>
  );
}
