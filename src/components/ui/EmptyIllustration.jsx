// Custom hand-drawn empty-state illustrations. Eight scenes, all flat-style
// pastel SVGs that match the auth-page mascot palette (teal/cyan/cream
// brand, soft skin tones, brown hair). Each illustration is a single
// inline SVG component — no external assets, no dependencies.
//
// Usage:
//   <EmptyIllustration name="patients" size={220} />

const palette = {
  teal:    { 50: '#f0fdfa', 100: '#ccfbf1', 300: '#5eead4', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' },
  cyan:    { 100: '#cffafe', 300: '#67e8f9', 500: '#06b6d4', 600: '#0891b2' },
  rose:    { 200: '#fecdd3', 300: '#fda4af', 500: '#f43f5e' },
  amber:   { 100: '#fef3c7', 300: '#fcd34d', 500: '#f59e0b' },
  green:   { 200: '#bbf7d0', 400: '#4ade80' },
  slate:   { 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 700: '#334155', 900: '#0f172a' },
  skin:    { light: '#fde7d3', mid: '#f7d2b3', shadow: '#e8b390' },
  hair:    { light: '#92400e', dark: '#78350f' },
  paper:   '#ffffff',
};

// ── 1. NoPatients — Staff ID badge swinging on a lanyard ──────────────────
function NoPatients({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      {/* floor shadow */}
      <ellipse cx="160" cy="216" rx="64" ry="7" fill={palette.slate[300]} opacity="0.35" />
      {/* lanyard clip — the fixed pivot the badge swings from */}
      <rect x="154" y="24" width="12" height="11" rx="2" fill={palette.slate[400]} />
      <rect x="149" y="33" width="22" height="8" rx="3" fill={palette.slate[700]} />
      {/* swinging badge + straps (pendulum pivot at the clip ~160,42) */}
      <g className="es-sway" style={{ transformBox: 'view-box', transformOrigin: '160px 42px' }}>
        {/* lanyard straps */}
        <path d="M157 39 L 130 84 L 139 89 L 160 48 Z" fill={palette.teal[500]} />
        <path d="M163 39 L 190 84 L 181 89 L 160 48 Z" fill={palette.teal[600]} />
        {/* badge card */}
        <rect x="114" y="80" width="92" height="118" rx="12" fill={palette.paper} stroke={palette.slate[200]} strokeWidth="1.5" />
        {/* card header */}
        <path d="M114 92 a12 12 0 0 1 12 -12 H194 a12 12 0 0 1 12 12 V104 H114 Z" fill={palette.teal[500]} />
        {/* lanyard slot */}
        <rect x="150" y="86" width="20" height="5" rx="2.5" fill={palette.paper} opacity="0.7" />
        {/* avatar disc */}
        <circle cx="160" cy="136" r="23" fill={palette.teal[100]} stroke={palette.teal[300]} strokeWidth="1.5" />
        {/* person silhouette */}
        <circle cx="160" cy="129" r="7" fill={palette.teal[600]} />
        <path d="M148 156 a 12 10 0 0 1 24 0 Z" fill={palette.teal[600]} />
        {/* name + role placeholder lines */}
        <rect x="128" y="170" width="64" height="7" rx="3.5" fill={palette.slate[200]} />
        <rect x="138" y="183" width="44" height="6" rx="3" fill={palette.slate[200]} />
      </g>
      {/* floating "add person" plus — gentle bob */}
      <g className="es-bob es-d2">
        <circle cx="244" cy="78" r="15" fill={palette.cyan[500]} />
        <path d="M244 71 v 14 M237 78 h 14" stroke={palette.paper} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ── 2. NoAppointments — Calendar with sleeping moon ───────────────────────
function NoAppointments({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      {/* shadow */}
      <ellipse cx="160" cy="220" rx="100" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* calendar back */}
      <rect x="60" y="60" width="200" height="160" rx="14" fill={palette.paper} stroke={palette.slate[200]} strokeWidth="1.5" />
      {/* calendar header */}
      <path d="M60 74 a14 14 0 0 1 14 -14 H246 a14 14 0 0 1 14 14 V92 H60 Z" fill={palette.cyan[500]} />
      {/* binder rings */}
      <rect x="100" y="48" width="6" height="22" rx="3" fill={palette.slate[700]} />
      <rect x="214" y="48" width="6" height="22" rx="3" fill={palette.slate[700]} />
      {/* date dots — 5x4 grid */}
      <g fill={palette.slate[200]}>
        {Array.from({ length: 5 }).map((_, col) =>
          Array.from({ length: 4 }).map((_, row) => (
            <circle key={`${col}-${row}`} cx={88 + col * 36} cy={120 + row * 24} r="6" />
          ))
        )}
      </g>
      {/* sleeping moon (perched on calendar top right) */}
      <g className="es-bob">
        <path d="M205 65 a 28 28 0 1 0 28 28 a 22 22 0 0 1 -28 -28 z" fill={palette.amber[300]} stroke={palette.amber[500]} strokeWidth="1.5" />
        {/* sleeping eyes */}
        <path d="M210 88 q 4 -4 8 0" stroke={palette.slate[900]} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M222 88 q 4 -4 8 0" stroke={palette.slate[900]} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* small smile */}
        <path d="M214 96 q 4 4 8 0" stroke={palette.slate[900]} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* zzz — drift up and fade in sequence */}
      <text className="es-zzz es-d1" x="248" y="62" fontSize="14" fontWeight="700" fill={palette.cyan[600]}>z</text>
      <text className="es-zzz es-d2" x="262" y="48" fontSize="18" fontWeight="700" fill={palette.cyan[600]}>z</text>
      <text className="es-zzz es-d3" x="280" y="32" fontSize="22" fontWeight="700" fill={palette.cyan[600]}>z</text>
    </svg>
  );
}

// ── 3. NoPrescriptions — Rx pad with checkmark + pills ────────────────────
function NoPrescriptions({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="220" rx="100" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* prescription pad */}
      <rect x="80" y="40" width="160" height="180" rx="10" fill={palette.paper} stroke={palette.slate[200]} strokeWidth="1.5" />
      {/* tear-off perforation */}
      <line x1="80" y1="58" x2="240" y2="58" stroke={palette.slate[200]} strokeWidth="1" strokeDasharray="3 3" />
      {/* Rx symbol */}
      <text x="100" y="100" fontFamily="Georgia, serif" fontSize="38" fontWeight="700" fill={palette.teal[600]}>R</text>
      <line x1="113" y1="84" x2="125" y2="96" stroke={palette.teal[600]} strokeWidth="3" strokeLinecap="round" />
      {/* prescription lines */}
      <rect x="100" y="120" width="120" height="4" rx="2" fill={palette.slate[200]} />
      <rect x="100" y="135" width="100" height="4" rx="2" fill={palette.slate[200]} />
      <rect x="100" y="150" width="80"  height="4" rx="2" fill={palette.slate[200]} />
      {/* big check circle — gentle approval pulse */}
      <g className="es-pulse">
        <circle cx="200" cy="180" r="22" fill={palette.teal[500]} />
        <path d="M190 181 l 7 7 l 14 -14" fill="none" stroke={palette.paper} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* floating pills (wrapped so the bob doesn't clobber their position) */}
      <g className="es-bob es-d1">
        <g transform="translate(40, 145) rotate(-15)">
          <rect width="42" height="18" rx="9" fill={palette.rose[300]} />
          <rect width="21" height="18" rx="9" fill={palette.rose[200]} />
        </g>
      </g>
      <g className="es-bob-slow es-d2">
        <g transform="translate(248, 70) rotate(20)">
          <circle cx="10" cy="10" r="10" fill={palette.cyan[300]} />
          <path d="M2 10 h 16" stroke={palette.paper} strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}

// ── 4. NoLabResults — Empty test tube rack ────────────────────────────────
function NoLabResults({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="220" rx="110" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* rack base */}
      <rect x="60" y="170" width="200" height="22" rx="4" fill={palette.hair.light} />
      <rect x="60" y="190" width="200" height="6" rx="2" fill={palette.hair.dark} opacity="0.4" />
      {/* rack holes */}
      <ellipse cx="100" cy="174" rx="14" ry="4" fill={palette.hair.dark} />
      <ellipse cx="160" cy="174" rx="14" ry="4" fill={palette.hair.dark} />
      <ellipse cx="220" cy="174" rx="14" ry="4" fill={palette.hair.dark} />
      {/* test tubes (clear, empty) */}
      {[100, 160, 220].map((cx, i) => (
        <g key={i} className={`es-bob es-d${i + 1}`}>
          {/* tube body */}
          <path
            d={`M${cx - 12} 80 v 90 a 12 12 0 0 0 24 0 v -90 z`}
            fill={palette.cyan[100]}
            opacity="0.5"
            stroke={palette.cyan[500]}
            strokeWidth="2"
          />
          {/* lip */}
          <rect x={cx - 14} y="78" width="28" height="6" rx="2" fill={palette.cyan[500]} />
        </g>
      ))}
      {/* floating bubbles — rise and fade */}
      <circle className="es-rise es-d1" cx="160" cy="60" r="6" fill={palette.cyan[300]} />
      <circle className="es-rise es-d2" cx="178" cy="46" r="4" fill={palette.cyan[300]} />
      <circle className="es-rise es-d3" cx="142" cy="44" r="3" fill={palette.cyan[300]} />
    </svg>
  );
}

// ── 5. NoNotifications — Sleeping bell with Zzz ───────────────────────────
function NoNotifications({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="218" rx="80" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* bell tilted slightly (asleep) — gently rocking */}
      <g className="es-sway">
      <g transform="translate(160, 130) rotate(-8)">
        {/* bell body */}
        <path
          d="M -56 30 C -56 -10, -36 -38, 0 -38 C 36 -38, 56 -10, 56 30 L 56 36 L -56 36 Z"
          fill={palette.amber[300]}
          stroke={palette.amber[500]}
          strokeWidth="2"
        />
        {/* bell rim */}
        <rect x="-60" y="36" width="120" height="8" rx="3" fill={palette.amber[500]} />
        {/* bell top knob */}
        <circle cx="0" cy="-42" r="6" fill={palette.amber[500]} />
        {/* clapper */}
        <ellipse cx="0" cy="50" rx="8" ry="6" fill={palette.amber[500]} />
        {/* sleeping eyes */}
        <path d="M -22 -2 q 6 -6 12 0" stroke={palette.slate[900]} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 10 -2 q 6 -6 12 0" stroke={palette.slate[900]} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* mouth (small o) */}
        <ellipse cx="0" cy="14" rx="3.5" ry="5" fill={palette.slate[900]} />
        {/* cheeks */}
        <circle cx="-30" cy="14" r="6" fill={palette.rose[300]} opacity="0.5" />
        <circle cx="30" cy="14" r="6" fill={palette.rose[300]} opacity="0.5" />
      </g>
      </g>
      {/* zzz floating up-right — drift + fade in sequence */}
      <text className="es-zzz es-d1" x="216" y="118" fontSize="14" fontWeight="700" fill={palette.slate[400]}>z</text>
      <text className="es-zzz es-d2" x="232" y="98" fontSize="18" fontWeight="700" fill={palette.slate[400]}>z</text>
      <text className="es-zzz es-d3" x="252" y="74" fontSize="22" fontWeight="700" fill={palette.slate[400]}>z</text>
    </svg>
  );
}

