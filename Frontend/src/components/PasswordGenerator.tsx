import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "./ui/button";
import {
  LockKeyhole,
  Copy,
  Check,
  Lightbulb,
  Shuffle,
  Hash,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { WORDS } from "@/constants/WordList";

function generatePassword(
  length: number,
  opts: {
    lowercase: boolean;
    uppercase: boolean;
    digits: boolean;
    symbols: boolean;
  },
) {
  let chars = "";
  if (opts.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.digits) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-={}[]<>?";
  if (!chars) return "";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function generateUniqueWords(count: number) {
  const set = new Set<string>();
  while (set.size < count)
    set.add(WORDS[Math.floor(Math.random() * WORDS.length)]);
  return Array.from(set);
}

function generatePassphrase(opts: {
  wordsCount: number;
  separator: string;
  capitalizeWords: boolean;
  addNumber: boolean;
  addSymbol: boolean;
}) {
  const syms = ["!", "@", "#", "$", "%", "&", "*"];
  const num = Math.floor(Math.random() * 90 + 10);
  const words = generateUniqueWords(opts.wordsCount).map((w) =>
    opts.capitalizeWords ? w.charAt(0).toUpperCase() + w.slice(1) : w,
  );
  let phrase = words.join(opts.separator);
  if (opts.addNumber) phrase += `${opts.separator}${num}`;
  if (opts.addSymbol)
    phrase += `${opts.separator}${syms[Math.floor(Math.random() * syms.length)]}`;
  return phrase;
}

function generatePin(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function getStrength(pw: string, mode: string) {
  if (mode !== "password" || !pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABEL = [
  "",
  "Very Weak",
  "Weak",
  "Fair",
  "Strong",
  "Very Strong",
];
const STRENGTH_COLOR = [
  "",
  "#ff4444",
  "#ff6b35",
  "#f5a623",
  "#a3e635",
  "#4ade80",
];

/* ── component ───────────────────────────────────────────── */
export default function PasswordGenerator() {
  type Mode = "password" | "passphrase" | "pin";
  const [mode, setMode] = useState<Mode>("password");
  const [length, setLength] = useState(12);
  const [pwOptions, setPwOptions] = useState({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
  });
  const [wordsCount, setWordsCount] = useState(4);
  const [separator, setSeparator] = useState<"-" | " " | ".">("-");
  const [ppOptions, setPpOptions] = useState({
    capitalizeWords: true,
    addNumber: true,
    addSymbol: false,
  });
  const [pinLength, setPinLength] = useState(6);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const ppConfig = useMemo(
    () => ({ wordsCount, separator, ...ppOptions }),
    [wordsCount, separator, ppOptions],
  );

  const generate = () => {
    if (mode === "password") setOutput(generatePassword(length, pwOptions));
    else if (mode === "passphrase") setOutput(generatePassphrase(ppConfig));
    else setOutput(generatePin(pinLength));
  };

  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, length, pwOptions, ppConfig, pinLength]);

  const copyValue = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const strength = getStrength(output, mode);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .pg-card {
          font-family: 'Sora', sans-serif;
          width: 100%;
          max-width: 480px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 28px;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.45), 0 0 80px rgba(99,102,241,0.08);
          animation: pgUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes pgUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Header */
        .pg-header { display:flex; align-items:center; gap:10px; margin-bottom:22px; }
        .pg-header-icon {
          width:34px; height:34px; border-radius:10px;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          flex-shrink:0;
        }
        .pg-header-title { font-size:17px; font-weight:700; color:#fff; letter-spacing:-0.02em; }
        .pg-header-sub   { font-size:11px; color:rgba(255,255,255,0.3); margin-top:1px; }

        /* Mode tabs */
        .pg-tabs {
          display:flex; gap:4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius:14px; padding:4px;
          margin-bottom:22px;
        }
        .pg-tab {
          flex:1; display:flex; align-items:center; justify-content:center;
          gap:6px; height:36px; border-radius:10px; border:none;
          font-family:'Sora',sans-serif; font-size:12px; font-weight:500;
          cursor:pointer; transition:all 0.2s;
          background:transparent; color:rgba(255,255,255,0.35);
        }
        .pg-tab.active {
          background:rgba(99,102,241,0.18);
          color:#a78bfa;
          border:1px solid rgba(99,102,241,0.3);
          box-shadow:0 0 14px rgba(99,102,241,0.12);
        }
        .pg-tab:hover:not(.active) { color:rgba(255,255,255,0.65); background:rgba(255,255,255,0.04); }

        /* Section label */
        .pg-label {
          font-size:11px; font-weight:500; letter-spacing:0.08em;
          text-transform:uppercase; color:rgba(255,255,255,0.4);
          margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;
        }
        .pg-label-val { color:#a78bfa; font-weight:600; font-size:12px; letter-spacing:0; text-transform:none; }

        /* Slider wrapper */
        .pg-slider-wrap { margin-bottom:18px; }

        /* Option row */
        .pg-option {
          display:flex; align-items:center; justify-content:space-between;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
          border-radius:12px; padding:11px 14px; margin-bottom:8px;
          transition: border-color 0.2s;
        }
        .pg-option:hover { border-color:rgba(99,102,241,0.2); }
        .pg-option-label { font-size:13px; color:rgba(255,255,255,0.7); }

        /* Custom toggle */
        .pg-toggle {
          width:40px; height:22px; border-radius:99px; border:none; cursor:pointer;
          position:relative; transition:all 0.25s; flex-shrink:0;
          background:rgba(255,255,255,0.1);
        }
        .pg-toggle.on { background:linear-gradient(135deg,#6366f1,#4f46e5); box-shadow:0 0 10px rgba(99,102,241,0.4); }
        .pg-toggle::after {
          content:''; position:absolute; top:3px; left:3px;
          width:16px; height:16px; border-radius:50%; background:#fff;
          transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        }
        .pg-toggle.on::after { transform:translateX(18px); }

        /* Separator pills */
        .pg-sep-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .pg-sep-pills { display:flex; gap:6px; }
        .pg-sep-pill {
          height:28px; min-width:44px; padding:0 12px; border-radius:8px; border:none;
          font-family:'Sora',sans-serif; font-size:12px; font-weight:500;
          cursor:pointer; transition:all 0.2s;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
          color:rgba(255,255,255,0.5);
        }
        .pg-sep-pill.active {
          background:rgba(99,102,241,0.18); border-color:rgba(99,102,241,0.35); color:#a78bfa;
        }

        /* Output box */
        .pg-output-wrap { position:relative; margin-bottom:16px; margin-top:6px; }
        .pg-output {
          width:100%; background:rgba(255,255,255,0.05) !important;
          border:1px solid rgba(255,255,255,0.09) !important; border-radius:14px !important;
          color:#fff !important; font-size:14px !important; font-family:'Sora',monospace !important;
          padding:14px 48px 14px 16px !important; min-height:52px;
          word-break:break-all; line-height:1.5; resize:none; outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
        }
        .pg-output:focus { border-color:rgba(99,102,241,0.4) !important; box-shadow:0 0 0 3px rgba(99,102,241,0.1) !important; }

        .pg-copy-btn {
          position:absolute; right:10px; top:50%; transform:translateY(-50%);
          width:32px; height:32px; border-radius:9px; border:none; cursor:pointer;
          background:rgba(99,102,241,0.14); border:1px solid rgba(99,102,241,0.2);
          color:#a78bfa; display:flex; align-items:center; justify-content:center;
          transition:all 0.2s;
        }
        .pg-copy-btn:hover { background:rgba(99,102,241,0.25); color:#c4b5fd; }
        .pg-copy-btn.copied { background:rgba(74,222,128,0.14); border-color:rgba(74,222,128,0.3); color:#4ade80; }

        /* Strength bar */
        .pg-strength { margin-bottom:16px; }
        .pg-strength-track { display:flex; gap:4px; margin-bottom:5px; }
        .pg-strength-seg {
          flex:1; height:4px; border-radius:99px;
          background:rgba(255,255,255,0.07); transition:background 0.3s;
        }
        .pg-strength-label { font-size:11px; font-family:'Sora',sans-serif; transition:color 0.3s; }

        /* Generate button */
        .pg-gen-btn {
          width:100%; height:46px; border-radius:12px;
          background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);
          border:none; color:#fff; font-family:'Sora',sans-serif;
          font-size:14px; font-weight:600; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.2s; box-shadow:0 4px 20px rgba(99,102,241,0.35);
          position:relative; overflow:hidden;
        }
        .pg-gen-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);
        }
        .pg-gen-btn:hover { transform:translateY(-1px); box-shadow:0 6px 28px rgba(99,102,241,0.5); }
        .pg-gen-btn:active { transform:translateY(0); }
      `}</style>

      <div className="pg-card">
        {/* Header */}
        <div className="pg-header">
          <div className="pg-header-icon">
            <LockKeyhole size={16} color="#fff" />
          </div>
          <div>
            <div className="pg-header-title">
              {mode === "password"
                ? "Password Generator"
                : mode === "passphrase"
                  ? "Passphrase Generator"
                  : "PIN Generator"}
            </div>
            <div className="pg-header-sub">Secure · Randomized · Instant</div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="pg-tabs">
          {(["password", "passphrase", "pin"] as const).map((m) => (
            <button
              key={m}
              className={`pg-tab ${mode === m ? "active" : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "password" && <Shuffle size={13} />}
              {m === "passphrase" && <Lightbulb size={13} />}
              {m === "pin" && <Hash size={13} />}
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Password controls ── */}
        {mode === "password" && (
          <>
            <div className="pg-slider-wrap">
              <div className="pg-label">
                Length <span className="pg-label-val">{length} chars</span>
              </div>
              <Slider
                min={6}
                max={32}
                step={1}
                value={[length]}
                onValueChange={(v) => setLength(v[0])}
              />
            </div>
            <PgOption
              label="Lowercase Letters"
              checked={pwOptions.lowercase}
              onChange={(v) => setPwOptions({ ...pwOptions, lowercase: v })}
            />
            <PgOption
              label="Uppercase Letters"
              checked={pwOptions.uppercase}
              onChange={(v) => setPwOptions({ ...pwOptions, uppercase: v })}
            />
            <PgOption
              label="Digits"
              checked={pwOptions.digits}
              onChange={(v) => setPwOptions({ ...pwOptions, digits: v })}
            />
            <PgOption
              label="Special Characters"
              checked={pwOptions.symbols}
              onChange={(v) => setPwOptions({ ...pwOptions, symbols: v })}
            />
          </>
        )}

        {/* ── Passphrase controls ── */}
        {mode === "passphrase" && (
          <>
            <div className="pg-slider-wrap">
              <div className="pg-label">
                Word Count{" "}
                <span className="pg-label-val">{wordsCount} words</span>
              </div>
              <Slider
                min={3}
                max={10}
                step={1}
                value={[wordsCount]}
                onValueChange={(v) => setWordsCount(v[0])}
              />
            </div>

            <div className="pg-option" style={{ marginBottom: 8 }}>
              <span className="pg-option-label">Separator</span>
              <div className="pg-sep-pills">
                {(["-", " ", "."] as const).map((s) => (
                  <button
                    key={s}
                    className={`pg-sep-pill ${separator === s ? "active" : ""}`}
                    onClick={() => setSeparator(s)}
                  >
                    {s === " " ? "space" : `" ${s} "`}
                  </button>
                ))}
              </div>
            </div>

            <PgOption
              label="Capitalize Words"
              checked={ppOptions.capitalizeWords}
              onChange={(v) =>
                setPpOptions({ ...ppOptions, capitalizeWords: v })
              }
            />
            <PgOption
              label="Add a Number"
              checked={ppOptions.addNumber}
              onChange={(v) => setPpOptions({ ...ppOptions, addNumber: v })}
            />
            <PgOption
              label="Add a Symbol"
              checked={ppOptions.addSymbol}
              onChange={(v) => setPpOptions({ ...ppOptions, addSymbol: v })}
            />
          </>
        )}

        {/* ── PIN controls ── */}
        {mode === "pin" && (
          <>
            <div className="pg-slider-wrap">
              <div className="pg-label">
                PIN Length{" "}
                <span className="pg-label-val">{pinLength} digits</span>
              </div>
              <Slider
                min={4}
                max={12}
                step={1}
                value={[pinLength]}
                onValueChange={(v) => setPinLength(v[0])}
              />
            </div>
            {/* PIN display grid */}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {output.split("").map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 12,
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#a78bfa",
                    fontFamily: "monospace",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Output */}
        {mode !== "pin" && (
          <div className="pg-output-wrap">
            <textarea
              className="pg-output"
              readOnly
              value={output}
              rows={output.length > 30 ? 2 : 1}
            />
            <button
              className={`pg-copy-btn ${copied ? "copied" : ""}`}
              onClick={copyValue}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        {/* Strength meter — password only */}
        {mode === "password" && output && (
          <div className="pg-strength">
            <div className="pg-strength-track">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="pg-strength-seg"
                  style={{
                    background:
                      i <= strength ? STRENGTH_COLOR[strength] : undefined,
                  }}
                />
              ))}
            </div>
            <div
              className="pg-strength-label"
              style={{ color: STRENGTH_COLOR[strength] }}
            >
              {STRENGTH_LABEL[strength]}
            </div>
          </div>
        )}

        {/* Copy for PIN */}
        {mode === "pin" && (
          <Button
            className={`pg-copy-btn`}
            style={{
              position: "static",
              width: "100%",
              height: 38,
              borderRadius: 12,
              marginBottom: 12,
              transform: "none",
            }}
            onClick={copyValue}
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy PIN
              </>
            )}
          </Button>
        )}

        <Button className="pg-gen-btn" onClick={generate}>
          <RefreshCw size={14} />
          Generate New{" "}
          {mode === "password"
            ? "Password"
            : mode === "passphrase"
              ? "Passphrase"
              : "PIN"}
        </Button>
      </div>
    </>
  );
}

function PgOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="pg-option">
      <span className="pg-option-label">{label}</span>
      <button
        className={`pg-toggle ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        aria-label={label}
      />
    </div>
  );
}
