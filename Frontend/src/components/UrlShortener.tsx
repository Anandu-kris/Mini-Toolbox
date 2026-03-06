// src/components/UrlShortener.tsx
import { useMemo, useState } from "react";
import { useShortenUrl } from "@/hooks/useUrlShortner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  QrCode,
  Download,
  Sparkles,
  Check,
  RotateCcw,
} from "lucide-react";
import LinksDrawer from "./LinksDrawer";
import { QRCodeCanvas } from "qrcode.react";

const ALIAS_RE = /^[a-z0-9-_]{3,30}$/;

const UrlShortener: React.FC = () => {
  const [longUrl, setLongUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"shorten" | "qr">("shorten");
  const [qrText, setQrText] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  const { mutateAsync: shortenUrl, isPending } = useShortenUrl();
  const qrValue = useMemo(() => qrText.trim(), [qrText]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setShortUrl("");
    setQrText("");
    if (!longUrl) return;

    const normalizedAlias = alias.trim().toLowerCase();
    if (normalizedAlias && !ALIAS_RE.test(normalizedAlias)) {
      setError("Alias must be 3–30 chars: a–z, 0–9, - or _");
      return;
    }

    try {
      const payload = normalizedAlias ? { longUrl, alias: normalizedAlias } : { longUrl };
      const res = await shortenUrl(payload);
      setShortUrl(res.shortUrl);
      setAlias("");
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      const status = anyErr.response?.status;
      const msg = status === 409
        ? "Alias already in use. Try a different one."
        : anyErr.response?.data?.detail || anyErr.message || "Failed to shorten";
      setError(msg);
    }
  }

  async function copyShort() {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyQr() {
    if (!qrValue) return;
    await navigator.clipboard.writeText(qrValue);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  }

  function downloadQrPng() {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-code.png";
    a.click();
  }

  function reset() {
    setLongUrl(""); setAlias(""); setShortUrl(""); setError("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .us-card {
          font-family: 'Sora', sans-serif;
          width: 100%;
          max-width: 500px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 32px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 32px 64px rgba(0,0,0,0.45),
            0 0 80px rgba(99,102,241,0.08);
          animation: usSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes usSlideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Tab bar */
        .us-tabs {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 28px;
        }

        .us-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 38px;
          border-radius: 10px;
          border: none;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: rgba(255,255,255,0.4);
        }

        .us-tab.active {
          background: rgba(99,102,241,0.2);
          color: #a78bfa;
          border: 1px solid rgba(99,102,241,0.3);
          box-shadow: 0 0 16px rgba(99,102,241,0.15);
        }

        .us-tab:hover:not(.active) {
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.05);
        }

        /* Field label */
        .us-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 8px;
          font-family: 'Sora', sans-serif;
        }

        /* Input override */
        .us-card input[type="url"],
        .us-card input[type="text"] {
          font-family: 'Sora', sans-serif !important;
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-size: 14px !important;
          height: 46px !important;
          padding: 0 14px !important;
          transition: all 0.2s !important;
          width: 100%;
        }

        .us-card input::placeholder {
          color: rgba(255,255,255,0.2) !important;
        }

        .us-card input:focus {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
          outline: none !important;
        }

        .us-field { display: flex; flex-direction: column; gap: 0; margin-bottom: 16px; }

        /* Hint text */
        .us-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          margin-top: 6px;
          font-family: 'Sora', sans-serif;
        }

        /* Error */
        .us-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.2);
          border-radius: 12px;
          padding: 10px 14px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: #ff6b6b;
          margin-bottom: 16px;
        }

        /* Primary button */
        .us-btn-primary {
          flex: 1;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          position: relative;
          overflow: hidden;
        }

        .us-btn-primary::before {
          content:'';
          position:absolute;
          inset:0;
          background: linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);
        }

        .us-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(99,102,241,0.5);
        }

        .us-btn-primary:disabled { opacity:0.55; cursor:not-allowed; }

        /* Ghost button */
        .us-btn-ghost {
          flex: 1;
          height: 46px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.6);
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s;
        }

        .us-btn-ghost:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.16);
          color: #fff;
        }

        /* Icon button */
        .us-btn-icon {
          height: 38px;
          padding: 0 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.65);
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .us-btn-icon:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.18);
        }

        .us-btn-icon.success {
          background: rgba(74,222,128,0.12);
          border-color: rgba(74,222,128,0.3);
          color: #4ade80;
        }

        /* Result box */
        .us-result {
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 16px;
          padding: 16px;
          margin-top: 20px;
          animation: usSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .us-result-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 10px;
          font-family: 'Sora', sans-serif;
        }

        .us-result-url {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          color: #a78bfa;
          font-weight: 500;
          word-break: break-all;
          margin-bottom: 12px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .us-result-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Divider */
        .us-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 24px 0;
        }

        /* QR container */
        .us-qr-box {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 160px;
        }

        .us-qr-canvas-wrap {
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          animation: usSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .us-qr-empty {
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.2);
          text-align: center;
        }

        .us-btn-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="us-card">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
              }}>
                <LinkIcon size={15} color="#fff"/>
              </div>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                URL Shortener
              </span>
            </div>
            <LinksDrawer />
          </div>
          <p style={{ fontFamily: "'Sora',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 40 }}>
            Shorten, brand & generate QR codes
          </p>
        </div>

        {/* Tabs */}
        <div className="us-tabs">
          <Button className={`us-tab ${tab === 'shorten' ? 'active' : ''}`} onClick={() => setTab('shorten')}>
            <Sparkles size={14}/> Shorten
          </Button>
          <Button className={`us-tab ${tab === 'qr' ? 'active' : ''}`} onClick={() => setTab('qr')}>
            <QrCode size={14}/> QR Code
          </Button>
        </div>

        {/* SHORTEN TAB */}
        {tab === 'shorten' && (
          <div>
            <form onSubmit={handleSubmit}>
              <div className="us-field">
                <label className="us-label">Long URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/your/very/long/link"
                  value={longUrl}
                  onChange={e => setLongUrl(e.target.value)}
                  required
                />
              </div>

              <div className="us-field">
                <label className="us-label">Custom alias <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span></label>
                <Input
                  type="text"
                  placeholder="e.g. my-link"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  pattern="^[a-z0-9-_]{3,30}$"
                  title="3–30 chars: a–z, 0–9, - or _"
                />
                <span className="us-hint">3–30 chars · letters, numbers, - or _</span>
              </div>

              {error && <div className="us-error">⚠ {error}</div>}

              <div className="us-btn-row" style={{ marginBottom: 0, marginTop: 8 }}>
                <button type="submit" className="us-btn-primary" disabled={isPending}>
                  {isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <><Sparkles size={14}/>Shorten</>}
                </button>
                <button type="button" className="us-btn-ghost" onClick={reset}>
                  <RotateCcw size={14}/> Reset
                </button>
              </div>
            </form>

            {shortUrl && (
              <div className="us-result">
                <div className="us-result-label">✦ Short URL ready</div>
                <div className="us-result-url">{shortUrl}</div>
                <div className="us-result-actions">
                  <button className={`us-btn-icon ${copied ? 'success' : ''}`} onClick={copyShort}>
                    {copied ? <Check size={13}/> : <Copy size={13}/>}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="us-btn-icon" onClick={() => window.open(shortUrl, '_blank')}>
                    <ExternalLink size={13}/> Open
                  </button>
                  <button className="us-btn-icon" onClick={() => { setQrText(shortUrl); setTab('qr'); }}>
                    <QrCode size={13}/> Make QR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR TAB */}
        {tab === 'qr' && (
          <div>
            <div className="us-field">
              <label className="us-label">URL for QR code</label>
              <Input
                type="url"
                placeholder="Paste a URL or use your short URL"
                value={qrText}
                onChange={e => setQrText(e.target.value)}
              />
              <span className="us-hint">Tip: shorten first for a cleaner, smaller QR code</span>
            </div>

            <div className="us-btn-row">
              <Button className={`us-btn-icon ${copiedQr ? 'success' : ''}`} disabled={!qrValue} onClick={copyQr} style={{ opacity: qrValue ? 1 : 0.4 }}>
                {copiedQr ? <Check size={13}/> : <Copy size={13}/>}
                {copiedQr ? 'Copied!' : 'Copy URL'}
              </Button>
              <Button className="us-btn-icon" disabled={!qrValue} onClick={downloadQrPng} style={{ opacity: qrValue ? 1 : 0.4 }}>
                <Download size={13}/> Download PNG
              </Button>
              <Button className="us-btn-icon" onClick={() => { setQrText(''); }}>
                <RotateCcw size={13}/> Reset
              </Button>
            </div>

            <div className="us-divider"/>

            <div className="us-qr-box">
              {qrValue ? (
                <div className="us-qr-canvas-wrap">
                  <QRCodeCanvas id="qr-canvas" value={qrValue} size={200}/>
                </div>
              ) : (
                <div className="us-qr-empty">
                  <QrCode size={36} style={{ margin: '0 auto 10px', opacity: 0.2 }}/>
                  <p>Enter a URL above to generate your QR code</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UrlShortener;