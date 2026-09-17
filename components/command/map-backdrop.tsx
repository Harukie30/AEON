"use client";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 500;

export function project(lat: number, lon: number) {
  return {
    x: ((lon + 180) / 360) * MAP_WIDTH,
    y: ((90 - lat) / 180) * MAP_HEIGHT,
  };
}

export function MapBackdrop({ live }: { live: boolean }) {
  return (
    <>
      <rect fill="#07131a" height={MAP_HEIGHT} width={MAP_WIDTH} />
      {Array.from({ length: 12 }, (_, index) => (
        <line
          key={`v-${index}`}
          stroke="rgba(79,244,226,0.08)"
          x1={(index * MAP_WIDTH) / 12}
          x2={(index * MAP_WIDTH) / 12}
          y1="0"
          y2={MAP_HEIGHT}
        />
      ))}
      {Array.from({ length: 6 }, (_, index) => (
        <line
          key={`h-${index}`}
          stroke="rgba(79,244,226,0.08)"
          x1="0"
          x2={MAP_WIDTH}
          y1={(index * MAP_HEIGHT) / 6}
          y2={(index * MAP_HEIGHT) / 6}
        />
      ))}
      <g className={`aeon-map-land ${live ? "" : "aeon-map-acquiring"}`}>
        <path d="M118 78 198 66 278 92 262 152 228 204 188 232 168 208 138 158 68 108 88 76Z" />
        <path d="M188 232 222 242 208 268 182 250Z" />
        <path d="M208 268 252 274 262 348 238 404 206 392 188 332 194 282Z" />
        <path d="M318 52 368 46 382 84 344 98 308 80Z" />
        <path d="M468 88 534 82 548 124 508 148 468 142 452 108Z" />
        <path d="M478 158 562 152 584 232 542 326 488 334 458 258 468 188Z" />
        <path d="M538 68 786 86 834 142 804 204 718 192 672 158 592 172 538 118Z" />
        <path d="M778 298 864 292 878 352 822 374 776 338Z" />
        <path d="M80 458 920 458 920 492 80 492Z" />
      </g>
      <text fill="rgba(79,244,226,0.28)" fontFamily="monospace" fontSize="11" letterSpacing="4" x="70" y="210">
        PACIFIC
      </text>
      <text fill="rgba(79,244,226,0.28)" fontFamily="monospace" fontSize="11" letterSpacing="4" x="430" y="210">
        ATLANTIC
      </text>
      <text fill="rgba(79,244,226,0.28)" fontFamily="monospace" fontSize="11" letterSpacing="4" x="680" y="260">
        INDIAN
      </text>
    </>
  );
}
