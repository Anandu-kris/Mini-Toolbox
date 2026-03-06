// src/pages/UrlShortenerPage.tsx
import UrlShortener from "@/components/UrlShortener";
import { Link as LinkIcon, Zap, QrCode, Shield } from "lucide-react";

export default function UrlShortenerPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

        .usp-page {
          font-family: 'Sora', sans-serif;
          display: flex;
          min-height: calc(100dvh - 120px);
          align-items: center;
          padding: 18px 40px;
          position: relative;
          overflow: hidden;
        }

        .usp-grid {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 64px;
        }

        @media (max-width: 900px) {
          .usp-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .usp-page { padding: 32px 20px; }
        }

        /* Left — hero copy */
        .usp-hero {
          animation: uspFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes uspFade {
          from { opacity:0; transform:translateX(-24px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .usp-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 99px;
          padding: 5px 14px 5px 8px;
          margin-bottom: 24px;
        }

        .usp-badge-icon {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          display: flex; align-items: center; justify-content: center;
        }

        .usp-badge-text {
          font-size: 12px;
          font-weight: 500;
          color: #a78bfa;
          letter-spacing: 0.04em;
        }

        .usp-headline {
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800;
          color: #fff;
          line-height: 1.08;
          letter-spacing: -0.035em;
          margin-bottom: 18px;
        }

        .usp-headline-accent {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .usp-subtext {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          font-weight: 300;
          max-width: 420px;
          margin-bottom: 36px;
        }

        /* Feature pills */
        .usp-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .usp-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          animation: uspFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        .usp-feature:nth-child(1) { animation-delay: 0.1s; }
        .usp-feature:nth-child(2) { animation-delay: 0.2s; }
        .usp-feature:nth-child(3) { animation-delay: 0.3s; }

        .usp-feature-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .usp-feature-text strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-bottom: 2px;
        }

        .usp-feature-text span {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        /* Right panel */
        .usp-right {
          display: flex;
          justify-content: center;
          animation: uspFadeRight 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }

        @keyframes uspFadeRight {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      <div className="usp-page">

        <div className="usp-grid">
          {/* Left */}
          <div className="usp-hero">
            <div className="usp-badge">
              <div className="usp-badge-icon"><LinkIcon size={11} color="#fff"/></div>
              <span className="usp-badge-text">URL Shortener</span>
            </div>

            <h1 className="usp-headline">
              Short links.<br/>
              <span className="usp-headline-accent">Big impact.</span>
            </h1>

            <p className="usp-subtext">
              Transform long, messy URLs into clean branded links. 
              Generate QR codes, track clicks, and take control of every link you share.
            </p>

            <div className="usp-features">
              <div className="usp-feature">
                <div className="usp-feature-icon" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Zap size={16} color="#818cf8"/>
                </div>
                <div className="usp-feature-text">
                  <strong>Instant shortening</strong>
                  <span>Generate short links in milliseconds</span>
                </div>
              </div>

              <div className="usp-feature">
                <div className="usp-feature-icon" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <QrCode size={16} color="#a78bfa"/>
                </div>
                <div className="usp-feature-text">
                  <strong>QR Code generator</strong>
                  <span>Download print-ready PNG QR codes</span>
                </div>
              </div>

              <div className="usp-feature">
                <div className="usp-feature-icon" style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.25)' }}>
                  <Shield size={16} color="#c084fc"/>
                </div>
                <div className="usp-feature-text">
                  <strong>Custom aliases</strong>
                  <span>Brand your links with a custom slug</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right */}
          <div className="usp-right">
            <UrlShortener />
          </div>

        </div>
      </div>
    </>
  );
}