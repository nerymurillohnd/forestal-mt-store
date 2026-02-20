/**
 * WholesaleMapIsland — Animated SVG world map with Honduras origin.
 * Flight paths arc from Honduras to 7 destination regions.
 * Uses CSS stroke-dashoffset animation with staggered timing.
 * Cycles every 6s. Respects prefers-reduced-motion.
 */
import { useEffect, useState } from "preact/hooks";

interface Props {
  eyebrow?: string;
  heading?: string;
  body: string;
  cta?: string;
}

interface Destination {
  id: string;
  label: string;
  cx: number;
  cy: number;
}

const ORIGIN = { cx: 205, cy: 240 };

const DESTINATIONS: Destination[] = [
  { id: "north-america", label: "North America", cx: 155, cy: 165 },
  { id: "latin-america", label: "Latin America", cx: 235, cy: 315 },
  { id: "europe", label: "Europe", cx: 472, cy: 138 },
  { id: "middle-east", label: "Middle East", cx: 558, cy: 208 },
  { id: "africa", label: "Africa", cx: 488, cy: 285 },
  { id: "asia-pacific", label: "Asia Pacific", cx: 732, cy: 228 },
  { id: "australia", label: "Australia", cx: 762, cy: 370 },
];

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.22;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

// Approximate dash length — long enough to cover any arc in the viewBox
const DASH_LENGTH = 1200;

