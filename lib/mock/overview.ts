export type Severity = "critical" | "high" | "watch";

export type Incident = {
  id: string;
  title: string;
  region: string;
  severity: Severity;
  status: string;
  lat: number;
  lon: number;
  summary: string;
};

export const incidents: Incident[] = [
  {
    id: "INC-1842",
    title: "Pacific thermal plume",
    region: "Central Pacific",
    severity: "critical",
    status: "PRIORITY",
    lat: 19.4,
    lon: -155.6,
    summary:
      "Sea-surface temperature +4.8°C above seasonal baseline. Coral stress index elevated across Node 07 coverage.",
  },
  {
    id: "INC-1840",
    title: "North Atlantic cyclone",
    region: "North Atlantic",
    severity: "high",
    status: "TRACKING",
    lat: 27.8,
    lon: -66.4,
    summary:
      "Category 2 equivalent system. Track leans west-northwest. Coastal surge models updating every 12 minutes.",
  },
  {
    id: "INC-1837",
    title: "Japan trench cluster",
    region: "Northwest Pacific",
    severity: "watch",
    status: "MONITOR",
    lat: 38.2,
    lon: 142.1,
    summary:
      "Shallow seismic swarm, 14 events in 6 hours. No tsunami signature. AEON-SAT 88 holding stare.",
  },
  {
    id: "INC-1831",
    title: "Sahel dust corridor",
    region: "West Africa",
    severity: "watch",
    status: "OBSERVE",
    lat: 16.3,
    lon: -6.8,
    summary:
      "Aerosol optical depth 0.72. Trans-Atlantic transport likely within 36 hours. Air-quality layer armed.",
  },
];

export const overviewKpis = [
  { label: "SATELLITES", value: "412", hint: "ONLINE" },
  { label: "COVERAGE", value: "98.4%", hint: "GRID LOCK" },
  { label: "WATCH", value: "3", hint: "ACTIVE" },
  { label: "CRITICAL", value: "1", hint: "PRIORITY" },
  { label: "UPLINK", value: "STABLE", hint: "NODE-01" },
];

export const tickerItems = [
  "INC-1842 PACIFIC THERMAL PLUME · SST ANOMALY +4.8C",
  "CYCLONE 14L NORTH ATLANTIC · TRACKING WEST-NORTHWEST",
  "AEON-SAT 88 STARE HOLD · JAPAN TRENCH CLUSTER",
  "NODE 07 PACIFIC · COVERAGE 99.1%",
  "NO TSUNAMI SIGNATURE · NW PACIFIC",
  "AIR QUALITY LAYER ARMED · SAHEL CORRIDOR",
];