// ── 6. NoInvoices — Empty receipt printer ─────────────────────────────────
function NoInvoices({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="220" rx="100" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* printer body */}
      <rect x="80" y="100" width="160" height="80" rx="10" fill={palette.slate[200]} stroke={palette.slate[400]} strokeWidth="1.5" />
      <rect x="80" y="100" width="160" height="20" rx="10" fill={palette.slate[300]} />
      {/* small power LED — blinking */}
      <circle className="es-blink" cx="100" cy="110" r="3" fill={palette.green[400]} />
      {/* paper slot */}
      <rect x="100" y="134" width="120" height="6" rx="3" fill={palette.slate[400]} />
      {/* paper hanging out (empty / blank) */}
      <path d="M104 144 L 216 144 L 220 200 Q 160 215, 100 200 Z" fill={palette.paper} stroke={palette.slate[200]} strokeWidth="1.5" />
      <line x1="120" y1="160" x2="200" y2="160" stroke={palette.slate[200]} strokeWidth="1.5" strokeDasharray="3 4" />
      <line x1="120" y1="172" x2="180" y2="172" stroke={palette.slate[200]} strokeWidth="1.5" strokeDasharray="3 4" />
      <line x1="120" y1="184" x2="190" y2="184" stroke={palette.slate[200]} strokeWidth="1.5" strokeDasharray="3 4" />
      {/* zigzag perforated bottom */}
      <path d="M100 200 L 110 208 L 120 200 L 130 208 L 140 200 L 150 208 L 160 200 L 170 208 L 180 200 L 190 208 L 200 200 L 210 208 L 220 200" fill="none" stroke={palette.slate[300]} strokeWidth="1.5" />
      {/* tiny coins floating to suggest "money" */}
      <g className="es-bob es-d1">
        <circle cx="60" cy="80" r="14" fill={palette.amber[300]} stroke={palette.amber[500]} strokeWidth="1.5" />
        <text x="55" y="86" fontSize="14" fontWeight="700" fill={palette.amber[500]}>₹</text>
      </g>
      <g className="es-bob-slow es-d2">
        <circle cx="270" cy="60" r="10" fill={palette.amber[300]} stroke={palette.amber[500]} strokeWidth="1.5" opacity="0.7" />
        <text x="266" y="65" fontSize="11" fontWeight="700" fill={palette.amber[500]} opacity="0.8">₹</text>
      </g>
    </svg>
  );
}

