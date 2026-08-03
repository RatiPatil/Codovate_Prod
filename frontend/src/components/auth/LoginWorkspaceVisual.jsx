import React from 'react';

/**
 * LoginWorkspaceVisual — Minimalist modern workspace SVG illustration
 * Matches the reference image with laptop showing C logo, potted plant, coffee cup, and soft drop shadows.
 */
export const LoginWorkspaceVisual = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[480px] drop-shadow-xl"
      >
        <defs>
          {/* Surface Shadow */}
          <radialGradient id="surfaceShadow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>

          {/* Laptop Lid Metallic Gradient */}
          <linearGradient id="laptopLid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Laptop Base Metallic Gradient */}
          <linearGradient id="laptopBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Logo Gradient */}
          <linearGradient id="brandLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Plant Pot Gradient */}
          <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Coffee Cup Lid Gradient */}
          <linearGradient id="cupLidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Surface Ambient Shadows */}
        <ellipse cx="300" cy="275" rx="240" ry="25" fill="url(#surfaceShadow)" />
        <ellipse cx="120" cy="275" rx="40" ry="10" fill="url(#surfaceShadow)" />
        <ellipse cx="460" cy="275" rx="35" ry="8" fill="url(#surfaceShadow)" />

        {/* ── LAPTOP ──────────────────────────────────────────────── */}
        {/* Laptop Lid Screen Back */}
        <path
          d="M 180 80 L 420 80 C 428 80 434 86 434 94 L 422 250 C 422 254 418 258 412 258 L 188 258 C 182 258 178 254 178 250 L 166 94 C 166 86 172 80 180 80 Z"
          fill="url(#laptopLid)"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Laptop Back Bezel Line */}
        <path
          d="M 172 90 L 428 90"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeOpacity="0.5"
        />

        {/* Codovate "C" Logo on Laptop Lid */}
        <g transform="translate(300, 165)">
          <path
            d="M 14 -18 C 5 -24 -12 -22 -20 -10 C -28 2 -26 20 -12 28 C -2 34 14 30 20 22 C 22 19 20 16 17 16 C 14 16 12 18 8 22 C 1 26 -11 23 -16 14 C -21 5 -18 -8 -10 -14 C -4 -18 7 -19 13 -14 C 16 -12 19 -13 20 -15 C 21 -17 17 -19 14 -18 Z"
            fill="url(#brandLogoGrad)"
          />
        </g>

        {/* Laptop Base Hinge */}
        <rect x="240" y="254" width="120" height="6" rx="3" fill="#94A3B8" />

        {/* Laptop Base Keyboard Deck */}
        <path
          d="M 120 260 C 120 258 122 257 125 257 L 475 257 C 478 257 480 258 480 260 L 495 272 C 495 276 490 279 485 279 L 115 279 C 110 279 105 276 105 272 Z"
          fill="url(#laptopBase)"
          stroke="#94A3B8"
          strokeWidth="1"
        />

        {/* Front Notch */}
        <path d="M 280 274 L 320 274 A 2 2 0 0 1 318 277 L 282 277 A 2 2 0 0 1 280 274 Z" fill="#64748B" />

        {/* ── POTTED PLANT ────────────────────────────────────────── */}
        {/* Pot */}
        <path d="M 100 230 L 140 230 L 132 272 C 131 275 128 277 124 277 L 116 277 C 112 277 109 275 108 272 Z" fill="url(#potGrad)" stroke="#CBD5E1" strokeWidth="1" />
        <ellipse cx="120" cy="230" rx="20" ry="4" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
        <ellipse cx="120" cy="230" rx="16" ry="3" fill="#78350F" />

        {/* Succulent Leaves */}
        <path d="M 120 230 Q 105 200 95 210 Q 110 225 120 230 Z" fill="#10B981" />
        <path d="M 120 230 Q 100 220 90 230 Q 105 238 120 230 Z" fill="#059669" />
        <path d="M 120 230 Q 135 200 145 208 Q 130 225 120 230 Z" fill="#34D399" />
        <path d="M 120 230 Q 140 220 150 228 Q 135 238 120 230 Z" fill="#10B981" />
        <path d="M 120 230 Q 120 185 112 195 Q 118 220 120 230 Z" fill="#059669" />
        <path d="M 120 230 Q 124 185 128 195 Q 122 220 120 230 Z" fill="#34D399" />

        {/* ── COFFEE CUP ─────────────────────────────────────────── */}
        {/* Cup Body */}
        <path d="M 445 215 L 475 215 L 468 270 C 467 273 464 275 461 275 L 459 275 C 456 275 453 273 452 270 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        {/* Sleeve */}
        <path d="M 447 232 L 473 232 L 470 252 L 450 252 Z" fill="#F1F5F9" />
        {/* Blue Rim Top Lid */}
        <path d="M 442 210 L 478 210 Q 480 215 475 217 L 445 217 Q 440 215 442 210 Z" fill="url(#cupLidGrad)" />
      </svg>
    </div>
  );
};

export default LoginWorkspaceVisual;
