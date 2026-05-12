// Inline SVG cartoon mascot — a friendly platform operator (think
// customer-success / SRE) for the hms-admin Operator Console login.
//
// Visual cues that say "operator", not "doctor":
//   • Headphones with a mic boom (call-center / on-call vibe)
//   • Casual indigo shirt instead of a white coat — no stethoscope
//   • A small open laptop in the foreground showing a tiny dashboard
//   • Glowing "online" status dot on the laptop screen
//
// Pure SVG, no external dependency. Eyes track the pointer and blink on
// a timer — same micro-interactions as the old DoctorMascot so the form
// still feels alive.

import { useEffect, useRef, useState } from 'react';

export default function OperatorMascot({ size = 320, mood = 'happy' }) {
  const wrapRef = useRef(null);
  const [eye, setEye] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / rect.width;
        const dy = (e.clientY - cy) / rect.height;
        const k = 6;
        setEye({
          x: Math.max(-k, Math.min(k, dx * 18)),
          y: Math.max(-k, Math.min(k, dy * 18)),
        });
      });
    };
    window.addEventListener('mousemove', onMove);
    const blinkInt = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 4500);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearInterval(blinkInt);
      cancelAnimationFrame(raf);
    };
  }, []);

  const smile = mood === 'happy';

  return (
    <div ref={wrapRef} className="select-none" style={{ width: size, height: size }}>
      <svg viewBox="0 0 320 320" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shirtGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#fde7d3" />
            <stop offset="100%" stopColor="#f7d2b3" />
          </linearGradient>
          <linearGradient id="hairGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#1f2937" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fda4af" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%"   stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        {/* soft halo */}
        <circle cx="160" cy="160" r="146" fill="url(#bg)" opacity="0.18" />
        <circle cx="160" cy="160" r="120" fill="#ffffff" opacity="0.06" />

        {/* shoulders / casual shirt — replaces the doctor coat */}
        <path d="M40 290 C 60 230, 110 215, 160 215 C 210 215, 260 230, 280 290 Z"
              fill="url(#shirtGrad)" stroke="#1e3a8a" strokeWidth="2" />
        {/* shirt v-neck */}
        <path d="M138 220 L 160 252 L 182 220 Z" fill="#1e3a8a" opacity="0.7" />
        {/* shirt buttons hint — three small dots down the placket */}
        <circle cx="160" cy="260" r="1.6" fill="#cbd5e1" opacity="0.7" />
        <circle cx="160" cy="270" r="1.6" fill="#cbd5e1" opacity="0.7" />
        <circle cx="160" cy="280" r="1.6" fill="#cbd5e1" opacity="0.7" />

        {/* neck */}
        <rect x="142" y="195" width="36" height="30" rx="8" fill="url(#skinGrad)" />

        {/* head */}
        <ellipse cx="160" cy="135" rx="78" ry="86" fill="url(#skinGrad)" stroke="#e8b390" strokeWidth="1.5" />

        {/* hair */}
        <path d="M85 110 C 90 65, 130 45, 160 45 C 195 45, 232 65, 235 115 C 220 95, 195 90, 175 100 C 155 90, 120 95, 95 115 Z"
              fill="url(#hairGrad)" />

        {/* ears (drawn before cups so cups overlap them naturally) */}
        <ellipse cx="84"  cy="140" rx="10" ry="14" fill="url(#skinGrad)" stroke="#e8b390" strokeWidth="1.2" />
        <ellipse cx="236" cy="140" rx="10" ry="14" fill="url(#skinGrad)" stroke="#e8b390" strokeWidth="1.2" />

        {/* HEADPHONES — replaces the stethoscope */}
        {/* headband */}
        <path d="M82 130 C 90 70, 230 70, 238 130"
              fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <path d="M85 130 C 92 80, 228 80, 235 130"
              fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
        {/* left ear cup */}
        <ellipse cx="80"  cy="142" rx="14" ry="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
        <ellipse cx="80"  cy="142" rx="8"  ry="12" fill="#334155" />
        {/* right ear cup */}
        <ellipse cx="240" cy="142" rx="14" ry="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
        <ellipse cx="240" cy="142" rx="8"  ry="12" fill="#334155" />
        {/* mic boom — drops from right cup, ends with a small foam ball */}
        <path d="M240 155 Q 245 195, 215 205" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="212" cy="206" r="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />

        {/* glasses */}
        <g stroke="#0f172a" strokeWidth="3" fill="none">
          <circle cx="125" cy="142" r="20" />
          <circle cx="195" cy="142" r="20" />
          <line x1="145" y1="142" x2="175" y2="142" />
        </g>
        <circle cx="125" cy="142" r="18" fill="#dbeafe" opacity="0.35" />
        <circle cx="195" cy="142" r="18" fill="#dbeafe" opacity="0.35" />

        {/* eye whites */}
        <ellipse cx="125" cy="142" rx="11" ry={blink ? 1 : 9} fill="#ffffff" />
        <ellipse cx="195" cy="142" rx="11" ry={blink ? 1 : 9} fill="#ffffff" />
        {/* pupils tracking pointer */}
        {!blink && (
          <>
            <circle cx={125 + eye.x}       cy={142 + eye.y}       r="4.5" fill="#0f172a" />
            <circle cx={195 + eye.x}       cy={142 + eye.y}       r="4.5" fill="#0f172a" />
            <circle cx={125 + eye.x - 1.5} cy={142 + eye.y - 1.5} r="1.4" fill="#ffffff" />
            <circle cx={195 + eye.x - 1.5} cy={142 + eye.y - 1.5} r="1.4" fill="#ffffff" />
          </>
        )}

        {/* eyebrows */}
        <path d="M108 122 Q 125 116, 142 122" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M178 122 Q 195 116, 212 122" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* nose */}
        <path d="M160 152 Q 156 170, 160 180 Q 164 175, 168 178"
              stroke="#c98a66" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* cheeks */}
        <circle cx="105" cy="172" r="14" fill="url(#cheek)" />
        <circle cx="215" cy="172" r="14" fill="url(#cheek)" />

        {/* mouth */}
        {smile ? (
          <path d="M138 196 Q 160 214, 182 196" stroke="#0f172a" strokeWidth="3.5" fill="#9c2929" strokeLinejoin="round" />
        ) : (
          <line x1="142" y1="200" x2="178" y2="200" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* LAPTOP — sits in front, says "operator" not "doctor" */}
        {/* laptop body (keyboard half) */}
        <path d="M70 305 L 250 305 L 240 295 L 80 295 Z"
              fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
        {/* laptop screen */}
        <rect x="92" y="252" width="136" height="46" rx="3"
              fill="url(#screenGrad)" stroke="#0f172a" strokeWidth="1.5" />
        {/* dashboard mini-UI on the screen */}
        <rect x="98"  y="258" width="34" height="3" rx="1" fill="#60a5fa" />
        <rect x="98"  y="265" width="22" height="2" fill="#475569" />
        <rect x="98"  y="271" width="28" height="2" fill="#475569" />
        {/* tiny bar chart */}
        <rect x="146" y="278" width="4"  height="14" fill="#22d3ee" />
        <rect x="154" y="272" width="4"  height="20" fill="#22d3ee" />
        <rect x="162" y="282" width="4"  height="10" fill="#22d3ee" />
        <rect x="170" y="268" width="4"  height="24" fill="#22d3ee" />
        <rect x="178" y="276" width="4"  height="16" fill="#22d3ee" />
        {/* "online" status dot, top-right of the screen */}
        <circle cx="220" cy="259" r="2.6" fill="#10b981">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* tiny floating UI badge — implies "platform health" without saying it */}
        <g transform="translate(245, 200)">
          <rect x="-22" y="-10" width="44" height="20" rx="6"
                fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
          <circle cx="-12" cy="0" r="3" fill="#10b981" />
          <rect x="-5" y="-3" width="20" height="2" fill="#94a3b8" />
          <rect x="-5" y="2"  width="14" height="2" fill="#cbd5e1" />
        </g>
      </svg>
    </div>
  );
}