// ── 7. NotFound — Confused nurse mascot with question marks ───────────────
function NotFound({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nf-uniform" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={palette.teal[300]} />
          <stop offset="100%" stopColor={palette.teal[500]} />
        </linearGradient>
        <linearGradient id="nf-skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={palette.skin.light} />
          <stop offset="100%" stopColor={palette.skin.mid} />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="220" rx="80" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* shoulders */}
      <path d="M85 220 C 95 180, 130 168, 160 168 C 190 168, 225 180, 235 220 Z" fill="url(#nf-uniform)" />
      {/* head */}
      <ellipse cx="160" cy="120" rx="50" ry="56" fill="url(#nf-skin)" stroke={palette.skin.shadow} strokeWidth="1.2" />
      {/* hair */}
      <path d="M112 110 C 114 76, 138 60, 160 60 C 184 60, 208 76, 208 110 C 208 116, 206 120, 202 124 C 196 116, 178 110, 160 110 C 142 110, 124 116, 118 124 C 114 120, 112 116, 112 110 Z" fill={palette.hair.light} />
      {/* nurse cap */}
      <path d="M132 78 L 188 78 L 184 64 L 136 64 Z" fill={palette.paper} stroke={palette.slate[300]} strokeWidth="1" />
      <rect x="156" y="65" width="8" height="8" fill={palette.rose[500]} />
      <rect x="153" y="68" width="14" height="2" fill={palette.rose[500]} />
      {/* eyes — confused (one big, one small) + raised eyebrow */}
      <ellipse cx="142" cy="124" rx="4" ry="5" fill={palette.slate[900]} />
      <ellipse cx="178" cy="124" rx="4" ry="5" fill={palette.slate[900]} />
      <circle cx="141" cy="122" r="1.2" fill={palette.paper} />
      <circle cx="177" cy="122" r="1.2" fill={palette.paper} />
      {/* eyebrows — raised on right (confused) */}
      <path d="M132 110 q 10 -2 20 0" stroke={palette.hair.light} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M168 106 q 10 -4 20 -2" stroke={palette.hair.light} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* mouth — small "o" of confusion */}
      <ellipse cx="160" cy="150" rx="4" ry="6" fill={palette.slate[900]} />
      {/* cheeks */}
      <circle cx="118" cy="142" r="9" fill={palette.rose[300]} opacity="0.5" />
      <circle cx="202" cy="142" r="9" fill={palette.rose[300]} opacity="0.5" />
      {/* floating question marks — bob in sequence */}
      <text className="es-bob es-d1" x="40"  y="80"  fontSize="32" fontWeight="800" fill={palette.cyan[500]}>?</text>
      <text className="es-bob es-d2" x="250" y="60"  fontSize="40" fontWeight="800" fill={palette.teal[500]}>?</text>
      <text className="es-bob es-d3" x="270" y="130" fontSize="22" fontWeight="800" fill={palette.cyan[600]} opacity="0.7">?</text>
    </svg>
  );
}

