"use client";

import type { Satellite, SatStatus } from "@/lib/mock/network";

const CX = 320;
const CY = 320;
const RINGS = [
  { rx: 148, ry: 86 },
  { rx: 214, ry: 124 },
  { rx: 278, ry: 162 },
] as const;
const TILT = (-18 * Math.PI) / 180;

const statusFill: Record<SatStatus, string> = {
  online: "#4ff4e2",
  degraded: "#f0b429",
  down: "#ff5a5a",
  stare: "#f0b429",
};

export function satPoint(ring: 0 | 1 | 2, angle: number) {
  const { rx, ry } = RINGS[ring];
  const a = (angle * Math.PI) / 180;
  const x = rx * Math.cos(a);
  const y = ry * Math.sin(a);
  return {
    x: CX + x * Math.cos(TILT) - y * Math.sin(TILT),
    y: CY + x * Math.sin(TILT) + y * Math.cos(TILT),
  };
}

export function OrbitSchematic({
  live,
  onSelect,
  satellites,
  selectedId,
}: {
  live: boolean;
  onSelect: (id: string) => void;
  satellites: Satellite[];
  selectedId: string;
}) {
  return (
    <svg
      aria-label="Constellation orbit schematic"
      className="h-full w-full"
      role="img"
      viewBox="50 55 540 530"
    >
      <defs>
        <radialGradient cx="38%" cy="32%" id="orbit-earth" r="70%">
          <stop offset="0%" stopColor="#1b8f86" />
          <stop offset="55%" stopColor="#0b3d44" />
          <stop offset="100%" stopColor="#041318" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} fill="#07131a" r="300" />
      <circle cx={CX} cy={CY} fill="url(#orbit-earth)" r="68" />

      <circle
        cx={CX}
        cy={CY}
        fill="none"
        r="82"
        stroke="rgba(79,244,226,0.25)"
        strokeWidth="1"
      />

      {RINGS.map((ring, index) => (
        <ellipse
          cx={CX}
          cy={CY}
          fill="none"
          key={ring.rx}
          rx={ring.rx}
          ry={ring.ry}
          stroke={index === 0 ? "rgba(79,244,226,0.4)" : "rgba(79,244,226,0.22)"}
          strokeDasharray={index === 2 ? "3 10" : "4 8"}
          strokeWidth="1"
          transform={`rotate(-18 ${CX} ${CY})`}
        />
      ))}

      <text fill="rgba(79,244,226,0.4)" fontFamily="monospace" fontSize="11" letterSpacing="3" x="282" y="328">
        EARTH
      </text>
      <text fill="rgba(79,244,226,0.28)" fontFamily="monospace" fontSize="10" letterSpacing="2" x="250" y="228">
        LEO
      </text>
      <text fill="rgba(79,244,226,0.28)" fontFamily="monospace" fontSize="10" letterSpacing="2" x="448" y="198">
        MEO
      </text>
      <text fill="rgba(79,244,226,0.28)" fontFamily="monospace" fontSize="10" letterSpacing="2" x="508" y="142">
        PNT
      </text>

      {live
        ? satellites.map((sat, index) => {
            const { x, y } = satPoint(sat.ring, sat.angle);
            const selected = sat.id === selectedId;
            const fill = statusFill[sat.status];

            return (
              <g key={sat.id} transform={`translate(${x} ${y})`}>
                <g
                  className="aeon-marker-in cursor-pointer"
                  onClick={() => onSelect(sat.id)}
                  style={{ animationDelay: `${140 + index * 70}ms` }}
                >
                  {selected ? (
                    <circle
                      className="aeon-radar"
                      fill="none"
                      r="9"
                      stroke={fill}
                      strokeWidth="1.4"
                    />
                  ) : null}
                  <circle fill={fill} opacity="0.22" r={selected ? 12 : 8} />
                  <circle fill={fill} r={selected ? 4.5 : 3} />
                  {selected ? (
                    <text
                      fill="#d8ecea"
                      fontFamily="monospace"
                      fontSize="10"
                      letterSpacing="1.2"
                      x="10"
                      y="-8"
                    >
                      {sat.id}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })
        : null}
    </svg>
  );
}
