// src/pages/PasswordGeneratorPage.tsx
import PasswordGenerator from "@/components/PasswordGenerator";
import { ShieldCheck, Zap, Eye, KeyRound } from "lucide-react";

export default function PasswordGeneratorPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

        .pgp-page {
          font-family: 'Sora', sans-serif;
          min-height: calc(100dvh - 100px);
          display: flex;
          align-items: center;
          padding: 8px 40px;
          position: relative;
          overflow: hidden;
        }

        .pgp-blob-1 {
          position: absolute;
          width: 480px; height: 480px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%);
          top: -80px; left: -60px;
          pointer-events: none;
        }

        .pgp-blob-2 {
          position: absolute;
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%);
          bottom: -60px; right: 180px;
          pointer-events: none;
        }

        .pgp-grid {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 64px;
        }

        @media (max-width: 900px) {
          .pgp-grid { grid-template-columns: 1fr; gap: 40px; }
          .pgp-page { padding: 32px 20px; }
        }

        .pgp-hero {
          animation: pgpFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes pgpFade {
          from { opacity:0; transform:translateX(-24px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .pgp-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 99px;
          padding: 5px 14px 5px 8px;
          margin-bottom: 24px;
        }

        .pgp-badge-icon {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg,#7c3aed,#6366f1);
          display: flex; align-items: center; justify-content: center;
        }

        .pgp-badge-text {
          font-size: 12px; font-weight: 500; color: #a78bfa; letter-spacing: 0.04em;
        }

        .pgp-headline {
          font-size: clamp(30px, 3.8vw, 50px);
          font-weight: 800;
          color: #fff;
          line-height: 1.08;
          letter-spacing: -0.035em;
          margin-bottom: 18px;
        }

        .pgp-headline-accent {
          background: linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pgp-subtext {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          font-weight: 300;
          max-width: 420px;
          margin-bottom: 36px;
        }

        .pgp-features { display: flex; flex-direction: column; gap: 12px; }

        .pgp-feature {
          display: flex; align-items: center; gap: 12px;
          animation: pgpFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .pgp-feature:nth-child(1) { animation-delay:0.1s; }
        .pgp-feature:nth-child(2) { animation-delay:0.2s; }
        .pgp-feature:nth-child(3) { animation-delay:0.3s; }

        .pgp-feature-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .pgp-feature-text strong {
          display: block; font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.85); margin-bottom: 2px;
        }
        .pgp-feature-text span { font-size: 12px; color: rgba(255,255,255,0.3); }

        .pgp-stats {
          display: flex; gap: 12px; margin-top: 36px; flex-wrap: wrap;
        }

        .pgp-stat {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 18px;
        }

        .pgp-stat-num { font-size: 20px; font-weight: 700; color: #a78bfa; letter-spacing:-0.02em; }
        .pgp-stat-label { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        .pgp-right {
          display: flex; justify-content: center;
          animation: pgpFadeR 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }

        @keyframes pgpFadeR {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      <div className="pgp-page">
        <div className="pgp-blob-1"/>
        <div className="pgp-blob-2"/>

        <div className="pgp-grid">

          {/* ── Left: hero ── */}
          <div className="pgp-hero">
            <div className="pgp-badge">
              <div className="pgp-badge-icon"><KeyRound size={11} color="#fff"/></div>
              <span className="pgp-badge-text">Password Generator</span>
            </div>

            <h1 className="pgp-headline">
              Unbreakable.<br/>
              <span className="pgp-headline-accent">By design.</span>
            </h1>

            <p className="pgp-subtext">
              Generate high-entropy passwords, memorable passphrases,
              and secure PINs — all in one place, all client-side.
            </p>

            <div className="pgp-features">
              <div className="pgp-feature">
                <div className="pgp-feature-icon" style={{ background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.25)' }}>
                  <Zap size={16} color="#a78bfa"/>
                </div>
                <div className="pgp-feature-text">
                  <strong>3 generation modes</strong>
                  <span>Password, Passphrase, or PIN — your choice</span>
                </div>
              </div>

              <div className="pgp-feature">
                <div className="pgp-feature-icon" style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)' }}>
                  <ShieldCheck size={16} color="#818cf8"/>
                </div>
                <div className="pgp-feature-text">
                  <strong>Strength indicator</strong>
                  <span>Real-time visual feedback on password quality</span>
                </div>
              </div>

              <div className="pgp-feature">
                <div className="pgp-feature-icon" style={{ background:'rgba(110,231,183,0.12)', border:'1px solid rgba(110,231,183,0.2)' }}>
                  <Eye size={16} color="#6ee7b7"/>
                </div>
                <div className="pgp-feature-text">
                  <strong>100% client-side</strong>
                  <span>Nothing is sent to any server, ever</span>
                </div>
              </div>
            </div>

            <div className="pgp-stats">
              <div className="pgp-stat">
                <div className="pgp-stat-num">256+</div>
                <div className="pgp-stat-label">Char pool size</div>
              </div>
              <div className="pgp-stat">
                <div className="pgp-stat-num">3</div>
                <div className="pgp-stat-label">Generator modes</div>
              </div>
              <div className="pgp-stat">
                <div className="pgp-stat-num">0ms</div>
                <div className="pgp-stat-label">Server latency</div>
              </div>
            </div>
          </div>

          {/* ── Right: component ── */}
          <div className="pgp-right">
            <PasswordGenerator />
          </div>

        </div>
      </div>
    </>
  );
}