// ── 8. NetworkError — Stethoscope unplugged ───────────────────────────────
function NetworkError({ size = 220 }) {
  return (
    <svg viewBox="0 0 320 240" width={size} height={size * 0.75} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="160" cy="220" rx="110" ry="6" fill={palette.slate[300]} opacity="0.35" />
      {/* wall outlet */}
      <rect x="50" y="70" width="60" height="80" rx="6" fill={palette.paper} stroke={palette.slate[300]} strokeWidth="2" />
      <rect x="68" y="92" width="8" height="14" rx="2" fill={palette.slate[700]} />
      <rect x="84" y="92" width="8" height="14" rx="2" fill={palette.slate[700]} />
      <rect x="76" y="116" width="8" height="14" rx="2" fill={palette.slate[700]} />
      {/* stethoscope plug — pulled out, dangling */}
      <g>
        {/* plug body */}
        <rect x="124" y="90" width="40" height="22" rx="4" fill={palette.slate[400]} stroke={palette.slate[700]} strokeWidth="1.5" />
        {/* plug prongs (now exposed, pulled away) */}
        <rect x="116" y="94" width="8" height="3" fill={palette.slate[400]} />
        <rect x="116" y="105" width="8" height="3" fill={palette.slate[400]} />
        {/* cable curling away */}
        <path
          d="M164 100 C 200 100, 220 130, 220 160 C 220 180, 180 180, 160 170"
          fill="none"
          stroke={palette.slate[700]}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
      {/* stethoscope chest piece */}
      <circle cx="160" cy="170" r="22" fill={palette.slate[700]} stroke={palette.slate[900]} strokeWidth="2" />
      <circle cx="160" cy="170" r="10" fill={palette.slate[400]} />
      {/* stethoscope ear pieces (above chest piece) */}
      <path d="M160 148 C 180 130, 200 130, 210 145" fill="none" stroke={palette.slate[700]} strokeWidth="3" />
      <path d="M160 148 C 140 130, 120 130, 110 145" fill="none" stroke={palette.slate[700]} strokeWidth="3" />
      {/* zigzag "disconnect" bolt between outlet and plug — blinking */}
      <path
        className="es-blink"
        d="M115 100 L 110 110 L 117 110 L 110 122"
        stroke={palette.rose[500]}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* x mark above — blinking alert */}
      <g className="es-blink" transform="translate(96, 40)">
        <circle r="14" fill={palette.rose[500]} />
        <path d="M -6 -6 L 6 6 M 6 -6 L -6 6" stroke={palette.paper} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const ILLUSTRATIONS = {
  patients:      NoPatients,
  appointments:  NoAppointments,
  prescriptions: NoPrescriptions,
  labResults:    NoLabResults,
  notifications: NoNotifications,
  invoices:      NoInvoices,
  notFound:      NotFound,
  networkError:  NetworkError,
};

// Aliases — match common empty-state phrasings so callers can use plain
// data nouns like "users" or "doctors" without a name lookup.
const ALIASES = {
  users: 'patients',
  doctors: 'patients',
  staff: 'patients',
  leads: 'patients',
  feedback: 'notifications',
  support: 'notifications',
  tests: 'labResults',
  lab: 'labResults',
  medicines: 'prescriptions',
  rx: 'prescriptions',
  insurance: 'invoices',
  billing: 'invoices',
  '404': 'notFound',
  error: 'networkError',
  offline: 'networkError',
};

export default function EmptyIllustration({ name = 'appointments', size = 220 }) {
  const key = ILLUSTRATIONS[name] ? name : (ALIASES[name] || 'appointments');
  const Component = ILLUSTRATIONS[key];
  return <Component size={size} />;
}

export { ILLUSTRATIONS };
