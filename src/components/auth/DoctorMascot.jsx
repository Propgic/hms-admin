// Inline SVG cartoon mascot — a friendly doctor character. Pure SVG, no
// external dependency, no PNG. The eyes track the user's pointer so the
// form feels alive without a heavy animation library.

import { useEffect, useRef, useState } from 'react';

export default function DoctorMascot({ size = 320, mood = 'happy' }) {
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
        // Clamp pupil offset so eyes don't escape the eye sockets.
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
          <linearGradient id="coatGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fde7d3" />
            <stop offset="100%" stopColor="#f7d2b3" />
          </linearGradient>
          <linearGradient id="hairGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>

        {/* soft halo */}
        <circle cx="160" cy="160" r="146" fill="url(#bg)" opacity="0.18" />
        <circle cx="160" cy="160" r="120" fill="#ffffff" opacity="0.06" />

        {/* shoulders / coat */}
        <path d="M40 290 C 60 230, 110 215, 160 215 C 210 215, 260 230, 280 290 Z"
              fill="url(#coatGrad)" stroke="#cbd5e1" strokeWidth="2" />
        {/* coat collar */}
        <path d="M120 235 L 160 270 L 200 235 L 190 230 L 160 245 L 130 230 Z"
              fill="#1e293b" />
        {/* tie */}
        <path d="M156 248 L 164 248 L 168 280 L 160 296 L 152 280 Z" fill="#2563eb" />

        {/* neck */}
        <rect x="142" y="195" width="36" height="30" rx="8" fill="url(#skinGrad)" />

        {/* head */}
        <ellipse cx="160" cy="135" rx="78" ry="86" fill="url(#skinGrad)" stroke="#e8b390" strokeWidth="1.5" />

        {/* hair */}
        <path d="M85 110 C 90 65, 130 45, 160 45 C 195 45, 232 65, 235 115 C 220 95, 195 90, 175 100 C 155 90, 120 95, 95 115 Z"
              fill="url(#hairGrad)" />

        {/* ears */}
        <ellipse cx="84" cy="140" rx="10" ry="14" fill="url(#skinGrad)" stroke="#e8b390" strokeWidth="1.2" />
        <ellipse cx="236" cy="140" rx="10" ry="14" fill="url(#skinGrad)" stroke="#e8b390" strokeWidth="1.2" />

        {/* glasses */}
        <g stroke="#0f172a" strokeWidth="3" fill="none">
          <circle cx="125" cy="142" r="20" />
          <circle cx="195" cy="142" r="20" />
          <line x1="145" y1="142" x2="175" y2="142" />
          <line x1="105" y1="138" x2="92" y2="135" />
          <line x1="215" y1="138" x2="228" y2="135" />
        </g>
        {/* glass tint */}
        <circle cx="125" cy="142" r="18" fill="#dbeafe" opacity="0.35" />
        <circle cx="195" cy="142" r="18" fill="#dbeafe" opacity="0.35" />

        {/* eye whites */}
        <ellipse cx="125" cy="142" rx="11" ry={blink ? 1 : 9} fill="#ffffff" />
        <ellipse cx="195" cy="142" rx="11" ry={blink ? 1 : 9} fill="#ffffff" />
        {/* pupils — track pointer */}
        {!blink && (
          <>
            <circle cx={125 + eye.x} cy={142 + eye.y} r="4.5" fill="#0f172a" />
            <circle cx={195 + eye.x} cy={142 + eye.y} r="4.5" fill="#0f172a" />
            <circle cx={125 + eye.x - 1.5} cy={142 + eye.y - 1.5} r="1.4" fill="#ffffff" />
            <circle cx={195 + eye.x - 1.5} cy={142 + eye.y - 1.5} r="1.4" fill="#ffffff" />
          </>
        )}

        {/* eyebrows */}
        <path d="M108 122 Q 125 116, 142 122" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M178 122 Q 195 116, 212 122" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* nose */}
        <path d="M160 152 Q 156 170, 160 180 Q 164 175, 168 178" stroke="#c98a66" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* cheeks */}
        <circle cx="105" cy="172" r="14" fill="url(#cheek)" />
        <circle cx="215" cy="172" r="14" fill="url(#cheek)" />

        {/* mouth */}
        {smile ? (
          <path d="M138 196 Q 160 214, 182 196" stroke="#0f172a" strokeWidth="3.5" fill="#9c2929" strokeLinejoin="round" />
        ) : (
          <line x1="142" y1="200" x2="178" y2="200" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* stethoscope */}
        <g fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round">
          <path d="M120 250 C 110 270, 110 290, 130 295" />
          <path d="M200 250 C 210 270, 210 290, 190 295" />
          <path d="M130 295 C 145 305, 175 305, 190 295" />
        </g>
        <circle cx="160" cy="305" r="10" fill="#475569" stroke="#0f172a" strokeWidth="2.5" />
        <circle cx="160" cy="305" r="4" fill="#1e293b" />

        {/* badge / id card */}
        <g>
          <rect x="208" y="252" width="32" height="40" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="212" y="258" width="24" height="3" fill="#2563eb" />
          <rect x="212" y="265" width="18" height="2" fill="#cbd5e1" />
          <rect x="212" y="270" width="22" height="2" fill="#cbd5e1" />
          <circle cx="224" cy="282" r="5" fill="#4338ca" />
        </g>
      </svg>
    </div>
  );
}