export default function WholesaleMapIsland({
  eyebrow = "Wholesale & Global Supply",
  heading = "Partner With the Source",
  body,
  cta = "Request a Quote",
}: Props) {
  const [cycle, setCycle] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    if (mq.matches) return;

    const interval = setInterval(() => {
      setCycle((c) => c + 1);
    }, 6000) as unknown as number;

    return () => clearInterval(interval);
  }, []);

  return (
    <div class="flex flex-col overflow-hidden rounded-[2px]" style={{ background: "#0a2b0d" }}>
      {/* SVG Map */}
      <div class="relative w-full" style={{ paddingBottom: "50%" }}>
        <svg
          viewBox="0 0 1000 500"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          aria-label="World map showing Forestal MT wholesale supply routes from Honduras"
          role="img"
        >
          {/* CSS animations injected inline */}
          {!reducedMotion && (
            <style>{`
              @keyframes drawPath {
                to { stroke-dashoffset: 0; }
              }
              @keyframes dotPulse {
                0%   { opacity: 0; }
                60%  { opacity: 1; }
                100% { opacity: 1; }
              }
            `}</style>
          )}

          {/* Radial glow behind Honduras origin */}
          <defs>
            <radialGradient id="originGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F3C00D" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F3C00D" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Origin glow circle */}
          <circle cx={ORIGIN.cx} cy={ORIGIN.cy} r={36} fill="url(#originGlow)" />

          {/* Landmass silhouettes */}
          <g fill="#1a4a1e" stroke="none">
            {/* North America */}
            <path d="M80,80 L220,75 L240,100 L250,130 L230,160 L200,180 L185,210 L170,225 L145,230 L120,215 L100,200 L80,180 L70,150 L65,120 Z" />
            {/* Central America */}
            <path d="M185,210 L200,215 L210,235 L200,248 L185,240 Z" />
            {/* South America */}
            <path d="M190,255 L250,245 L290,265 L310,310 L305,360 L280,400 L250,420 L220,415 L200,390 L190,350 L185,300 Z" />
            {/* Europe */}
            <path d="M420,80 L510,75 L530,100 L520,130 L490,145 L460,140 L440,120 L420,100 Z" />
            {/* Africa */}
            <path d="M440,155 L520,150 L560,170 L570,220 L560,275 L540,315 L510,335 L480,330 L455,305 L445,260 L440,205 Z" />
            {/* Middle East */}
            <path d="M520,155 L580,150 L605,175 L600,210 L570,220 L540,210 Z" />
            {/* Asia */}
            <path d="M560,70 L800,65 L840,100 L850,150 L820,185 L760,200 L700,195 L650,185 L610,175 L580,155 L560,120 Z" />
            {/* SE Asia */}
            <path d="M710,200 L760,195 L780,220 L760,245 L725,240 L700,225 Z" />
            {/* Australia */}
            <path d="M720,330 L820,320 L860,345 L860,395 L830,415 L780,420 L740,405 L715,380 L715,350 Z" />
          </g>

          {/* Animated flight paths */}
          {!reducedMotion &&
            DESTINATIONS.map((dest, i) => {
              const d = arcPath(ORIGIN.cx, ORIGIN.cy, dest.cx, dest.cy);
              const delay = i * 300;
              return (
                <path
                  key={dest.id + "-" + cycle}
                  d={d}
                  fill="none"
                  stroke="#F3C00D"
                  strokeWidth={1.2}
                  strokeOpacity={0.7}
                  strokeLinecap="round"
                  strokeDasharray={DASH_LENGTH}
                  strokeDashoffset={DASH_LENGTH}
                  style={{
                    animation: `drawPath 1.4s ease-out ${delay}ms forwards`,
                  }}
                />
              );
            })}

          {/* Static paths for reduced-motion */}
          {reducedMotion &&
            DESTINATIONS.map((dest) => {
              const d = arcPath(ORIGIN.cx, ORIGIN.cy, dest.cx, dest.cy);
              return (
                <path
                  key={dest.id}
                  d={d}
                  fill="none"
                  stroke="#F3C00D"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                />
              );
            })}

          {/* Destination dots */}
          {DESTINATIONS.map((dest, i) => {
            const isHovered = hoveredId === dest.id;
            const delay = i * 300 + 1200;
            return (
              <g
                key={dest.id}
                onMouseEnter={() => setHoveredId(dest.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Outer ring */}
                <circle
                  cx={dest.cx}
                  cy={dest.cy}
                  r={isHovered ? 9 : 7}
                  fill="none"
                  stroke="#54B006"
                  strokeWidth={1.5}
                  strokeOpacity={isHovered ? 1 : 0.6}
                  style={{
                    transition: "all 0.2s ease",
                    ...(reducedMotion
                      ? {}
                      : {
                          animation: `dotPulse 0.6s ease-out ${delay}ms both`,
                        }),
                  }}
                />
                {/* Inner fill */}
                <circle
                  cx={dest.cx}
                  cy={dest.cy}
                  r={isHovered ? 5 : 3.5}
                  fill="#54B006"
                  fillOpacity={isHovered ? 1 : 0.85}
                  style={{ transition: "all 0.2s ease" }}
                />
                {/* Label — always visible on hover, hidden otherwise */}
                {isHovered && (
                  <text
                    x={dest.cx}
                    y={dest.cy - 14}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="var(--font-ui), sans-serif"
                    letterSpacing="0.06em"
                    fill="#ffffff"
                    fillOpacity={0.9}
                  >
                    {dest.label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Honduras origin dot */}
          <circle
            cx={ORIGIN.cx}
            cy={ORIGIN.cy}
            r={6}
            fill="#F3C00D"
            style={reducedMotion ? {} : { animation: "dotPulse 0.5s ease-out 0ms both" }}
          />
          <circle
            cx={ORIGIN.cx}
            cy={ORIGIN.cy}
            r={10}
            fill="none"
            stroke="#F3C00D"
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />

          {/* Honduras label */}
          <text
            x={ORIGIN.cx}
            y={ORIGIN.cy + 22}
            textAnchor="middle"
            fontSize={9}
            fontFamily="var(--font-heading), serif"
            letterSpacing="0.12em"
            fill="#F3C00D"
            fillOpacity={0.9}
          >
            HONDURAS
          </text>
        </svg>
      </div>

      {/* Text content below map */}
      <div class="flex flex-col items-center px-10 pb-12 pt-8 text-center">
        <p
          class="font-[family-name:var(--font-heading)] text-[11px] font-normal uppercase tracking-[0.35em]"
          style={{ color: "rgba(243,192,13,0.8)" }}
        >
          {eyebrow}
        </p>
        <h3 class="mt-4 font-[family-name:var(--font-display)] text-[1.5rem] font-normal text-white">
          {heading}
        </h3>
        <p
          class="mt-4 font-[family-name:var(--font-body)] text-[13px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {body}
        </p>
        <a
          href="/wholesale/"
          class="mx-auto mt-8 inline-block rounded-[3px] bg-gold px-8 py-3.5 font-[family-name:var(--font-ui)] text-[13px] font-semibold text-charcoal transition-all duration-300 hover:bg-gold/90"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
