"use client";

import type { Incident } from "@/lib/mock/overview";
import { MAP_HEIGHT, MAP_WIDTH, MapBackdrop, project } from "@/components/command/map-backdrop";

const severityFill: Record<Incident["severity"], string> = {
  critical: "#ff5a5a",
  high: "#f0b429",
  watch: "#4ff4e2",
};

export function WorldMap({
  incidents,
  live,
  onSelect,
  selectedId,
}: {
  incidents: Incident[];
  live: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  return (
    <svg
      aria-label="Global observation map"
      className="h-full w-full"
      role="img"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    >
      <MapBackdrop live={live} />
      {live
        ? incidents.map((incident, index) => {
            const { x, y } = project(incident.lat, incident.lon);
            const selected = incident.id === selectedId;
            const fill = severityFill[incident.severity];

            return (
              <g key={incident.id} transform={`translate(${x} ${y})`}>
                <g
                  className="aeon-marker-in cursor-pointer"
                  onClick={() => onSelect(incident.id)}
                  style={{ animationDelay: `${180 + index * 120}ms` }}
                >
                  {selected ? (
                    <circle
                      className="aeon-radar"
                      fill="none"
                      r="8"
                      stroke={fill}
                      strokeWidth="1.5"
                    />
                  ) : null}
                  <circle fill={fill} opacity="0.22" r={selected ? 14 : 10} />
                  <circle fill={fill} r={selected ? 5 : 3.5} />
                  {selected ? (
                    <text
                      fill="#d8ecea"
                      fontFamily="monospace"
                      fontSize="10"
                      letterSpacing="1.4"
                      x="10"
                      y="-10"
                    >
                      {incident.id}
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
