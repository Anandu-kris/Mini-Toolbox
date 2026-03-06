import { Gamepad2, Keyboard, CalendarDays, Trophy } from "lucide-react";
import { WordleGame } from "@/components/Wordle/WordleGame";

export default function WordlePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

        .wrd-page {
          font-family: 'Sora', sans-serif;
          display: flex;
          min-height: calc(100dvh - 120px);
          align-items: center;
          padding: 12px 40px;
          position: relative;
          overflow: hidden;
        }

        .wrd-grid {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 64px;
        }

        @media (max-width: 900px) {
          .wrd-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .wrd-page { padding: 32px 20px; }
        }

        /* Left — hero copy */
        .wrd-hero {
          animation: wrdFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes wrdFade {
          from { opacity:0; transform:translateX(-24px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .wrd-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 99px;
          padding: 5px 14px 5px 8px;
          margin-bottom: 24px;
        }

        .wrd-badge-icon {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          display: flex; align-items: center; justify-content: center;
        }

        .wrd-badge-text {
          font-size: 12.5px;
          font-weight: 500;
          color: #a78bfa;
          letter-spacing: 0.04em;
        }

        .wrd-headline {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          color: #fff;
          line-height: 1.08;
          letter-spacing: -0.035em;
          margin-bottom: 18px;
        }

        .wrd-headline-accent {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .wrd-subtext {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          font-weight: 300;
          max-width: 420px;
          margin-bottom: 36px;
        }

        /* Feature pills */
        .wrd-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .wrd-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          animation: wrdFade 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        .wrd-feature:nth-child(1) { animation-delay: 0.1s; }
        .wrd-feature:nth-child(2) { animation-delay: 0.2s; }
        .wrd-feature:nth-child(3) { animation-delay: 0.3s; }

        .wrd-feature-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .wrd-feature-text strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          margin-bottom: 2px;
        }

        .wrd-feature-text span {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        /* Right panel */
        .wrd-right {
          display: flex;
          justify-content: center;
          animation: wrdFadeRight 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }

        @keyframes wrdFadeRight {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }

        /* Optional: make the right card not exceed a nice width */
        .wrd-right-inner {
          width: 100%;
          max-width: 560px;
        }
      `}</style>

      <div className="wrd-page">
        <div className="wrd-grid">
          {/* Left */}
          <div className="wrd-hero">
            <div className="wrd-badge">
              <div className="wrd-badge-icon">
                <Gamepad2 size={12} color="#fff" />
              </div>
              <span className="wrd-badge-text">Wordle</span>
            </div>

            <h1 className="wrd-headline">
              Guess the word.
              <br />
              <span className="wrd-headline-accent">Keep the streak.</span>
            </h1>

            <p className="wrd-subtext">
              A daily 5-letter puzzle. Get feedback on every guess and solve it
              in 6 tries. Tap the <b>?</b> in the game card for rules & examples.
            </p>

            <div className="wrd-features">
              <div className="wrd-feature">
                <div
                  className="wrd-feature-icon"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  <Keyboard size={16} color="#818cf8" />
                </div>
                <div className="wrd-feature-text">
                  <strong>Keyboard + touch</strong>
                  <span>Type or tap — both work seamlessly</span>
                </div>
              </div>

              <div className="wrd-feature">
                <div
                  className="wrd-feature-icon"
                  style={{
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.25)",
                  }}
                >
                  <CalendarDays size={16} color="#a78bfa" />
                </div>
                <div className="wrd-feature-text">
                  <strong>Daily puzzle</strong>
                  <span>New word every day at midnight</span>
                </div>
              </div>

              <div className="wrd-feature">
                <div
                  className="wrd-feature-icon"
                  style={{
                    background: "rgba(192,132,252,0.15)",
                    border: "1px solid rgba(192,132,252,0.25)",
                  }}
                >
                  <Trophy size={16} color="#c084fc" />
                </div>
                <div className="wrd-feature-text">
                  <strong>Stats & streaks</strong>
                  <span>Track wins and streak history</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="wrd-right">
            <div className="wrd-right-inner">
              <WordleGame />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}