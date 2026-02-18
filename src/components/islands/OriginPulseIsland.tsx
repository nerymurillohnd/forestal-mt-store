/**
 * OriginPulseIsland — Interactive Honduras map with origin points.
 * Preact island (client:visible) showing where products come from.
 * Pulsing dots on La Mosquitia + Olancho with tooltip cards on hover/tap.
 */
import { useState } from "preact/hooks";

interface OriginPoint {
  id: string;
  name: string;
  region: string;
  product: string;
  community: string;
  cx: number;
  cy: number;
}

const origins: OriginPoint[] = [
  {
    id: "mosquitia",
    name: "La Mosquitia",
    region: "Gracias a Dios",
    product: "Batana Oil",
    community: "Miskito",
    cx: 78,
    cy: 32,
  },
  {
    id: "olancho",
    name: "Olancho",
    region: "Olancho Department",
    product: "Herbs & Honey",
    community: "Mestizo & Maya",
    cx: 58,
    cy: 48,
  },
];

const destinations = ["North America", "Europe", "Asia", "Oceania"];

export default function OriginPulseIsland() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div class="mx-auto max-w-4xl">
      {/* SVG Map */}
      <div class="relative mx-auto max-w-2xl">
        <svg
          viewBox="0 0 100 70"
          class="w-full"
          role="img"
          aria-label="Map of Honduras showing product origin regions"
        >
          {/* Simplified Honduras outline */}
          <path
            d="M15,25 L20,20 L28,18 L35,15 L42,14 L50,16 L55,15 L62,18 L68,16 L75,20 L82,22 L88,28 L90,35 L85,40 L80,42 L75,48 L68,52 L60,55 L52,54 L45,50 L38,48 L30,45 L22,40 L18,35 L15,30 Z"
            fill="none"
            stroke="rgba(243, 192, 13, 0.2)"
            stroke-width="0.5"
          />
          {/* Filled subtle */}
          <path
            d="M15,25 L20,20 L28,18 L35,15 L42,14 L50,16 L55,15 L62,18 L68,16 L75,20 L82,22 L88,28 L90,35 L85,40 L80,42 L75,48 L68,52 L60,55 L52,54 L45,50 L38,48 L30,45 L22,40 L18,35 L15,30 Z"
            fill="rgba(243, 192, 13, 0.03)"
          />

          {/* Origin points */}
          {origins.map((origin) => (
            <g key={origin.id}>
              {/* Pulse ring */}
              <circle
                cx={origin.cx}
                cy={origin.cy}
                r="3"
                fill="none"
                stroke="rgba(243, 192, 13, 0.4)"
                stroke-width="0.3"
                class="animate-ping"
                style={{
                  animationDuration: "2.5s",
                  transformOrigin: `${origin.cx}px ${origin.cy}px`,
                }}
              />
              {/* Solid dot */}
              <circle
                cx={origin.cx}
                cy={origin.cy}
                r="1.5"
                fill="#F3C00D"
                class="cursor-pointer"
                onMouseEnter={() => setActive(origin.id)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(active === origin.id ? null : origin.id)}
              />
              {/* Label */}
              <text
                x={origin.cx}
                y={origin.cy - 4}
                text-anchor="middle"
                fill="rgba(255, 255, 255, 0.5)"
                font-size="2.5"
                font-family="var(--font-ui)"
              >
                {origin.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip cards */}
        {origins.map((origin) => (
          <div
            key={origin.id}
            class={`absolute z-20 transition-all duration-300 ${
              active === origin.id
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            style={{
              left: `${origin.cx}%`,
              top: `${origin.cy + 8}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div class="rounded-[2px] border border-white/10 bg-charcoal/95 px-5 py-4 backdrop-blur-md shadow-xl min-w-[180px]">
              <p
                class="text-[9px] font-normal uppercase tracking-[0.3em] text-gold/80"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {origin.region}
              </p>
              <p
                class="mt-1 text-[1rem] font-normal text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {origin.product}
              </p>
              <div class="mt-2 h-px w-6 bg-gold/20"></div>
              <p class="mt-2 text-[12px] text-white/50" style={{ fontFamily: "var(--font-body)" }}>
                {origin.community} communities
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Shipping destinations */}
      <div class="mt-10 flex flex-wrap items-center justify-center gap-6">
        {destinations.map((dest, i) => (
          <span
            key={dest}
            class="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/30"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {i > 0 && <span class="text-gold/20">&#9992;</span>}
            {dest}
          </span>
        ))}
      </div>

      {/* Origin cards */}
      <div class="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Batana Oil",
            region: "La Mosquitia",
            community: "Miskito",
            href: "/batana-oil/",
          },
          {
            title: "Jimerito Honey",
            region: "Olancho",
            community: "Maya Heritage",
            href: "/stingless-bee-honey/",
          },
          {
            title: "41 Herbs",
            region: "Olancho & Beyond",
            community: "Mestizo",
            href: "/traditional-herbs/",
          },
        ].map((card) => (
          <a
            key={card.title}
            href={card.href}
            class="group border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <p
              class="text-[9px] font-normal uppercase tracking-[0.3em] text-gold/60"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {card.community}
            </p>
            <p
              class="mt-2 text-[1rem] font-normal text-white transition-colors group-hover:text-gold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {card.title}
            </p>
            <p class="mt-1 text-[12px] text-white/40" style={{ fontFamily: "var(--font-body)" }}>
              {card.region}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
