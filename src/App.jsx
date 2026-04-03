import { useState, useCallback, useRef } from 'react';
import { parseGoogleMapsUrl } from './utils/googleMapsParser';
import { buildAppleMapsUrl, formatCoords } from './utils/appleMapsBuilder';
import MapPreview from './components/MapPreview';

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

function IconApple() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.43c1.38.07 2.33.74 3.12.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.57 3.97zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
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

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function IconLocation() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

// ─── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
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
      className={`btn-copy ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  place: 'Place',
  search: 'Search',
  coords: 'Coordinates',
  directions: 'Directions',
  short: 'Short Link',
  query: 'Query',
};

// ─── Result Panel ───────────────────────────────────────────────────────────────

function ResultPanel({ parsed, appleUrl }) {
  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Short URL warning */}
      {parsed.type === 'short' && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 13,
          color: 'rgba(253,230,138,0.9)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Shortened URL detected</div>
            <div style={{ color: 'rgba(253,230,138,0.65)' }}>
              Short links (maps.app.goo.gl) can't be resolved client-side. Open it in Google Maps,
              tap <strong>Share → Copy link</strong>, and paste the full URL here.
            </div>
          </div>
        </div>
      )}

      {/* Input URL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tag tag-google"><IconGoogle /> Google Maps</span>
          {parsed.type && <span className="tag tag-type">{TYPE_LABELS[parsed.type] || parsed.type}</span>}
        </div>
        <div className="url-box" style={{ padding: '10px 12px' }}>
          {parsed.originalUrl}
        </div>
      </div>

      {/* Extracted metadata */}
      {(parsed.name || parsed.coords || (parsed.directions?.from || parsed.directions?.to)) && (
        <div className="glass" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            Extracted
          </div>
          {parsed.name && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="info-label" style={{ paddingTop: 2, minWidth: 56 }}>Name</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{parsed.name}</span>
            </div>
          )}
          {parsed.coords && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="info-label" style={{ paddingTop: 2, minWidth: 56 }}>Coords</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'SF Mono','Fira Code',monospace" }}>
                {formatCoords(parsed.coords)}
              </span>
            </div>
          )}
          {parsed.zoom && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="info-label" style={{ paddingTop: 2, minWidth: 56 }}>Zoom</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'SF Mono','Fira Code',monospace" }}>
                {parsed.zoom}×
              </span>
            </div>
          )}
          {parsed.directions?.from && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="info-label" style={{ paddingTop: 2, minWidth: 56 }}>From</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{parsed.directions.from}</span>
            </div>
          )}
          {parsed.directions?.to && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="info-label" style={{ paddingTop: 2, minWidth: 56 }}>To</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{parsed.directions.to}</span>
            </div>
          )}
        </div>
      )}

      {/* Arrow divider */}
      <div className="separator">
        <IconArrow /><span>converted</span><IconArrow />
      </div>

      {/* Apple Maps output */}
      {appleUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tag tag-apple"><IconApple /> Apple Maps</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <CopyButton text={appleUrl} />
              <a
                href={appleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <IconExternal /> Open
              </a>
            </div>
          </div>
          <div className="url-box success" style={{ padding: '10px 12px' }}>
            {appleUrl}
          </div>
        </div>
      ) : (
        !parsed.type === 'short' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px',
            fontSize: 13, color: 'rgba(252,165,165,0.9)',
          }}>
            Could not generate Apple Maps URL — insufficient location data.
          </div>
        )
      )}
    </div>
  );
}

// ─── Examples ───────────────────────────────────────────────────────────────────

const EXAMPLES = [
  {
    label: 'Place + coords',
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

    const parsed = parseGoogleMapsUrl(value);

    if (parsed.error && parsed.type !== 'short') {
      setError(parsed.error);
      return;
    }

    const appleUrl = buildAppleMapsUrl(parsed);
    setResult({ parsed, appleUrl });
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    convert();
  };

  const loadExample = (url) => {
    setInput(url);
    setResult(null);
    setError(null);
    // Small delay so state has updated
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
      padding: '48px 20px 64px',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 100,
          fontSize: 11, color: 'var(--text-muted)',
          marginBottom: 20,
          letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase',
        }}>
          <IconLocation /> Maps Converter
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 5vw, 46px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 14,
        }}>
          Google → Apple Maps
        </h1>

        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          maxWidth: 420,
          margin: '0 auto',
        }}>
          Paste any Google Maps URL and instantly get the Apple Maps equivalent — places, directions, coordinates, and more.
        </p>
      </div>

      {/* Main card */}
      <div className="glass-strong" style={{
        width: '100%', maxWidth: 640,
        padding: '26px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>

        {/* Input + button */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            className="glass-input"
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
            onPaste={handlePaste}
            placeholder="https://www.google.com/maps/place/..."
            style={{ padding: '11px 14px', flex: 1 }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim()}
            style={{ padding: '11px 20px', flexShrink: 0 }}
          >
            Convert
          </button>
        </form>

        {/* Example pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Try:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex.url)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 6,
                padding: '3px 9px',
                fontSize: 11, fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="fade-in" style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: 'rgba(252,165,165,0.9)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <ResultPanel parsed={result.parsed} appleUrl={result.appleUrl} />
          </>
        )}
      </div>

      {/* Map preview */}
      {result?.parsed?.coords && (
        <div className="fade-in" style={{ width: '100%', maxWidth: 640, marginTop: 14 }}>
          <div className="glass" style={{ padding: 5, overflow: 'hidden' }}>
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
        marginTop: 48,
        fontSize: 12,
        color: 'var(--text-muted)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 16px',
        justifyContent: 'center',
        lineHeight: 1.6,
      }}>
        <span>Handles all Google Maps URL formats</span>
        <span style={{ opacity: 0.3 }}>·</span>
        <span>Runs entirely in your browser</span>
        <span style={{ opacity: 0.3 }}>·</span>
        <span>No data sent to servers</span>
      </div>
    </div>
  );
}
