export type AlertSeverity = "critical" | "high" | "watch";
export type AlertDisposition = "open" | "acked" | "escalated" | "standdown";
export type AlertFeedKind = "SAT" | "NODE" | "OBS" | "MODEL";

export type AlertEvent = {
  stamp: string;
  note: string;
};

export type AlertFeed = {
  id: string;
  kind: AlertFeedKind;
  label: string;
  use: string;
};

export type AlertPrediction = {
  horizon: string;
  confidence: number;
  outlook: string;
  track: string;
  impact: string;
  next: string;
};

export type AlertItem = {
  id: string;
  title: string;
  region: string;
  severity: AlertSeverity;
  status: string;
  disposition: AlertDisposition;
  lat: number;
  lon: number;
  summary: string;
  layer: string;
  station: string;
  opened: string;
  slaMin: number;
  owner: string | null;
  satellites: string[];
  observations: string[];
  feeds: AlertFeed[];
  prediction: AlertPrediction;
  timeline: AlertEvent[];
};

export const alertQueue: AlertItem[] = [
  {
    id: "INC-1842",
    title: "Pacific thermal plume",
    region: "Central Pacific",
    severity: "critical",
    status: "PRIORITY",
    disposition: "open",
    lat: 19.4,
    lon: -155.6,
    summary:
      "Sea-surface temperature +4.8°C above seasonal baseline. Coral stress index elevated across Node 07 coverage.",
    layer: "TEMPERATURE / OCEAN",
    station: "NODE-07 PAC",
    opened: "22m",
    slaMin: 12,
    owner: null,
    satellites: ["AEON-33"],
    observations: ["TMP-PAC", "OCN-COR"],
    feeds: [
      { id: "AEON-33", kind: "SAT", label: "CALDERA", use: "SST radiometer lock on Node 07" },
      { id: "NODE-07 PAC", kind: "NODE", label: "PACIFIC NODE", use: "In-situ SST and coral stress" },
      { id: "TMP-PAC", kind: "OBS", label: "TEMPERATURE", use: "+4.8°C seasonal anomaly" },
      { id: "OCN-COR", kind: "OBS", label: "OCEAN", use: "DHW 8 bleach-alert band" },
      { id: "DHW-72", kind: "MODEL", label: "CORAL STRESS", use: "72-hour heating projection" },
    ],
    prediction: {
      horizon: "72 HOURS",
      confidence: 82,
      outlook:
        "The thermal plume holds or intensifies. Degree-heating weeks climb from 8 toward 11 if the ridge stays in place.",
      track: "Near-stationary mass with a slow westward bleed along the subtropical ridge.",
      impact: "High bleaching probability across Node 07 reef cells. Marine heat advisory remains in force.",
      next: "Keep CALDERA on stare. Recycle the SST grid at 00:20. Brief coastal nodes if DHW reaches 10.",
    },
    timeline: [
      { stamp: "14:02 UTC", note: "OPENED by GRID // SST ANOMALY THRESHOLD" },
      { stamp: "14:06 UTC", note: "NODE-07 CONFIRMS +4.8°C PLUME" },
      { stamp: "14:11 UTC", note: "CORAL DHW ENTERS ALERT BAND" },
      { stamp: "14:18 UTC", note: "PRIORITY FLAG // UNASSIGNED" },
    ],
  },
  {
    id: "INC-1840",
    title: "North Atlantic cyclone",
    region: "North Atlantic",
    severity: "high",
    status: "TRACKING",
    disposition: "open",
    lat: 27.8,
    lon: -66.4,
    summary:
      "Category 2 equivalent system. Track leans west-northwest. Coastal surge models updating every 12 minutes.",
    layer: "WEATHER",
    station: "NODE-ATL-03",
    opened: "41m",
    slaMin: 28,
    owner: null,
    satellites: ["AEON-41", "AEON-12"],
    observations: ["WX-14L"],
    feeds: [
      { id: "AEON-41", kind: "SAT", label: "SQUALL", use: "SAR / visible cyclone structure" },
      { id: "AEON-12", kind: "SAT", label: "AEGIR", use: "Altimeter sea-state and surge" },
      { id: "NODE-ATL-03", kind: "NODE", label: "ATLANTIC NODE", use: "Surface wind and pressure" },
      { id: "WX-14L", kind: "OBS", label: "WEATHER", use: "142 km/h tracked core" },
      { id: "SURGE-12", kind: "MODEL", label: "COASTAL SURGE", use: "12-minute inundation cycle" },
    ],
    prediction: {
      horizon: "48 HOURS",
      confidence: 74,
      outlook:
        "14L stays a Category 2 equivalent. Peak winds hold 130–155 km/h with a slight intensification window tonight.",
      track: "West-northwest, 18 km/h. Land-threat envelope covers the northern Leeward chain into the Bahamas.",
      impact: "Coastal run-up flagged. Shipping lanes inside 200 km should divert. No eyewall replacement yet.",
      next: "Hold SQUALL on the core. AEGIR ocean pass at 15:10. Recycle surge at 12-minute cadence.",
    },
    timeline: [
      { stamp: "13:44 UTC", note: "OPENED by SQUALL // 14L ORGANIZED" },
      { stamp: "13:51 UTC", note: "WIND 142 KM/H // CAT-2 EQUIVALENT" },
      { stamp: "14:03 UTC", note: "TRACK WEST-NORTHWEST LOCKED" },
      { stamp: "14:12 UTC", note: "SURGE MODEL CYCLE 12 MIN" },
    ],
  },
  {
    id: "INC-1837",
    title: "Japan trench cluster",
    region: "Northwest Pacific",
    severity: "watch",
    status: "ACKED",
    disposition: "acked",
    lat: 38.2,
    lon: 142.1,
    summary:
      "Shallow seismic swarm, 14 events in 6 hours. No tsunami signature. AEON-SAT 88 holding stare.",
    layer: "SEISMIC",
    station: "AEON-88 STARE",
    opened: "1h",
    slaMin: 45,
    owner: "AEON-OPS-01",
    satellites: ["AEON-88"],
    observations: ["SEI-JPN"],
    feeds: [
      { id: "AEON-88", kind: "SAT", label: "STARE", use: "Hi-res hold on the trench swarm" },
      { id: "AEON-88 STARE", kind: "NODE", label: "TRENCH CELL", use: "Seismic rate and Mmax" },
      { id: "SEI-JPN", kind: "OBS", label: "SEISMIC", use: "14 events / 6 hours, Mmax 4.1" },
      { id: "TSUNAMI-NUL", kind: "MODEL", label: "TSUNAMI SCREEN", use: "No propagating signature" },
    ],
    prediction: {
      horizon: "12 HOURS",
      confidence: 61,
      outlook:
        "Swarm rate should decay if Mmax stays below 4.5. A step-up past 5.0 would reopen tsunami screening.",
      track: "Shallow cluster, Japan trench. No migration along-strike in the last 90 minutes.",
      impact: "Local felt reports possible. No ocean-wide tsunami energy in the present envelope.",
      next: "Maintain stare hold. If a fifth M4+ lands inside 3 hours, escalate and arm the inundation desk.",
    },
    timeline: [
      { stamp: "13:08 UTC", note: "OPENED by STARE // SWARM RATE" },
      { stamp: "13:14 UTC", note: "14 EVENTS / 6 HOURS // MMAX 4.1" },
      { stamp: "13:22 UTC", note: "NO TSUNAMI SIGNATURE" },
      { stamp: "13:40 UTC", note: "ACKED // STARE HOLD REMAINS" },
    ],
  },
  {
    id: "INC-1831",
    title: "Sahel dust corridor",
    region: "West Africa",
    severity: "watch",
    status: "OBSERVE",
    disposition: "open",
    lat: 16.3,
    lon: -6.8,
    summary:
      "Aerosol optical depth 0.72. Trans-Atlantic transport likely within 36 hours. Air-quality layer armed.",
    layer: "AIR",
    station: "NODE-AFR-02",
    opened: "2h",
    slaMin: 60,
    owner: null,
    satellites: ["AEON-19"],
    observations: ["AIR-SAH"],
    feeds: [
      { id: "AEON-19", kind: "SAT", label: "HARMATTAN", use: "Aerosol optical depth corridor" },
      { id: "NODE-AFR-02", kind: "NODE", label: "SAHEL NODE", use: "Surface dust and visibility" },
      { id: "AIR-SAH", kind: "OBS", label: "AIR", use: "AOD 0.72 loaded plume" },
      { id: "TRAJ-36", kind: "MODEL", label: "TRANSPORT", use: "36-hour Atlantic trajectory" },
    ],
    prediction: {
      horizon: "36 HOURS",
      confidence: 79,
      outlook:
        "The dust corridor stays loaded. Trans-Atlantic transport remains likely, with AOD easing only after the next frontal push.",
      track: "West off the Sahel, then a subtropical Atlantic arc toward the Caribbean inbound gates.",
      impact: "Air-quality layer remains armed. Downwind nodes should expect hazy vis and elevated PM.",
      next: "Keep HARMATTAN on the corridor. Refresh trajectory at 18:00. Watch Caribbean inbound AOD.",
    },
    timeline: [
      { stamp: "12:18 UTC", note: "OPENED by HARMATTAN // AOD 0.72" },
      { stamp: "12:31 UTC", note: "DUST CORRIDOR LOADED" },
      { stamp: "12:55 UTC", note: "ATLANTIC TRANSPORT WINDOW 36h" },
      { stamp: "13:20 UTC", note: "AIR LAYER ARMED" },
    ],
  },
];
