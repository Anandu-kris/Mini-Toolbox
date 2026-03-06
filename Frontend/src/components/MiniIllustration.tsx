// src/components/MiniToolboxIllustration.tsx

export function MiniToolboxIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 560 680"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="purpleBloom" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="boxFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6d28d9"/>
          <stop offset="100%" stopColor="#3b0764"/>
        </linearGradient>
        <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5b21b6"/>
          <stop offset="100%" stopColor="#2e1065"/>
        </linearGradient>
        <linearGradient id="lidFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#5b21b6"/>
        </linearGradient>
        <linearGradient id="lidTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
        <linearGradient id="lidRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6d28d9"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </linearGradient>
        <linearGradient id="handleChrome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0d7ff"/>
          <stop offset="50%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
        <linearGradient id="card1" x1="0%" y1="0%" x2="135%" y2="135%">
          <stop offset="0%" stopColor="#1e1040"/>
          <stop offset="100%" stopColor="#2d1b69"/>
        </linearGradient>
        <linearGradient id="card2" x1="0%" y1="0%" x2="135%" y2="135%">
          <stop offset="0%" stopColor="#0f2040"/>
          <stop offset="100%" stopColor="#1a3a6e"/>
        </linearGradient>
        <linearGradient id="card3" x1="0%" y1="0%" x2="135%" y2="135%">
          <stop offset="0%" stopColor="#1a0a30"/>
          <stop offset="100%" stopColor="#3b1060"/>
        </linearGradient>
        <linearGradient id="card4" x1="0%" y1="0%" x2="135%" y2="135%">
          <stop offset="0%" stopColor="#0d2010"/>
          <stop offset="100%" stopColor="#14532d"/>
        </linearGradient>
        <filter id="mtb-boxGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="mtb-softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="mtb-cardGlow">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#7c3aed" floodOpacity="0.4"/>
        </filter>
        <filter id="mtb-groundShadow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
        </filter>
        <pattern id="mtb-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1" fill="#ffffff" opacity="0.06"/>
        </pattern>
      </defs>

      {/* Background — matches your dark auth bg */}
      <rect width="560" height="680" fill="#0f0c1e"/>
      <rect width="560" height="680" fill="url(#mtb-dots)"/>
      <rect width="560" height="680" fill="url(#purpleBloom)"/>

      {/* Ambient blobs */}
      <ellipse cx="420" cy="160" rx="200" ry="180" fill="#5b21b6" opacity="0.12"/>
      <ellipse cx="120" cy="540" rx="180" ry="150" fill="#3b0764" opacity="0.15"/>
      <ellipse cx="280" cy="400" rx="220" ry="180" fill="#4c1d95" opacity="0.10"/>

      {/* Ground shadow */}
      <ellipse cx="280" cy="568" rx="148" ry="22" fill="#000" opacity="0.55" filter="url(#mtb-groundShadow)"/>

      {/* ── 3D Toolbox ── */}
      <g filter="url(#mtb-boxGlow)">
        {/* Body */}
        <polygon points="130,390 130,530 280,580 430,530 430,390 280,440" fill="url(#boxFront)"/>
        <polygon points="430,390 430,530 280,580 280,440" fill="url(#boxRight)"/>
        <polygon points="130,390 280,340 430,390 280,440" fill="url(#boxTop)" opacity="0.5"/>
        <line x1="130" y1="390" x2="130" y2="530" stroke="#a78bfa" strokeWidth="1" opacity="0.4"/>
        <line x1="130" y1="390" x2="280" y2="440" stroke="#c4b5fd" strokeWidth="1" opacity="0.3"/>
        <line x1="430" y1="390" x2="430" y2="530" stroke="#7c3aed" strokeWidth="1" opacity="0.3"/>
        <line x1="130" y1="530" x2="280" y2="580" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5"/>
        <line x1="280" y1="580" x2="430" y2="530" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5"/>
        <polygon points="138,395 138,525 195,548 195,420" fill="#ffffff" opacity="0.04"/>
        {/* Latch */}
        <rect x="255" y="455" width="50" height="20" rx="6" fill="#1e0a3c"/>
        <rect x="255" y="455" width="50" height="20" rx="6" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.7"/>
        <rect x="267" y="460" width="26" height="10" rx="4" fill="#7c3aed" opacity="0.6"/>
        <circle cx="280" cy="465" r="3" fill="#c4b5fd" opacity="0.9"/>
        {/* Lid */}
        <polygon points="130,340 130,392 280,442 430,392 430,340 280,290" fill="url(#lidFront)"/>
        <polygon points="430,340 430,392 280,442 280,290" fill="url(#lidRight)"/>
        <polygon points="130,340 280,290 430,340 280,390" fill="url(#lidTop)"/>
        <line x1="130" y1="340" x2="280" y2="290" stroke="#ddd6fe" strokeWidth="1.5" opacity="0.5"/>
        <line x1="280" y1="290" x2="430" y2="340" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.4"/>
        <polygon points="148,335 280,288 360,318 230,368" fill="#ffffff" opacity="0.08"/>
        {/* Handle */}
        <path d="M240,316 Q280,278 320,316" fill="none" stroke="url(#handleChrome)" strokeWidth="8" strokeLinecap="round" filter="url(#mtb-softGlow)"/>
        <path d="M240,316 Q280,278 320,316" fill="none" stroke="#e0d7ff" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
        <ellipse cx="240" cy="316" rx="7" ry="5" fill="#a78bfa"/>
        <ellipse cx="320" cy="316" rx="7" ry="5" fill="#a78bfa"/>
        {/* Label */}
        <text x="280" y="510" fontFamily="'Sora', 'Segoe UI', sans-serif" fontSize="12" fontWeight="700" fill="#c4b5fd" textAnchor="middle" letterSpacing="3" opacity="0.8">MINI-TOOLBOX</text>
      </g>

      {/* ── URL Shortener card ── */}
      <g transform="translate(52, 178)" filter="url(#mtb-cardGlow)">
        <rect width="118" height="76" rx="16" fill="url(#card2)"/>
        <rect width="118" height="76" rx="16" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.5"/>
        <rect x="12" y="12" width="32" height="32" rx="10" fill="#1d4ed8" opacity="0.5"/>
        <g transform="translate(28, 28)" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
          <path d="M-5,3 Q-5,-4 1,-4 L4,-4 Q10,-4 10,3 Q10,10 4,10 L1,10"/>
          <path d="M5,-3 Q5,4-1,4 L-4,4 Q-10,4-10,-3 Q-10,-10-4,-10 L-1,-10"/>
        </g>
        <text x="52" y="30" fontFamily="'Sora', sans-serif" fontSize="10" fontWeight="700" fill="#93c5fd">URL</text>
        <text x="52" y="44" fontFamily="'Sora', sans-serif" fontSize="10" fill="#64748b">Shortener</text>
        <rect x="12" y="56" width="94" height="4" rx="2" fill="#1e3a5f"/>
        <rect x="12" y="56" width="60" height="4" rx="2" fill="#3b82f6" opacity="0.8"/>
      </g>

      {/* ── Password Manager card ── */}
      <g transform="translate(390, 155)" filter="url(#mtb-cardGlow)">
        <rect width="118" height="76" rx="16" fill="url(#card3)"/>
        <rect width="118" height="76" rx="16" fill="none" stroke="#ec4899" strokeWidth="1" opacity="0.5"/>
        <rect x="12" y="12" width="32" height="32" rx="10" fill="#9d174d" opacity="0.4"/>
        <g transform="translate(28, 28)">
          <rect x="-8" y="-3" width="16" height="12" rx="3" fill="none" stroke="#f472b6" strokeWidth="2"/>
          <path d="M-5,-3 Q-5,-12 0,-12 Q5,-12 5,-3" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="0" cy="3" r="2.5" fill="#f472b6"/>
        </g>
        <text x="52" y="30" fontFamily="'Sora', sans-serif" fontSize="10" fontWeight="700" fill="#f9a8d4">Password</text>
        <text x="52" y="44" fontFamily="'Sora', sans-serif" fontSize="10" fill="#64748b">Manager</text>
        <rect x="12" y="56" width="94" height="4" rx="2" fill="#3b0a2a"/>
        <rect x="12" y="56" width="80" height="4" rx="2" fill="#ec4899" opacity="0.8"/>
      </g>

      {/* ── Pomodoro card ── */}
      <g transform="translate(32, 342)" filter="url(#mtb-cardGlow)">
        <rect width="118" height="76" rx="16" fill="url(#card1)"/>
        <rect width="118" height="76" rx="16" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.5"/>
        <rect x="12" y="12" width="32" height="32" rx="10" fill="#78350f" opacity="0.5"/>
        <g transform="translate(28, 28)">
          <circle cx="0" cy="0" r="11" fill="none" stroke="#fbbf24" strokeWidth="2"/>
          <line x1="0" y1="0" x2="0" y2="-7" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
          <line x1="0" y1="0" x2="5" y2="3" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
          <line x1="-3" y1="-13" x2="3" y2="-13" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
        </g>
        <text x="52" y="30" fontFamily="'Sora', sans-serif" fontSize="10" fontWeight="700" fill="#fcd34d">Pomodoro</text>
        <text x="52" y="44" fontFamily="'Sora', sans-serif" fontSize="10" fill="#64748b">25:00 left</text>
        <rect x="12" y="56" width="94" height="4" rx="2" fill="#1c1005"/>
        <rect x="12" y="56" width="45" height="4" rx="2" fill="#f59e0b" opacity="0.8"/>
      </g>

      {/* ── Notes & Tasks card ── */}
      <g transform="translate(410, 328)" filter="url(#mtb-cardGlow)">
        <rect width="118" height="76" rx="16" fill="url(#card4)"/>
        <rect width="118" height="76" rx="16" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.5"/>
        <rect x="12" y="12" width="32" height="32" rx="10" fill="#065f46" opacity="0.5"/>
        <g transform="translate(18, 16)" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round">
          <polyline points="4,8 6,10 10,6"/>
          <line x1="14" y1="8" x2="26" y2="8"/>
          <polyline points="4,18 6,20 10,16"/>
          <line x1="14" y1="18" x2="22" y2="18"/>
          <circle cx="6" cy="26" r="2" fill="#34d399" stroke="none"/>
          <line x1="14" y1="26" x2="20" y2="26"/>
        </g>
        <text x="52" y="30" fontFamily="'Sora', sans-serif" fontSize="10" fontWeight="700" fill="#6ee7b7">Notes &amp;</text>
        <text x="52" y="44" fontFamily="'Sora', sans-serif" fontSize="10" fill="#64748b">Tasks</text>
        <rect x="12" y="56" width="94" height="4" rx="2" fill="#022c22"/>
        <rect x="12" y="56" width="70" height="4" rx="2" fill="#10b981" opacity="0.8"/>
      </g>

      {/* Connector lines */}
      <line x1="170" y1="242" x2="196" y2="322" stroke="#a78bfa" strokeWidth="1" strokeDasharray="5 5" opacity="0.25"/>
      <line x1="390" y1="218" x2="368" y2="310" stroke="#a78bfa" strokeWidth="1" strokeDasharray="5 5" opacity="0.25"/>
      <line x1="150" y1="380" x2="200" y2="412" stroke="#a78bfa" strokeWidth="1" strokeDasharray="5 5" opacity="0.2"/>
      <line x1="410" y1="368" x2="368" y2="408" stroke="#a78bfa" strokeWidth="1" strokeDasharray="5 5" opacity="0.2"/>

      {/* Floating particles */}
      <g filter="url(#mtb-softGlow)">
        <circle cx="86" cy="148" r="2.5" fill="#a78bfa" opacity="0.7"/>
        <circle cx="462" cy="126" r="2" fill="#c4b5fd" opacity="0.6"/>
        <circle cx="44" cy="486" r="2" fill="#7c3aed" opacity="0.6"/>
        <circle cx="510" cy="460" r="2.5" fill="#a78bfa" opacity="0.5"/>
        <circle cx="286" cy="118" r="3" fill="#c4b5fd" opacity="0.5"/>
        <g fill="#c4b5fd" opacity="0.5">
          <rect x="488" y="268" width="2" height="10" rx="1"/>
          <rect x="484" y="272" width="10" height="2" rx="1"/>
        </g>
        <g fill="#a78bfa" opacity="0.4">
          <rect x="66" y="610" width="2" height="8" rx="1"/>
          <rect x="63" y="613" width="8" height="2" rx="1"/>
        </g>
      </g>

      {/* Labels */}
      <text x="280" y="76" fontFamily="'Sora', system-ui, sans-serif" fontSize="12" fontWeight="600" fill="#a78bfa" textAnchor="middle" letterSpacing="5" opacity="0.8">YOUR POCKET WORKSPACE</text>
      <text x="280" y="626" fontFamily="'Sora', system-ui, sans-serif" fontSize="11" fontWeight="500" fill="#4c1d95" textAnchor="middle" letterSpacing="3" opacity="0.9">TOOLS · UTILITIES · PRODUCTIVITY</text>
    </svg>
  )
}