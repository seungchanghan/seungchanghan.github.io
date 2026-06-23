import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {gsap} from "gsap";
import funBgCoffeeUrl from "./assets/fun-bg-coffee.webp";
import funBgEquivalentsUrl from "./assets/fun-bg-equivalents.webp";
import funBgThermoUrl from "./assets/fun-bg-thermo.webp";
import funBgTimeUrl from "./assets/fun-bg-time.webp";
import funBgTpdUrl from "./assets/fun-bg-tpd.webp";
import contactBackgroundUrl from "./assets/contact-bg.webp";
import heroBackgroundUrl from "../user-input/main.webp";

const pages = [
  {id: "home", label: "Home"},
  {id: "about", label: "About me"},
  {id: "research", label: "Research"},
  {id: "fun", label: "For fun"},
  {id: "contact", label: "Contact"}
];

const profileLinks = {
  email: "moonspath@korea.ac.kr",
  linkedin: "https://www.linkedin.com/in/seungchang-han-8761b9414",
  github: "https://github.com/seungchanghan"
};

const contactLocation =
  "Korea University, 145, Anam-ro, Seongbuk-gu, Seoul, Republic of Korea";

const profileDetails = [
  {
    label: "Role",
    value: "Ph.D. Student in Physical Chemistry and Integrative Data Science"
  },
  {
    label: "Institution",
    value: (
      <>
        <a href="https://www.ringelab.com/" target="_blank" rel="noreferrer">
          Ringe Lab
        </a>
        <br />
        Department of Chemistry, Korea University
      </>
    )
  },
  {label: "Location", value: "Seoul, South Korea"},
  {label: "Languages", value: "Korean, English"}
];

const education = [
  {
    institution: "Korea University",
    degree: "Ph.D. Student, Physical Chemistry and Integrative Data Science",
    period: "September 2022 - present"
  },
  {
    institution: "Pusan National University",
    degree: "B.S., Chemistry",
    period: "March 2020 - February 2022"
  }
];

const experience = [
  {
    organization: "Korea University",
    role: "Lecturer",
    period: "March 2025 - February 2026",
    notes: ["University lecturing", "Undergraduate teaching"]
  },
  {
    organization: "Institute for Basic Science (IBS)",
    role: "Researcher",
    period: "March 2023 - August 2023",
    notes: [
      "Quantum chemical modeling of interfaces using density functional theory",
      "Machine learning approaches for canonical algorithms"
    ]
  }
];

const awards = [
  {
    period: "January 2025",
    title: "Excellent Poster Award",
    event: "2025 KU BK21 Chem Fair"
  },
  {
    period: "January 2024",
    title: "Excellent Poster Presentation Award",
    event: "2024 KIM-CMS Winter Symposium"
  }
];

const researchAreas = [
  {
    number: "01",
    title: (
      <>
        Catalytic interfaces and ECO<sub>2</sub>RR
      </>
    ),
    description:
      "I study adsorption and electrochemical interfacial structure in CO2 reduction, with attention to copper and broader catalytic material systems.",
    tags: ["Electrochemistry", "Adsorption", "Interfaces"],
    toolkit: ["VASP", "Quantum ESPRESSO", "CatKit"]
  },
  {
    number: "02",
    title: "Beyond conventional DFT",
    description:
      "A central question is where standard density-functional approximations fail, and how GW, RPA, QMC, and related many-body methods can sharpen physical understanding.",
    tags: ["Many-body theory", "GW", "RPA", "QMC"],
    toolkit: ["VASP", "FHI-aims", "CASINO"]
  },
  {
    number: "03",
    title: "Statistical atomistic modeling",
    description:
      "Static structures are often too narrow for realistic interfaces, so I use statistical sampling and Monte Carlo approaches to describe configurational complexity.",
    tags: ["Monte Carlo", "Surface design", "Sampling"],
    toolkit: ["ASE", "Python"]
  },
  {
    number: "04",
    title: "Machine-learned interatomic potentials",
    description:
      "MLIPs provide a practical route from first-principles data to larger-scale simulations, while requiring careful tests for extrapolation and hidden failure modes.",
    tags: ["MLIP", "Validation", "Scaling"],
    toolkit: ["GAP", "MACE", "MTP"]
  },
  {
    number: "05",
    title: "Catalytic descriptors and interpretation",
    description:
      "I use descriptor models to interpret catalytic activity, emphasizing physically grounded explanations over purely predictive correlations.",
    tags: ["Descriptors", "Activity", "Reproducibility"]
  }
];

const publications = [
  {
    titleText:
      "Peaks and pitfalls of electrocatalytic CO2 reduction descriptor models",
    title: (
      <>
        Peaks and pitfalls of electrocatalytic CO<sub>2</sub> reduction
        descriptor models
      </>
    ),
    authors: (
      <>
        Beomil Kim†, <strong>Seungchang Han†</strong>, Suneon Wang†, Stefan
        Ringe and Jihun Oh
      </>
    ),
    journal: "Nature Catalysis",
    volume: "9",
    pages: "471-481",
    year: "2026",
    doi: "10.1038/s41929-026-01526-7",
    context:
      "Examines where descriptor models clarify electrochemical CO2 reduction trends, and where they can mislead without careful physical interpretation."
  }
];

const defaultIntakes = [{id: 1, start: "07:00", end: "07:10", dose: 180}];
const MAX_MEETING_PAYLOAD_LENGTH = 12000;
const MAX_MEETING_PARTICIPANTS = 24;
const MAX_MEETING_SLOTS_PER_PERSON = 16;
const MAX_MEETING_NAME_LENGTH = 80;
const fallbackTimeZones = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland"
];

function getSupportedTimeZones() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return fallbackTimeZones;
  }
}

const supportedTimeZones = getSupportedTimeZones();

const energyUnits = [
  "J",
  "eV",
  "Eh",
  "J/mol",
  "kJ/mol",
  "kcal/mol",
  "cm^-1",
  "THz",
  "Hz",
  "nm",
  "K"
];

const energyOutputMeta = {
  J: "Energy per particle in SI joules.",
  eV: "Electronvolt per particle.",
  Eh: "Hartree atomic unit of energy.",
  "J/mol": "Molar energy after multiplying by Avogadro's constant.",
  "kJ/mol": "Molar energy in kilojoules.",
  "kcal/mol": "Thermochemical kilocalories per mole.",
  "cm^-1": "Spectroscopic wavenumber from E = h c nu-tilde.",
  THz: "Temporal frequency equivalent from E = h nu.",
  Hz: "Frequency equivalent in cycles per second.",
  nm: "Photon wavelength from lambda = h c / |E|.",
  K: "Temperature equivalent from E = kB T.",
  "E/kBT": "Dimensionless thermal energy at the selected T."
};

const conversionSources = [
  "NIST/CODATA 2022 constants: c, h, kB, NA, e.",
  "Hartree energy: CODATA 2022 Eh = 27.211386245981 eV.",
  "Thermochemical calorie: 1 cal = 4.184 J."
];

const symmetryOptions = [
  {label: "C1 / Cs / Ci", value: 1},
  {label: "Cinfv", value: 1},
  {label: "Dinfh", value: 2},
  {label: "C2 / C2v", value: 2},
  {label: "C3v", value: 3},
  {label: "D2h / C4v", value: 4},
  {label: "D3h / D3d", value: 6},
  {label: "D4h", value: 8},
  {label: "D5h", value: 10},
  {label: "Td", value: 12},
  {label: "Oh", value: 24},
  {label: "Ih", value: 60}
];

const C_LIGHT = 299792458;
const H_PLANCK = 6.62607015e-34;
const K_BOLTZMANN = 1.380649e-23;
const N_AVOGADRO = 6.02214076e23;
const EV_J = 1.602176634e-19;
const HARTREE_EV = 27.211386245981;
const HARTREE_J = HARTREE_EV * EV_J;
const KCAL_J = 4184;
const R_GAS = N_AVOGADRO * K_BOLTZMANN;
const EV_MOLAR_J = EV_J * N_AVOGADRO;
const K_B_EV = K_BOLTZMANN / EV_J;

function formatScientific(value, digits = 6) {
  if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
  if (
    Math.abs(value) >= 1e5 ||
    (Math.abs(value) > 0 && Math.abs(value) < 1e-3)
  ) {
    return value.toExponential(digits);
  }
  return Number(value.toPrecision(digits + 1)).toString();
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toJoulePerParticle(value, unit) {
  if (unit === "J") return value;
  if (unit === "eV") return value * EV_J;
  if (unit === "Eh") return value * HARTREE_J;
  if (unit === "J/mol") return value / N_AVOGADRO;
  if (unit === "kJ/mol") return (value * 1000) / N_AVOGADRO;
  if (unit === "kcal/mol") return (value * KCAL_J) / N_AVOGADRO;
  if (unit === "cm^-1") return H_PLANCK * C_LIGHT * value * 100;
  if (unit === "THz") return H_PLANCK * value * 1e12;
  if (unit === "Hz") return H_PLANCK * value;
  if (unit === "nm") return (H_PLANCK * C_LIGHT) / (value * 1e-9);
  if (unit === "K") return K_BOLTZMANN * value;
  return 0;
}

function convertEnergyValues(value, unit, temperature) {
  const energy = toJoulePerParticle(value, unit);
  const absEnergy = Math.abs(energy);
  const wavelength = energy === 0 ? Infinity : (H_PLANCK * C_LIGHT) / absEnergy;
  const boltzmannRatio = Math.exp(-(energy / (K_BOLTZMANN * temperature)));
  const boltzmannDenominator = 1 + boltzmannRatio;

  return {
    rows: [
      ["J", energy],
      ["eV", energy / EV_J],
      ["Eh", energy / HARTREE_J],
      ["J/mol", energy * N_AVOGADRO],
      ["kJ/mol", (energy * N_AVOGADRO) / 1000],
      ["kcal/mol", (energy * N_AVOGADRO) / KCAL_J],
      ["cm^-1", energy / (H_PLANCK * C_LIGHT * 100)],
      ["THz", energy / H_PLANCK / 1e12],
      ["Hz", energy / H_PLANCK],
      ["nm", wavelength / 1e-9],
      ["K", energy / K_BOLTZMANN],
      ["E/kBT", energy / (K_BOLTZMANN * temperature)]
    ],
    boltzmann: [
      ["N high / N low", boltzmannRatio],
      ["p low", 1 / boltzmannDenominator],
      ["p high", boltzmannRatio / boltzmannDenominator]
    ],
    note:
      energy < 0
        ? "Negative energy: frequency and wavenumber stay signed; wavelength uses |E|."
        : ""
  };
}

function calculateRedhead({peakTemperature, heatingRate, betaUnit, prefactor}) {
  const tp = parseNumber(peakTemperature);
  const beta =
    betaUnit === "K/min"
      ? parseNumber(heatingRate) / 60
      : parseNumber(heatingRate);
  if (tp <= 0 || beta <= 0) {
    return {
      rows: [],
      details: [],
      notes: ["Peak temperature and heating rate must both be positive."]
    };
  }
  const nu =
    prefactor === "" ? (K_BOLTZMANN * tp) / H_PLANCK : parseNumber(prefactor);
  if (nu <= 0) {
    return {
      rows: [],
      details: [],
      notes: ["Prefactor must be positive when supplied."]
    };
  }
  const logArgument = (nu * tp) / beta;
  const lnArgument = Math.log(logArgument);
  const eJmol = R_GAS * tp * (Math.log(logArgument) - 3.64);

  return {
    rows: [
      ["Edes / kJ mol^-1", eJmol / 1000],
      ["Edes / eV molecule^-1", eJmol / EV_MOLAR_J],
      ["Edes / kcal mol^-1", eJmol / KCAL_J],
      ["Edes / J mol^-1", eJmol]
    ],
    details: [
      ["Tp / K", tp],
      ["beta / K s^-1", beta],
      ["nu / s^-1", nu],
      ["ln(nu Tp / beta)", lnArgument]
    ],
    notes: [
      prefactor === ""
        ? "Prefactor was set by nu = kB Tp / h."
        : "Prefactor was supplied by the user; nu = kB Tp / h was not used.",
      ...(eJmol <= 0
        ? [
            "Computed Edes is non-positive. Check Tp, beta, nu, and first-order Redhead applicability."
          ]
        : [])
    ]
  };
}

function parseFrequencies(text) {
  return text
    .replaceAll(",", " ")
    .replaceAll(";", " ")
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

function frequencyToCmInv(value, unit) {
  if (unit === "cm^-1") return value;
  if (unit === "THz") return (value * 1e12) / (C_LIGHT * 100);
  return value / (C_LIGHT * 100);
}

function cmInvToEv(value) {
  return (H_PLANCK * C_LIGHT * 100 * value) / EV_J;
}

function safeLog(value) {
  return value > 0 ? Math.log(value) : Number.NaN;
}

function parseNumberList(text) {
  return text
    .replaceAll(",", " ")
    .replaceAll(";", " ")
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

function vibrationalThermo(frequencies, unit, temperature) {
  const inputModes = parseFrequencies(frequencies);
  const realModes = inputModes
    .filter(value => value >= 0)
    .map(value => frequencyToCmInv(value, unit))
    .filter(value => value >= 0);
  const vibEv = realModes.map(cmInvToEv);
  const zpe = 0.5 * vibEv.reduce((sum, value) => sum + value, 0);
  const thermal = vibEv.reduce((sum, value) => {
    const x = value / (K_B_EV * temperature);
    if (x > 700) return sum;
    return sum + value / Math.expm1(x);
  }, 0);
  const entropy = vibEv.reduce((sum, value) => {
    const x = value / (K_B_EV * temperature);
    if (x > 700) return sum;
    return sum + K_B_EV * (x / Math.expm1(x) - Math.log1p(-Math.exp(-x)));
  }, 0);

  return {
    inputCount: inputModes.length,
    modeCount: realModes.length,
    ignoredCount: inputModes.filter(value => value < 0).length,
    realModes,
    vibEv,
    zpe,
    thermal,
    internalEnergy: zpe + thermal,
    entropy,
    ts: temperature * entropy
  };
}

function calculateThermochemistry({
  mode,
  frequencies,
  unit,
  temperature,
  pressure,
  symmetryNumber,
  molecularMass,
  geometry,
  rotationalTemperatures,
  spin
}) {
  if (temperature <= 0) {
    return {modeCount: 0, rows: [], notes: ["Temperature must be positive."]};
  }
  const vib = vibrationalThermo(frequencies, unit, temperature);
  if (vib.modeCount === 0) {
    return {
      modeCount: 0,
      rows: [],
      notes: ["No real vibrational modes remain."]
    };
  }
  const notes = [
    "Vibrational energies use epsilon = h c nu-tilde and are evaluated in eV.",
    ...(vib.ignoredCount > 0
      ? [`Ignored ${vib.ignoredCount} negative/imaginary mode(s).`]
      : [])
  ];

  if (mode === "harmonic") {
    const thermalU = vib.thermal;
    const fNoZpe = thermalU - vib.ts;
    const fullF = vib.zpe + fNoZpe;
    return {
      mode,
      modeCount: vib.modeCount,
      rows: [
        ["ZPE correction / eV", vib.zpe],
        ["Thermal U, excludes ZPE / eV", thermalU],
        ["T S / eV", vib.ts],
        ["Thermal F, excludes ZPE / eV", fNoZpe],
        ["Total F correction, includes ZPE / eV", fullF],
        ["S / eV K^-1", vib.entropy]
      ],
      notes: [
        ...notes,
        "Harmonic mode treats every retained real mode as an adsorbate vibrational oscillator and reports Helmholtz F."
      ]
    };
  }

  const pressurePa = pressure;
  const sigma =
    geometry === "monatomic" ? 1 : Math.max(1, Number(symmetryNumber));
  const massKg = (molecularMass * 1e-3) / N_AVOGADRO;
  const spinMultiplicity = 2 * spin + 1;
  const rotationalTheta = parseNumberList(rotationalTemperatures);
  const validIdealInputs =
    pressurePa > 0 &&
    molecularMass > 0 &&
    sigma > 0 &&
    spinMultiplicity > 0 &&
    (geometry === "monatomic" ||
      (geometry === "linear" && rotationalTheta.length >= 1) ||
      (geometry === "nonlinear" && rotationalTheta.length >= 3));

  if (!validIdealInputs) {
    return {
      mode,
      modeCount: vib.modeCount,
      rows: [],
      notes: [
        ...notes,
        "Ideal-gas E -> G requires positive pressure, molecular mass, symmetry number, spin multiplicity, and rotational temperature input for the selected geometry."
      ]
    };
  }

  const qTransVolume =
    Math.pow(
      (2 * Math.PI * massKg * K_BOLTZMANN * temperature) / H_PLANCK ** 2,
      1.5
    ) *
    ((K_BOLTZMANN * temperature) / pressurePa);
  const sTrans = K_B_EV * (safeLog(qTransVolume) + 2.5);
  const uTrans = 1.5 * K_B_EV * temperature;

  let uRot = 0;
  let sRot = 0;
  if (geometry === "linear") {
    uRot = K_B_EV * temperature;
    sRot = K_B_EV * (safeLog(temperature / (sigma * rotationalTheta[0])) + 1);
  }
  if (geometry === "nonlinear") {
    const thetaProduct =
      rotationalTheta[0] * rotationalTheta[1] * rotationalTheta[2];
    uRot = 1.5 * K_B_EV * temperature;
    sRot =
      K_B_EV *
      (safeLog(
        (Math.sqrt(Math.PI) * temperature ** 1.5) /
          (sigma * Math.sqrt(thetaProduct))
      ) +
        1.5);
  }

  const sElec = K_B_EV * safeLog(spinMultiplicity);
  const thermalH = vib.thermal + uTrans + uRot + K_B_EV * temperature;
  const entropy = vib.entropy + sTrans + sRot + sElec;
  const ts = temperature * entropy;
  const gNoZpe = thermalH - ts;
  const fullG = vib.zpe + gNoZpe;
  const symmetryPenalty = K_B_EV * temperature * Math.log(sigma);

  return {
    mode,
    modeCount: vib.modeCount,
    rows: [
      ["ZPE correction / eV", vib.zpe],
      ["Thermal H, excludes ZPE / eV", thermalH],
      ["T S / eV", ts],
      ["Thermal G, excludes ZPE / eV", gNoZpe],
      ["Total G correction, includes ZPE / eV", fullG],
      ["Symmetry penalty, kBT ln sigma / eV", symmetryPenalty],
      ["S / eV K^-1", entropy],
      ["translation U / eV", uTrans],
      ["rotation U / eV", uRot]
    ],
    notes: [
      ...notes,
      "Ideal-gas result includes translational, rotational, vibrational, symmetry, and spin terms. Molecular mass and rotational temperature inputs replace the ASE Atoms-derived mass and inertia."
    ]
  };
}

function getNextMonday() {
  const date = new Date();
  const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function encodeMeetingData(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function isValidDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const {year, month, day} = parseDateValue(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimeValue(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function normalizeMeetingSlot(slot) {
  if (
    !slot ||
    !isValidDateValue(slot.date) ||
    !isValidTimeValue(slot.start) ||
    !isValidTimeValue(slot.end) ||
    slot.start === slot.end
  ) {
    return null;
  }
  return {
    date: slot.date,
    start: slot.start,
    end: slot.end
  };
}

function normalizeMeetingData(value) {
  if (
    value?.version !== 2 ||
    !Array.isArray(value.participants) ||
    value.participants.length > MAX_MEETING_PARTICIPANTS
  ) {
    return null;
  }

  const participants = [];
  for (const participant of value.participants) {
    const name = String(participant?.name ?? "")
      .trim()
      .slice(0, MAX_MEETING_NAME_LENGTH);
    const timeZone = String(participant?.timeZone ?? "");
    if (
      !name ||
      !isValidTimeZone(timeZone) ||
      !Array.isArray(participant?.slots) ||
      participant.slots.length === 0 ||
      participant.slots.length > MAX_MEETING_SLOTS_PER_PERSON
    ) {
      return null;
    }
    const slots = participant.slots.map(normalizeMeetingSlot).filter(Boolean);
    if (slots.length !== participant.slots.length) return null;
    participants.push({
      id: String(participant.id ?? participants.length).slice(0, 80),
      name,
      timeZone,
      slots
    });
  }

  return {version: 2, participants};
}

function decodeMeetingData(value) {
  try {
    if (value.length > MAX_MEETING_PAYLOAD_LENGTH) return null;
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (
      ![1, 2].includes(parsed?.version) ||
      !Array.isArray(parsed.participants)
    ) {
      return null;
    }
    if (parsed.version === 2) return normalizeMeetingData(parsed);
    if (typeof parsed.weekStart !== "string") return null;

    return normalizeMeetingData({
      version: 2,
      participants: parsed.participants.map(participant => ({
        ...participant,
        slots: participant.slots.map(slot => ({
          date: offsetDate(parsed.weekStart, Number(slot.day)),
          start: slot.start,
          end: slot.end
        }))
      }))
    });
  } catch {
    return null;
  }
}

function getMeetingDataFromUrl() {
  const encoded = new URL(window.location.href).searchParams.get("meeting");
  return encoded ? decodeMeetingData(encoded) : null;
}

function clearMeetingDataFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("meeting")) return;
  url.searchParams.delete("meeting");
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

function getSavedMeetingTimeZone(fallback) {
  try {
    return window.localStorage.getItem("meeting-time-zone") || fallback;
  } catch {
    return fallback;
  }
}

function isValidTimeZone(value) {
  try {
    new Intl.DateTimeFormat("en-US", {timeZone: value}).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function TimeZoneCombobox({value, onChange, options}) {
  const [isOpen, setIsOpen] = useState(false);
  const comboRef = useRef(null);
  const normalizedValue = value.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedValue) return options.slice(0, 80);
    return options
      .filter(zone =>
        zone.replaceAll("_", " ").toLowerCase().includes(normalizedValue)
      )
      .slice(0, 80);
  }, [normalizedValue, options]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = event => {
      if (!comboRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const chooseTimeZone = zone => {
    onChange(zone);
    setIsOpen(false);
  };

  return (
    <div className="timezone-combobox" ref={comboRef}>
      <div className="timezone-input-row">
        <input
          type="text"
          value={value}
          placeholder="Search or choose time zone"
          required
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="meeting-time-zone-options"
          onFocus={() => setIsOpen(true)}
          onChange={event => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
        />
        <button
          className="timezone-menu-button"
          type="button"
          aria-label="Show time zones"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(open => !open)}
        >
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
      {isOpen && (
        <div
          className="timezone-options"
          id="meeting-time-zone-options"
          role="listbox"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(zone => (
              <button
                className="timezone-option"
                type="button"
                role="option"
                aria-selected={zone === value}
                key={zone}
                onMouseDown={event => event.preventDefault()}
                onClick={() => chooseTimeZone(zone)}
              >
                {zone}
              </button>
            ))
          ) : (
            <span className="timezone-empty">No matching time zones</span>
          )}
        </div>
      )}
    </div>
  );
}

function formatCalendarDate(dateValue) {
  if (!dateValue) return "Choose a date";
  const {year, month, day} = parseDateValue(dateValue);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function getZonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );
}

function zonedDateTimeToUtc({year, month, day, hour, minute}, timeZone) {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getZonedParts(new Date(guess), timeZone);
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    guess -= represented - target;
  }

  return guess;
}

function parseDateValue(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return {year, month, day};
}

function offsetDate(dateValue, dayOffset) {
  const {year, month, day} = parseDateValue(dateValue);
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function getDateParts(dateValue, dayOffset = 0) {
  const {year, month, day} = parseDateValue(dateValue);
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function getPainScore(interval, timeZone) {
  const midpoint = new Date((interval.start + interval.end) / 2);
  const {hour, minute} = getZonedParts(midpoint, timeZone);
  const localHour = hour + minute / 60;
  const distanceFromThree = Math.abs(localHour - 3);
  const circularDistance = Math.min(distanceFromThree, 24 - distanceFromThree);
  return Math.round((1 - Math.min(circularDistance, 12) / 12) ** 2 * 100);
}

function getPainLevel(score) {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

function slotToInterval(slot, timeZone) {
  const startDate = getDateParts(slot.date);
  const [startHour, startMinute] = slot.start.split(":").map(Number);
  const [endHour, endMinute] = slot.end.split(":").map(Number);
  const crossesMidnight =
    endHour * 60 + endMinute <= startHour * 60 + startMinute;
  const endDate = getDateParts(slot.date, crossesMidnight ? 1 : 0);

  return {
    start: zonedDateTimeToUtc(
      {...startDate, hour: startHour, minute: startMinute},
      timeZone
    ),
    end: zonedDateTimeToUtc(
      {...endDate, hour: endHour, minute: endMinute},
      timeZone
    )
  };
}

function mergeIntervals(intervals) {
  const sorted = intervals.toSorted((left, right) => left.start - right.start);
  const merged = [];

  sorted.forEach(interval => {
    const previous = merged.at(-1);
    if (previous && interval.start <= previous.end) {
      previous.end = Math.max(previous.end, interval.end);
    } else {
      merged.push({...interval});
    }
  });

  return merged;
}

function intersectIntervals(left, right) {
  const overlaps = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    const start = Math.max(left[leftIndex].start, right[rightIndex].start);
    const end = Math.min(left[leftIndex].end, right[rightIndex].end);

    if (end > start) overlaps.push({start, end});

    if (left[leftIndex].end < right[rightIndex].end) {
      leftIndex += 1;
    } else {
      rightIndex += 1;
    }
  }

  return overlaps;
}

function getCommonIntervals(participants) {
  const participantIntervals = participants.map(participant =>
    mergeIntervals(
      participant.slots.map(slot => slotToInterval(slot, participant.timeZone))
    )
  );

  return participantIntervals.reduce(
    (common, intervals) =>
      common === null ? intervals : intersectIntervals(common, intervals),
    null
  );
}

function useDarkMode() {
  const getInitialTheme = () => {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  };

  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return [isDark, setIsDark];
}

function getPageFromHash() {
  const page = window.location.hash.replace("#/", "") || "home";
  return pages.some(item => item.id === page) ? page : "home";
}

function usePageRouter() {
  const [page, setPage] = useState(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash());
      window.scrollTo({top: 0, behavior: "auto"});
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return page;
}

function timeToMinutes(time) {
  if (time === "24:00") return 24 * 60;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes) {
  const minutesInDay = 24 * 60;
  const normalized =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function calculateCaffeineCurve({
  intakes,
  eliminationHalfLife,
  absorptionHalfLife,
  plotStart,
  plotEnd,
  stepMinutes = 1
}) {
  const ke = Math.log(2) / eliminationHalfLife;
  const ka = Math.log(2) / (absorptionHalfLife / 60);
  const startMinutes = timeToMinutes(plotStart);
  let endMinutes = timeToMinutes(plotEnd);

  if (endMinutes <= startMinutes) endMinutes += 24 * 60;

  const count = Math.floor((endMinutes - startMinutes) / stepMinutes) + 1;
  const times = Array.from(
    {length: count},
    (_, index) => startMinutes + index * stepMinutes
  );
  const body = new Array(count).fill(0);
  let gut = 0;

  const parsedIntakes = intakes.map(intake => {
    let start = timeToMinutes(intake.start);
    let end = timeToMinutes(intake.end);
    if (end <= start) end += 24 * 60;
    const durationHours = (end - start) / 60;
    return {
      start,
      end,
      rate: Number(intake.dose) / durationHours
    };
  });

  for (let index = 1; index < count; index += 1) {
    const previous = times[index - 1];
    const current = times[index];
    const deltaHours = (current - previous) / 60;
    let ingested = 0;

    parsedIntakes.forEach(intake => {
      const overlapStart = Math.max(previous, intake.start);
      const overlapEnd = Math.min(current, intake.end);
      if (overlapEnd > overlapStart) {
        ingested += intake.rate * ((overlapEnd - overlapStart) / 60);
      }
    });

    gut += ingested;
    const absorbed = gut * (1 - Math.exp(-ka * deltaHours));
    gut -= absorbed;
    const remainingFromPreviousBody =
      body[index - 1] * Math.exp(-ke * deltaHours);
    const remainingFromNewAbsorption =
      absorbed * Math.exp((-ke * deltaHours) / 2);
    body[index] = remainingFromPreviousBody + remainingFromNewAbsorption;
  }

  return {times, body};
}

function HeroBackdrop({backdropRef}) {
  return (
    <div
      className="hero-backdrop"
      aria-hidden="true"
      ref={backdropRef}
      style={{backgroundImage: `url(${heroBackgroundUrl})`}}
    >
      <div className="hero-spotlight" />
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 9.5v8" />
      <path d="M6.5 6.5v.1" />
      <path d="M11 17.5v-8" />
      <path d="M11 13c0-2.2 1.1-3.5 3.1-3.5 1.8 0 3.4 1.1 3.4 3.9v4.1" />
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 19c-4 1.2-4-2-5.5-2.4" />
      <path d="M15 21v-3.4c.1-.8-.2-1.4-.6-1.9 2-.2 4.1-1 4.1-4.5 0-1-.4-1.9-1-2.6.1-.3.4-1.3-.1-2.6 0 0-.8-.3-2.7 1a9.5 9.5 0 0 0-5 0C7.8 5.7 7 6 7 6c-.5 1.3-.2 2.3-.1 2.6-.6.7-1 1.6-1 2.6 0 3.5 2.1 4.3 4.1 4.5-.3.3-.6.8-.6 1.5V21" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6.5-5.5 6.5-11a6.5 6.5 0 0 0-13 0c0 5.5 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function PageIntro({eyebrow, title, children}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="page-summary">{children}</p>}
    </div>
  );
}

function ExperimentAccordion({
  index,
  title,
  summary,
  backgroundImage,
  isOpen,
  onToggle,
  children
}) {
  const contentId = `experiment-${index}-content`;

  return (
    <section
      className={isOpen ? "fun-experiment open" : "fun-experiment"}
      style={
        backgroundImage
          ? {"--experiment-bg": `url(${backgroundImage})`}
          : undefined
      }
    >
      <button
        className="experiment-summary"
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className="experiment-index">{index}</span>
        <span>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <span className="experiment-toggle" aria-hidden="true" />
      </button>
      <div
        className="experiment-collapse"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="experiment-collapse-inner">
          <div className="experiment-body" id={contentId}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.25 2" />
    </svg>
  );
}

function TimePicker({value, onChange, label}) {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState("hour");
  const pickerRef = useRef(null);
  const popoverRef = useRef(null);
  const [hour24, minute] = value.split(":").map(Number);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = event => {
      if (
        !pickerRef.current?.contains(event.target) &&
        !popoverRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const setTime = (nextHour, nextMinute, nextPeriod = period) => {
    const normalizedHour = (nextHour % 12) + (nextPeriod === "PM" ? 12 : 0);
    onChange(
      `${String(normalizedHour).padStart(2, "0")}:${String(nextMinute).padStart(
        2,
        "0"
      )}`
    );
  };

  const formatDisplayTime = () =>
    `${hour12}:${String(minute).padStart(2, "0")} ${period}`;

  return (
    <div className="time-picker" ref={pickerRef}>
      <button
        className="time-picker-trigger"
        type="button"
        aria-label={`${label}: ${formatDisplayTime()}`}
        aria-expanded={isOpen}
        onClick={() => {
          setStage("hour");
          setIsOpen(open => !open);
        }}
      >
        <span>{formatDisplayTime()}</span>
        <ClockIcon />
      </button>
      {isOpen
        ? createPortal(
            <div
              className="time-picker-popover"
              role="dialog"
              aria-label={label}
              ref={popoverRef}
            >
              <div className="time-picker-display">
                <button
                  className={stage === "hour" ? "active" : ""}
                  type="button"
                  onClick={() => setStage("hour")}
                >
                  {hour12}
                </button>
                <span>:</span>
                <button
                  className={stage === "minute" ? "active" : ""}
                  type="button"
                  onClick={() => setStage("minute")}
                >
                  {String(minute).padStart(2, "0")}
                </button>
                <div className="period-toggle">
                  {["AM", "PM"].map(item => (
                    <button
                      className={period === item ? "active" : ""}
                      type="button"
                      key={item}
                      onClick={() => setTime(hour12, minute, item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="clock-face">
                {stage === "hour"
                  ? [
                      12,
                      ...Array.from({length: 11}, (_, index) => index + 1)
                    ].map((hour, index) => (
                      <button
                        className={hour12 === hour ? "selected" : ""}
                        type="button"
                        key={hour}
                        style={{"--clock-index": index}}
                        onClick={() => {
                          setTime(hour, minute);
                          setStage("minute");
                        }}
                      >
                        {hour}
                      </button>
                    ))
                  : Array.from({length: 12}, (_, index) => index * 5).map(
                      (nextMinute, index) => (
                        <button
                          className={minute === nextMinute ? "selected" : ""}
                          type="button"
                          key={nextMinute}
                          style={{"--clock-index": index}}
                          onClick={() => {
                            setTime(hour12, nextMinute);
                            setIsOpen(false);
                          }}
                        >
                          {String(nextMinute).padStart(2, "0")}
                        </button>
                      )
                    )}
              </div>
              <p className="time-picker-hint">
                {stage === "hour" ? "Choose an hour" : "Choose minutes"}
              </p>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function HomePage() {
  const backdropRef = useRef(null);
  const spotlightRef = useRef({x: 0, y: 0});
  const spotlightTweenRef = useRef(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return undefined;

    const bounds = backdrop.getBoundingClientRect();
    spotlightRef.current = {x: bounds.width * 0.72, y: bounds.height * 0.42};
    const syncSpotlight = () => {
      backdrop.style.setProperty(
        "--spotlight-x",
        `${spotlightRef.current.x}px`
      );
      backdrop.style.setProperty(
        "--spotlight-y",
        `${spotlightRef.current.y}px`
      );
    };
    syncSpotlight();

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      spotlightTweenRef.current = {
        x: value => {
          spotlightRef.current.x = value;
          syncSpotlight();
        },
        y: value => {
          spotlightRef.current.y = value;
          syncSpotlight();
        }
      };
      return undefined;
    }

    spotlightTweenRef.current = {
      x: gsap.quickTo(spotlightRef.current, "x", {
        duration: 0.65,
        ease: "power3.out",
        onUpdate: syncSpotlight
      }),
      y: gsap.quickTo(spotlightRef.current, "y", {
        duration: 0.65,
        ease: "power3.out",
        onUpdate: syncSpotlight
      })
    };

    return () => {
      spotlightTweenRef.current?.x?.tween?.kill();
      spotlightTweenRef.current?.y?.tween?.kill();
    };
  }, []);

  const moveSpotlight = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    spotlightTweenRef.current?.x(event.clientX - rect.left);
    spotlightTweenRef.current?.y(event.clientY - rect.top);
  };

  return (
    <section className="page hero-page" onPointerMove={moveSpotlight}>
      <HeroBackdrop backdropRef={backdropRef} />
      <div className="hero section-shell">
        <div className="hero-copy">
          <h1>
            <span>Modeling catalytic</span>
            <span>
              <em>interfaces,</em>
            </span>
            <span className="hero-title-tail">
              <span>atom by</span> <span>atom.</span>
            </span>
          </h1>
          <p className="hero-intro">
            Rigorous atomistic simulation of catalytic interfaces, with a focus
            on electrochemical CO₂ reduction, beyond-DFT electronic structure,
            and MLIP-enabled statistical modeling.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/#/research">
              View research <span aria-hidden="true">→</span>
            </a>
            <a className="button secondary" href="/#/about">
              About me
            </a>
          </div>
          <a
            className="hero-publication"
            href="https://doi.org/10.1038/s41929-026-01526-7"
            target="_blank"
            rel="noreferrer"
          >
            Selected publication: Nature Catalysis, 2026
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="page content-page section-shell about-page">
      <PageIntro
        eyebrow="About me"
        title={
          <span className="name-title">
            <span>Seungchang Han</span>
            <span lang="ko">한승창</span>
          </span>
        }
      >
        Ph.D. student at Korea University studying catalytic interfaces through
        rigorous atomistic modeling.
      </PageIntro>
      <div className="about-layout">
        <article className="about-profile">
          <p>
            I try to use simulation as a careful way of reasoning about
            chemistry, not as a substitute for interpretation. My work asks how
            atomistic models can remain physically meaningful when surfaces,
            interfaces, and reaction environments become complex. I am also
            interested in connecting calculations to experimentally relevant
            conditions.
          </p>
          <dl className="profile-details">
            {profileDetails.map(item => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <div className="about-stack">
          <section className="timeline-panel">
            <h2>Education</h2>
            {education.map(item => (
              <article className="timeline-item" key={item.institution}>
                <span>{item.period}</span>
                <h3>{item.institution}</h3>
                <p>{item.degree}</p>
              </article>
            ))}
          </section>

          <section className="timeline-panel">
            <h2>Experience</h2>
            {experience.map(item => (
              <article
                className="timeline-item"
                key={`${item.organization}-${item.role}`}
              >
                <span>{item.period}</span>
                <h3>{item.role}</h3>
                <p>{item.organization}</p>
                <ul>
                  {item.notes.map(note => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="timeline-panel">
            <h2>Awards</h2>
            {awards.map(item => (
              <article className="timeline-item" key={item.title}>
                <span>{item.period}</span>
                <h3>{item.title}</h3>
                <p>{item.event}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}

function ResearchPage() {
  return (
    <section className="page content-page section-shell">
      <PageIntro
        eyebrow="Research"
        title="Catalytic interfaces and atomistic rigor"
      >
        My research centers on electrochemical CO<sub>2</sub> reduction and
        related catalytic interfaces, using electronic-structure theory,
        statistical sampling, and MLIPs to examine what atomistic models can
        reliably explain.
      </PageIntro>
      <div className="research-grid">
        {researchAreas.map(area => (
          <article
            className={
              area.number === "01" ? "research-card featured" : "research-card"
            }
            key={area.number}
          >
            <span className="card-number">{area.number}</span>
            <h2>{area.title}</h2>
            <p>{area.description}</p>
            <ul>
              {area.tags.map(tag => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            {area.toolkit && (
              <ul className="toolkit-tags" aria-label="Toolkit">
                {area.toolkit.map(tool => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
      <div className="research-section">
        <div className="section-heading">
          <p className="eyebrow">Publication</p>
          <h2>Selected work</h2>
        </div>
        <div className="publication-list">
          {publications.map(publication => (
            <a
              className="publication-card"
              key={publication.titleText}
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noreferrer"
            >
              <article>
                <h3 className="publication-title">
                  {publication.title}
                  <span aria-hidden="true">↗</span>
                </h3>
                <p className="publication-authors">{publication.authors}</p>
                <p className="publication-meta">
                  <em>{publication.journal}</em>{" "}
                  <strong>{publication.volume}</strong>, {publication.pages} (
                  {publication.year})
                </p>
                <p className="publication-context">{publication.context}</p>
                <p className="publication-doi">doi: {publication.doi}</p>
              </article>
            </a>
          ))}
        </div>
        <p className="publication-note">†: equally contributed</p>
      </div>
    </section>
  );
}

function CaffeineChart({curves, intakes, eliminationHalfLife, halfLifeRange}) {
  const width = 760;
  const height = 390;
  const padding = {top: 26, right: 18, bottom: 50, left: 50};
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(40, ...curves.upper.map(value => value * 1.12));
  const x = index =>
    padding.left + (index / (curves.times.length - 1)) * plotWidth;
  const y = value => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const linePath = values =>
    values
      .map(
        (value, index) =>
          `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`
      )
      .join(" ");
  const bandPath = `${linePath(curves.upper)} ${curves.lower
    .map(
      (value, reverseIndex) =>
        `L ${x(curves.lower.length - 1 - reverseIndex).toFixed(2)} ${y(
          curves.lower[curves.lower.length - 1 - reverseIndex]
        ).toFixed(2)}`
    )
    .join(" ")} Z`;
  const tickStep = Math.max(1, Math.round(120 / curves.stepMinutes));
  const yTicks = Array.from({length: 5}, (_, index) => (maxValue / 4) * index);

  return (
    <div className="chart-wrap">
      <svg
        className="caffeine-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Estimated caffeine remaining over time"
      >
        {yTicks.map(value => (
          <g key={value}>
            <line
              className="chart-grid"
              x1={padding.left}
              x2={width - padding.right}
              y1={y(value)}
              y2={y(value)}
            />
            <text
              className="chart-label"
              x={padding.left - 12}
              y={y(value) + 4}
              textAnchor="end"
            >
              {Math.round(value)}
            </text>
          </g>
        ))}
        {curves.times.map((time, index) =>
          index % tickStep === 0 ? (
            <text
              className="chart-label"
              x={x(index)}
              y={height - 20}
              textAnchor="middle"
              key={time}
            >
              {formatTime(time)}
            </text>
          ) : null
        )}
        <path className="range-band" d={bandPath} />
        <line
          className="threshold-line"
          x1={padding.left}
          x2={width - padding.right}
          y1={y(20)}
          y2={y(20)}
        />
        <path className="caffeine-line" d={linePath(curves.main)} />
        {intakes.map(intake => {
          const start = timeToMinutes(intake.start);
          const index = Math.max(
            0,
            Math.min(
              curves.times.length - 1,
              Math.round((start - curves.times[0]) / curves.stepMinutes)
            )
          );
          return (
            <circle
              className="intake-marker"
              cx={x(index)}
              cy={y(curves.main[index])}
              r="5"
              key={intake.id}
            />
          );
        })}
        <text
          className="axis-title"
          transform={`translate(18 ${height / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          Estimated active caffeine remaining (mg)
        </text>
      </svg>
      <div className="chart-legend">
        <span className="legend-line">
          {Number(eliminationHalfLife).toFixed(1)} h half-life
        </span>
        <span className="legend-band">
          {(Number(eliminationHalfLife) - Number(halfLifeRange)).toFixed(1)}–
          {(Number(eliminationHalfLife) + Number(halfLifeRange)).toFixed(1)} h
          range
        </span>
        <span className="legend-threshold">20 mg reference</span>
      </div>
    </div>
  );
}

function MeetingPlanner() {
  const initialMeeting = useMemo(
    () =>
      getMeetingDataFromUrl() ?? {
        version: 2,
        participants: []
      },
    []
  );
  const localTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const initialTimeZone = useMemo(
    () => getSavedMeetingTimeZone(localTimeZone),
    [localTimeZone]
  );
  const [meeting, setMeeting] = useState(initialMeeting);
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [displayTimeZone, setDisplayTimeZone] = useState(localTimeZone);
  const [slots, setSlots] = useState([
    {id: 1, date: getNextMonday(), start: "09:00", end: "17:00"}
  ]);
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [copyState, setCopyState] = useState("Copy updated link");

  const commonIntervals = useMemo(
    () => getCommonIntervals(meeting.participants) ?? [],
    [meeting]
  );

  const participantTimeZones = useMemo(
    () => [
      ...new Set(
        meeting.participants
          .map(participant => participant.timeZone)
          .filter(isValidTimeZone)
      )
    ],
    [meeting.participants]
  );

  useEffect(() => {
    if (participantTimeZones.length === 0) {
      setDisplayTimeZone(localTimeZone);
      return;
    }
    if (!participantTimeZones.includes(displayTimeZone)) {
      setDisplayTimeZone(participantTimeZones[0]);
    }
  }, [displayTimeZone, localTimeZone, participantTimeZones]);

  useEffect(() => {
    try {
      window.localStorage.setItem("meeting-time-zone", timeZone);
    } catch {
      // Ignore private browsing storage failures.
    }
  }, [timeZone]);

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    const encoded = encodeMeetingData(meeting);
    if (encoded.length <= MAX_MEETING_PAYLOAD_LENGTH) {
      url.searchParams.set("meeting", encoded);
    } else {
      url.searchParams.delete("meeting");
    }
    url.hash = "/fun";
    return url.toString();
  }, [meeting]);

  const updateSlot = (id, field, value) => {
    setSlots(current =>
      current.map(slot => (slot.id === id ? {...slot, [field]: value} : slot))
    );
  };

  const addSlot = () => {
    if (slots.length >= MAX_MEETING_SLOTS_PER_PERSON) return;
    setSlots(current => [
      ...current,
      {
        id: Date.now(),
        date: current.at(-1)?.date ?? getNextMonday(),
        start: "09:00",
        end: "17:00"
      }
    ]);
  };

  const addAvailability = event => {
    event.preventDefault();
    const trimmedName = name.trim().slice(0, MAX_MEETING_NAME_LENGTH);
    if (!trimmedName || slots.length === 0 || !isValidTimeZone(timeZone))
      return;
    if (
      !editingParticipantId &&
      meeting.participants.length >= MAX_MEETING_PARTICIPANTS
    ) {
      return;
    }
    const normalizedSlots = slots.map(normalizeMeetingSlot).filter(Boolean);
    if (normalizedSlots.length !== slots.length) return;

    const participant = {
      id:
        editingParticipantId ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      timeZone,
      slots: normalizedSlots
    };

    setMeeting(current => ({
      ...current,
      participants: editingParticipantId
        ? current.participants.map(item =>
            item.id === editingParticipantId ? participant : item
          )
        : current.participants.length < MAX_MEETING_PARTICIPANTS
          ? [...current.participants, participant]
          : current.participants
    }));
    setName("");
    setEditingParticipantId(null);
    setSlots([
      {
        id: Date.now(),
        date: getNextMonday(),
        start: "09:00",
        end: "17:00"
      }
    ]);
    setCopyState("Copy updated link");
  };

  const editParticipant = participant => {
    setEditingParticipantId(participant.id);
    setName(participant.name);
    setTimeZone(participant.timeZone);
    setSlots(
      participant.slots.map((slot, index) => ({
        ...slot,
        id: `${participant.id}-${index}`
      }))
    );
    document
      .querySelector(".availability-form")
      ?.scrollIntoView({behavior: "smooth", block: "start"});
  };

  const deleteParticipant = participantId => {
    setMeeting(current => ({
      ...current,
      participants: current.participants.filter(
        participant => participant.id !== participantId
      )
    }));
    if (editingParticipantId === participantId) cancelEditing();
    setCopyState("Copy updated link");
  };

  const cancelEditing = () => {
    setEditingParticipantId(null);
    setName("");
    setTimeZone(initialTimeZone);
    setSlots([
      {
        id: Date.now(),
        date: getNextMonday(),
        start: "09:00",
        end: "17:00"
      }
    ]);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("Link copied");
    } catch {
      window.prompt("Copy this meeting link", shareUrl);
    }
  };

  const clearMeeting = () => {
    setMeeting({
      version: 2,
      participants: []
    });
    cancelEditing();
    clearMeetingDataFromUrl();
    setCopyState("Copy updated link");
  };

  const formatInterval = interval => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: displayTimeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    return `${formatter.format(interval.start)} – ${formatter.format(
      interval.end
    )}`;
  };

  const bestIntervals = useMemo(() => {
    if (commonIntervals.length === 0) return [];
    const longestDuration = Math.max(
      ...commonIntervals.map(interval => interval.end - interval.start)
    );
    return commonIntervals.filter(
      interval => interval.end - interval.start === longestDuration
    );
  }, [commonIntervals]);

  const getParticipantPainScores = interval =>
    meeting.participants.map(participant => {
      const score = getPainScore(interval, participant.timeZone);
      return {
        id: participant.id,
        name: participant.name,
        score,
        level: getPainLevel(score)
      };
    });

  return (
    <>
      <p className="experiment-description">
        Add available dates and times in your own time zone, then send the
        updated URL. Each person adds another layer; daylight-saving changes are
        calculated from the selected date and time zone.
      </p>

      <div className="meeting-share-bar">
        <p>Times are shown in each viewer&apos;s local time.</p>
        <div className="meeting-share-actions">
          <button
            className="button primary compact-button"
            type="button"
            onClick={copyShareLink}
          >
            {copyState}
          </button>
          <button className="text-button" type="button" onClick={clearMeeting}>
            Start new
          </button>
        </div>
      </div>

      <div className="meeting-layout">
        <form className="availability-form" onSubmit={addAvailability}>
          <div className="control-heading">
            <div>
              <p className="eyebrow">Your availability</p>
              <h2>
                {editingParticipantId ? "Edit your times" : "Add your times"}
              </h2>
            </div>
            <button className="add-button" type="button" onClick={addSlot}>
              + Time
            </button>
          </div>

          <div className="identity-fields">
            <label>
              Name
              <input
                type="text"
                value={name}
                maxLength={MAX_MEETING_NAME_LENGTH}
                placeholder="Your name"
                required
                onChange={event => setName(event.target.value)}
              />
            </label>
            <label>
              Time zone
              <TimeZoneCombobox
                value={timeZone}
                onChange={setTimeZone}
                options={supportedTimeZones}
              />
            </label>
          </div>

          <div className="availability-list">
            {slots.map((slot, index) => (
              <div className="availability-row" key={slot.id}>
                <label>
                  Day
                  <input
                    type="date"
                    value={slot.date}
                    required
                    onChange={event =>
                      updateSlot(slot.id, "date", event.target.value)
                    }
                  />
                  <span className="selected-date">
                    {formatCalendarDate(slot.date)}
                  </span>
                </label>
                <label>
                  From
                  <TimePicker
                    label={`${formatCalendarDate(slot.date)} from`}
                    value={slot.start}
                    onChange={value => updateSlot(slot.id, "start", value)}
                  />
                </label>
                <label>
                  To
                  <TimePicker
                    label={`${formatCalendarDate(slot.date)} to`}
                    value={slot.end}
                    onChange={value => updateSlot(slot.id, "end", value)}
                  />
                </label>
                {slots.length > 1 && (
                  <button
                    className="remove-button"
                    type="button"
                    aria-label={`Remove availability ${index + 1}`}
                    onClick={() =>
                      setSlots(current =>
                        current.filter(item => item.id !== slot.id)
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="availability-submit-actions">
            <button
              className="button primary submit-availability"
              type="submit"
            >
              {editingParticipantId
                ? "Save updated availability"
                : "Add availability to link"}
            </button>
            {editingParticipantId ? (
              <button
                className="text-button"
                type="button"
                onClick={cancelEditing}
              >
                Cancel editing
              </button>
            ) : null}
          </div>
        </form>

        <div className="meeting-results">
          <div className="meeting-result-section">
            <div className="meeting-section-heading">
              <div>
                <p className="eyebrow">Best overlap</p>
                <h2>Times everyone can make</h2>
              </div>
              <span>{displayTimeZone.replaceAll("_", " ")}</span>
            </div>
            {participantTimeZones.length > 0 ? (
              <div className="timezone-toggle" aria-label="Display time zone">
                {participantTimeZones.map(zone => (
                  <button
                    className={zone === displayTimeZone ? "active" : ""}
                    type="button"
                    key={zone}
                    onClick={() => setDisplayTimeZone(zone)}
                  >
                    {zone.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            ) : null}
            {meeting.participants.length < 2 ? (
              <p className="empty-meeting-state">
                Add at least two people to calculate shared availability.
              </p>
            ) : bestIntervals.length > 0 ? (
              <ol className="overlap-list">
                {bestIntervals.map(interval => {
                  const painScores = getParticipantPainScores(interval);
                  return (
                    <li key={`${interval.start}-${interval.end}`}>
                      <div className="overlap-summary">
                        <strong>{formatInterval(interval)}</strong>
                        <span>
                          {Math.round((interval.end - interval.start) / 60000)}{" "}
                          min
                        </span>
                      </div>
                      <div
                        className="pain-meter-list"
                        aria-label="Participant pain scores"
                      >
                        {painScores.map(item => (
                          <div className="pain-meter" key={item.id}>
                            <span>{item.name}</span>
                            <div className="pain-track" aria-hidden="true">
                              <span
                                className={`pain-fill ${item.level}`}
                                style={{"--pain-score": `${item.score}%`}}
                              />
                            </div>
                            <strong>{item.score}</strong>
                          </div>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="empty-meeting-state">
                No common time yet. Add more options or adjust the week.
              </p>
            )}
          </div>

          <div className="meeting-result-section participant-section">
            <div className="meeting-section-heading">
              <div>
                <p className="eyebrow">Responses</p>
                <h2>{meeting.participants.length} people added</h2>
              </div>
            </div>
            {meeting.participants.length > 0 ? (
              <ul className="participant-list">
                {meeting.participants.map(participant => (
                  <li key={participant.id}>
                    <button
                      className={
                        participant.id === editingParticipantId
                          ? "participant-button active"
                          : "participant-button"
                      }
                      type="button"
                      onClick={() => editParticipant(participant)}
                    >
                      <div>
                        <strong>{participant.name}</strong>
                        <span>{participant.timeZone.replaceAll("_", " ")}</span>
                      </div>
                      <span>
                        {participant.slots.length} time
                        {participant.slots.length === 1 ? "" : "s"} · Edit
                      </span>
                    </button>
                    <button
                      className="participant-delete"
                      type="button"
                      aria-label={`Delete ${participant.name}`}
                      onClick={() => deleteParticipant(participant.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-meeting-state">
                No responses yet. Add yours to create the first shareable link.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EnergyEquivalentsTool() {
  const [energyValue, setEnergyValue] = useState("1");
  const [energyUnit, setEnergyUnit] = useState("eV");
  const [energyTemperature, setEnergyTemperature] = useState("298.15");

  const converted = useMemo(
    () =>
      convertEnergyValues(
        parseNumber(energyValue),
        energyUnit,
        Math.max(parseNumber(energyTemperature, 298.15), 1e-9)
      ),
    [energyValue, energyUnit, energyTemperature]
  );

  return (
    <>
      <p className="experiment-description">
        Browser version of the strict energy conversion section in{" "}
        <code>user-input/energy_tool_thermo_added.py</code>. Constants follow
        NIST/CODATA 2022 values, with the thermochemical calorie definition used
        for kcal. Use this as a calculation aid for checking scale and units; do
        not cite these browser outputs directly in literature.
      </p>
      <SourceCodeNote />
      <div className="energy-equivalent-layout">
        <form
          className="control-panel energy-input-panel"
          onSubmit={event => event.preventDefault()}
        >
          <div className="control-heading">
            <div>
              <p className="eyebrow">Unit converter</p>
              <h2>Energy equivalents</h2>
            </div>
          </div>
          <div className="tool-input-grid">
            <label>
              Value
              <input
                type="number"
                value={energyValue}
                onChange={event => setEnergyValue(event.target.value)}
              />
            </label>
            <label>
              Unit
              <select
                value={energyUnit}
                onChange={event => setEnergyUnit(event.target.value)}
              >
                {energyUnits.map(unit => (
                  <option value={unit} key={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Temperature for E/kBT
              <input
                type="number"
                min="1"
                value={energyTemperature}
                onChange={event => setEnergyTemperature(event.target.value)}
              />
            </label>
          </div>
          {converted.note ? (
            <p className="model-note">{converted.note}</p>
          ) : null}
          <div className="constant-source-panel">
            <h3>Conversion constants</h3>
            {conversionSources.map(source => (
              <p key={source}>{source}</p>
            ))}
          </div>
        </form>

        <div className="energy-card-grid">
          {converted.rows.map(([label, value]) => (
            <article className="energy-value-card" key={label}>
              <span>{label}</span>
              <strong>{formatScientific(value)}</strong>
              <p>{energyOutputMeta[label]}</p>
            </article>
          ))}
        </div>

        <section className="boltzmann-panel">
          <div>
            <p className="eyebrow">Two-state Boltzmann interpretation</p>
            <h2>N and p values</h2>
          </div>
          <p>
            These values only make sense when the converted energy is
            interpreted as an energy gap Delta E = E_high - E_low between two
            states with equal degeneracy. N_high/N_low is the population ratio.
            p_low and p_high are the normalized fractions of the lower and
            higher state.
          </p>
          <p>
            Treat this panel as a sanity check for assumptions, not as a
            publishable statistical-mechanics model. Degeneracy, activity,
            coverage, and ensemble choice must be handled explicitly in any
            serious analysis.
          </p>
          <div className="boltzmann-grid">
            {converted.boltzmann.map(([label, value]) => (
              <div className="energy-value-card compact" key={label}>
                <span>{label}</span>
                <strong>{formatScientific(value)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SourceCodeNote() {
  return (
    <p className="experiment-description source-link-note">
      <a
        href="https://github.com/seungchanghan/seungchanghan.github.io/blob/main/user-input/energy_tool_thermo_added.py"
        target="_blank"
        rel="noreferrer"
      >
        View the original Python script ↗
      </a>
    </p>
  );
}

function EquationBlock({children}) {
  return <div className="equation-block">{children}</div>;
}

function RedheadTool() {
  const [redheadTp, setRedheadTp] = useState("500");
  const [redheadBeta, setRedheadBeta] = useState("1");
  const [redheadBetaUnit, setRedheadBetaUnit] = useState("K/s");
  const [redheadNu, setRedheadNu] = useState("");

  const redhead = useMemo(
    () =>
      calculateRedhead({
        peakTemperature: redheadTp,
        heatingRate: redheadBeta,
        betaUnit: redheadBetaUnit,
        prefactor: redheadNu
      }),
    [redheadTp, redheadBeta, redheadBetaUnit, redheadNu]
  );

  return (
    <>
      <p className="experiment-description">
        First-order Redhead TPD estimate from{" "}
        <code>user-input/energy_tool_thermo_added.py</code>. The browser version
        keeps the same constants, units, default prefactor, and 3.64 analytical
        approximation. This is for exploratory interpretation only; do not
        report it as a literature-grade desorption barrier without independent
        kinetic validation.
      </p>
      <SourceCodeNote />
      <div className="energy-equivalent-layout redhead-layout">
        <form
          className="control-panel energy-input-panel"
          onSubmit={event => event.preventDefault()}
        >
          <div className="control-heading">
            <div>
              <p className="eyebrow">TPD analysis</p>
              <h2>First-order desorption energy</h2>
            </div>
          </div>
          <div className="tool-input-grid">
            <label>
              Peak T (K)
              <input
                type="number"
                min="1"
                value={redheadTp}
                onChange={event => setRedheadTp(event.target.value)}
              />
            </label>
            <label>
              Heating rate
              <input
                type="number"
                min="0.000001"
                step="any"
                value={redheadBeta}
                onChange={event => setRedheadBeta(event.target.value)}
              />
            </label>
            <label>
              beta unit
              <select
                value={redheadBetaUnit}
                onChange={event => setRedheadBetaUnit(event.target.value)}
              >
                <option value="K/s">K/s</option>
                <option value="K/min">K/min</option>
              </select>
            </label>
            <label>
              nu (s^-1)
              <input
                type="number"
                placeholder="kB Tp / h"
                value={redheadNu}
                onChange={event => setRedheadNu(event.target.value)}
              />
            </label>
          </div>

          <EquationBlock>
            <span className="equation-title">
              First-order peak approximation
            </span>
            <span className="equation-line">
              E<sub>des</sub> = R T<sub>p</sub>
              <span className="bracket">
                ln
                <span className="fraction">
                  <span>
                    nu T<sub>p</sub>
                  </span>
                  <span>beta</span>
                </span>
                - 3.64
              </span>
            </span>
            <span className="equation-line muted">
              default: nu = k<sub>B</sub>T<sub>p</sub> / h
            </span>
          </EquationBlock>
        </form>

        <section className="results-panel">
          <div className="energy-card-grid">
            {redhead.rows.map(([label, value]) => (
              <div className="energy-value-card" key={label}>
                <span>{label}</span>
                <strong>{formatScientific(value)}</strong>
              </div>
            ))}
          </div>
          <section className="educational-note">
            <h3>How to read this estimate</h3>
            <p>
              The calculation converts beta to K s^-1, evaluates the peak
              condition ln(nu Tp / beta), and returns one desorption barrier in
              several units. The value is sensitive to the prefactor because nu
              appears inside the logarithm.
            </p>
            <p>
              If nu is blank, the page uses nu = kB Tp / h at the peak
              temperature. The 3.64 constant is the standard Redhead analytical
              approximation. Use full kinetic fitting when coverage dependence,
              readsorption, transport limitation, or non-first-order kinetics
              are relevant.
            </p>
            <p>
              This estimate is appropriate for comparing rough magnitudes or
              checking whether a TPD assignment is plausible. It should not be
              used as a final cited value unless the first-order assumptions and
              prefactor choice are justified elsewhere.
            </p>
            {redhead.notes.map(note => (
              <p key={note}>{note}</p>
            ))}
          </section>
        </section>
      </div>
    </>
  );
}

function ThermochemistryTool() {
  const [thermoMode, setThermoMode] = useState("harmonic");
  const [thermoFrequencies, setThermoFrequencies] =
    useState("500 800 1200 1600");
  const [thermoUnit, setThermoUnit] = useState("cm^-1");
  const [thermoTemperature, setThermoTemperature] = useState("298.15");
  const [thermoPressure, setThermoPressure] = useState("101325");
  const [symmetryNumber, setSymmetryNumber] = useState(1);
  const [molecularMass, setMolecularMass] = useState("28.0101");
  const [geometry, setGeometry] = useState("linear");
  const [rotationalTemperatures, setRotationalTemperatures] = useState("2.77");
  const [spin, setSpin] = useState("0");

  const thermo = useMemo(
    () =>
      calculateThermochemistry({
        mode: thermoMode,
        frequencies: thermoFrequencies,
        unit: thermoUnit,
        temperature: Math.max(parseNumber(thermoTemperature, 298.15), 1e-9),
        pressure: parseNumber(thermoPressure, 101325),
        symmetryNumber: Number(symmetryNumber),
        molecularMass: parseNumber(molecularMass, 28.0101),
        geometry,
        rotationalTemperatures,
        spin: parseNumber(spin, 0)
      }),
    [
      thermoMode,
      thermoFrequencies,
      thermoUnit,
      thermoTemperature,
      thermoPressure,
      symmetryNumber,
      molecularMass,
      geometry,
      rotationalTemperatures,
      spin
    ]
  );

  return (
    <>
      <p className="experiment-description">
        Browser thermochemistry correction helper aligned with{" "}
        <code>user-input/energy_tool_thermo_added.py</code>. Harmonic mode gives
        the adsorbate E {"->"} F correction. Ideal-gas mode gives E {"->"} G and
        exposes the extra translational/rotational inputs that the ASE ideal-gas
        model needs. Use these values to audit corrections and inputs; cite the
        underlying thermochemistry method, not this page output.
      </p>
      <SourceCodeNote />
      <div className="thermo-tool-grid">
        <form
          className="control-panel thermo-input-panel"
          onSubmit={event => event.preventDefault()}
        >
          <div className="control-heading">
            <div>
              <p className="eyebrow">Thermochemistry</p>
              <h2>
                {thermoMode === "harmonic" ? "E -> F" : "E -> G"} correction
              </h2>
            </div>
          </div>
          <div className="mode-switch" aria-label="Thermochemistry mode">
            <button
              type="button"
              className={thermoMode === "harmonic" ? "active" : ""}
              onClick={() => setThermoMode("harmonic")}
            >
              Harmonic adsorbate
            </button>
            <button
              type="button"
              className={thermoMode === "ideal_gas" ? "active" : ""}
              onClick={() => setThermoMode("ideal_gas")}
            >
              Ideal gas
            </button>
          </div>
          <label className="frequency-field">
            Frequencies
            <textarea
              value={thermoFrequencies}
              onChange={event => setThermoFrequencies(event.target.value)}
            />
          </label>
          <div className="tool-input-grid">
            <label>
              Unit
              <select
                value={thermoUnit}
                onChange={event => setThermoUnit(event.target.value)}
              >
                <option value="cm^-1">cm^-1</option>
                <option value="THz">THz</option>
                <option value="Hz">Hz</option>
              </select>
            </label>
            <label>
              T (K)
              <input
                type="number"
                min="1"
                value={thermoTemperature}
                onChange={event => setThermoTemperature(event.target.value)}
              />
            </label>
          </div>
          {thermoMode === "ideal_gas" && (
            <div className="ideal-gas-fields">
              <div className="tool-input-grid three">
                <label>
                  Pressure (Pa)
                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={thermoPressure}
                    onChange={event => setThermoPressure(event.target.value)}
                  />
                </label>
                <label>
                  Mass (g mol^-1)
                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={molecularMass}
                    onChange={event => setMolecularMass(event.target.value)}
                  />
                </label>
                <label>
                  Geometry
                  <select
                    value={geometry}
                    onChange={event => {
                      const nextGeometry = event.target.value;
                      setGeometry(nextGeometry);
                      setRotationalTemperatures(current => {
                        const values = parseNumberList(current);
                        if (nextGeometry === "nonlinear" && values.length < 3) {
                          const theta = values[0] || 2.77;
                          return `${theta} ${theta} ${theta}`;
                        }
                        if (nextGeometry === "linear" && values.length !== 1) {
                          return String(values[0] || 2.77);
                        }
                        return current;
                      });
                    }}
                  >
                    <option value="monatomic">monatomic</option>
                    <option value="linear">linear</option>
                    <option value="nonlinear">nonlinear</option>
                  </select>
                </label>
              </div>
              <div
                className={
                  geometry === "monatomic"
                    ? "tool-input-grid one"
                    : "tool-input-grid three"
                }
              >
                {geometry !== "monatomic" ? (
                  <label>
                    Rot. temp. (K)
                    <input
                      type="text"
                      value={rotationalTemperatures}
                      onChange={event =>
                        setRotationalTemperatures(event.target.value)
                      }
                      placeholder={
                        geometry === "nonlinear"
                          ? "thetaA thetaB thetaC"
                          : "theta"
                      }
                    />
                  </label>
                ) : null}
                {geometry !== "monatomic" ? (
                  <label>
                    Symmetry
                    <select
                      value={symmetryNumber}
                      onChange={event => setSymmetryNumber(event.target.value)}
                    >
                      {symmetryOptions.map(option => (
                        <option value={option.value} key={option.label}>
                          {option.label} / sigma={option.value}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label>
                  Spin S
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={spin}
                    onChange={event => setSpin(event.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
          <EquationBlock>
            {thermoMode === "harmonic" ? (
              <>
                <span className="equation-title">Harmonic adsorbate</span>
                <span className="equation-line">
                  Delta F = ZPE + U<sub>thermal,vib</sub> - T S<sub>vib</sub>
                </span>
                <span className="equation-line muted">
                  Total F correction includes ZPE; thermal F excludes ZPE.
                </span>
              </>
            ) : (
              <>
                <span className="equation-title">Ideal gas</span>
                <span className="equation-line">
                  Delta G = ZPE + H<sub>thermal</sub> - T S<sub>total</sub>
                </span>
                <span className="equation-line muted">
                  sigma lowers rotational entropy, adding kBT ln sigma to G.
                </span>
              </>
            )}
            <span className="equation-line muted">
              epsilon<sub>i</sub> = h c nu-tilde<sub>i</sub>
            </span>
          </EquationBlock>
        </form>

        <section className="results-panel">
          <div className="thermo-result-grid">
            <div className="energy-value-card compact">
              <span>Modes used</span>
              <strong>{thermo.modeCount}</strong>
            </div>
            {thermo.rows.map(([label, value]) => (
              <div className="energy-value-card compact" key={label}>
                <span>{label}</span>
                <strong>{formatScientific(value)}</strong>
              </div>
            ))}
          </div>
          <section className="educational-note">
            <h3>Calculation notes</h3>
            {thermo.notes.map(note => (
              <p key={note}>{note}</p>
            ))}
            <p>
              Based on{" "}
              <a
                href="https://ase-lib.org/ase/thermochemistry/thermochemistry.html"
                target="_blank"
                rel="noreferrer"
              >
                ASE thermochemistry
              </a>
              ; potential energy is treated as 0 eV so displayed values are
              corrections relative to electronic energy.
            </p>
          </section>
        </section>
      </div>
    </>
  );
}

function ForFunPage() {
  const hasSharedMeeting = useMemo(() => Boolean(getMeetingDataFromUrl()), []);
  const [openExperiment, setOpenExperiment] = useState(
    hasSharedMeeting ? "02" : "01"
  );
  const [intakes, setIntakes] = useState(defaultIntakes);
  const [eliminationHalfLife, setEliminationHalfLife] = useState(6);
  const [halfLifeRange, setHalfLifeRange] = useState(1);
  const [absorptionHalfLife, setAbsorptionHalfLife] = useState(30);
  const [plotStart, setPlotStart] = useState("06:00");
  const [plotEnd, setPlotEnd] = useState("24:00");
  const effectiveHalfLifeRange = Math.min(
    Number(halfLifeRange),
    Number(eliminationHalfLife) - 0.5
  );

  const validIntakes = intakes.filter(
    intake =>
      intake.start &&
      intake.end &&
      Number(intake.dose) > 0 &&
      intake.start !== intake.end
  );

  const curves = useMemo(() => {
    const settings = {
      intakes: validIntakes,
      absorptionHalfLife: Number(absorptionHalfLife),
      plotStart,
      plotEnd,
      stepMinutes: 1
    };
    const main = calculateCaffeineCurve({
      ...settings,
      eliminationHalfLife: Number(eliminationHalfLife)
    });
    const lowerHalfLife = Math.max(
      0.5,
      Number(eliminationHalfLife) - effectiveHalfLifeRange
    );
    const upperHalfLife = Number(eliminationHalfLife) + effectiveHalfLifeRange;
    const lowerSensitivity = calculateCaffeineCurve({
      ...settings,
      eliminationHalfLife: lowerHalfLife
    });
    const upperSensitivity = calculateCaffeineCurve({
      ...settings,
      eliminationHalfLife: upperHalfLife
    });

    return {
      times: main.times,
      main: main.body,
      lower: lowerSensitivity.body.map((value, index) =>
        Math.min(value, upperSensitivity.body[index])
      ),
      upper: lowerSensitivity.body.map((value, index) =>
        Math.max(value, upperSensitivity.body[index])
      ),
      stepMinutes: 1
    };
  }, [
    validIntakes,
    eliminationHalfLife,
    effectiveHalfLifeRange,
    absorptionHalfLife,
    plotStart,
    plotEnd
  ]);

  const peakValue = Math.max(...curves.main);
  const peakIndex = curves.main.indexOf(peakValue);
  const finalValue = curves.main.at(-1);

  const updateIntake = (id, field, value) => {
    setIntakes(current =>
      current.map(intake =>
        intake.id === id ? {...intake, [field]: value} : intake
      )
    );
  };

  const addIntake = () => {
    setIntakes(current => [
      ...current,
      {
        id: Date.now(),
        start: "14:00",
        end: "14:30",
        dose: 60
      }
    ]);
  };

  const resetCaffeineInputs = () => {
    setIntakes(defaultIntakes.map(intake => ({...intake})));
    setEliminationHalfLife(6);
    setHalfLifeRange(1);
    setAbsorptionHalfLife(30);
    setPlotStart("06:00");
    setPlotEnd("24:00");
  };

  const toggleExperiment = experimentId => {
    clearMeetingDataFromUrl();
    setOpenExperiment(current =>
      current === experimentId ? null : experimentId
    );
  };

  return (
    <section className="page fun-page section-shell">
      <PageIntro eyebrow="For fun" title="Side calculations">
        Interactive tools and side projects built from questions I wanted to
        explore. Open an experiment to try it.
      </PageIntro>

      <div className="experiment-list">
        <ExperimentAccordion
          index="01"
          title="Caffeine curve"
          summary="Estimate active caffeine remaining throughout the day"
          backgroundImage={funBgCoffeeUrl}
          isOpen={openExperiment === "01"}
          onToggle={() => toggleExperiment("01")}
        >
          <p className="experiment-description">
            A browser version of the two-compartment model in{" "}
            <code>user-input/caffe.py</code>. Add what you drank and the
            visualization updates instantly.
          </p>

          <div className="simulator-layout">
            <form
              className="control-panel"
              onSubmit={event => event.preventDefault()}
            >
              <div className="control-heading">
                <div>
                  <p className="eyebrow">Your inputs</p>
                  <h2>Caffeine intake</h2>
                </div>
                <button
                  className="add-button"
                  type="button"
                  onClick={addIntake}
                >
                  + Add
                </button>
                <button
                  className="reset-button"
                  type="button"
                  onClick={resetCaffeineInputs}
                >
                  Reset
                </button>
              </div>

              <div className="intake-list">
                {intakes.map((intake, index) => (
                  <fieldset className="intake-row" key={intake.id}>
                    <legend>Intake {index + 1}</legend>
                    <label>
                      Start
                      <input
                        type="time"
                        value={intake.start}
                        onChange={event =>
                          updateIntake(intake.id, "start", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      End
                      <input
                        type="time"
                        value={intake.end}
                        onChange={event =>
                          updateIntake(intake.id, "end", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Dose (mg)
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={intake.dose}
                        onChange={event =>
                          updateIntake(intake.id, "dose", event.target.value)
                        }
                      />
                    </label>
                    {intakes.length > 1 && (
                      <button
                        className="remove-button"
                        type="button"
                        aria-label={`Remove intake ${index + 1}`}
                        onClick={() =>
                          setIntakes(current =>
                            current.filter(item => item.id !== intake.id)
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </fieldset>
                ))}
              </div>

              <div className="model-controls">
                <label>
                  Elimination half-life
                  <span>{eliminationHalfLife} h</span>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    step="0.5"
                    value={eliminationHalfLife}
                    onChange={event => {
                      const nextHalfLife = Number(event.target.value);
                      setEliminationHalfLife(nextHalfLife);
                      setHalfLifeRange(current =>
                        Math.min(Number(current), nextHalfLife - 0.5)
                      );
                    }}
                  />
                </label>
                <label>
                  Absorption half-life
                  <span>{absorptionHalfLife} min</span>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={absorptionHalfLife}
                    onChange={event =>
                      setAbsorptionHalfLife(event.target.value)
                    }
                  />
                </label>
                <label>
                  Half-life sensitivity range
                  <span>±{effectiveHalfLifeRange} h</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, Number(eliminationHalfLife) - 0.5)}
                    step="0.5"
                    value={halfLifeRange}
                    onChange={event => setHalfLifeRange(event.target.value)}
                  />
                </label>
                <div className="time-window">
                  <label>
                    Chart starts
                    <input
                      type="time"
                      value={plotStart}
                      onChange={event => setPlotStart(event.target.value)}
                    />
                  </label>
                  <label>
                    Chart ends
                    <input
                      type="time"
                      value={plotEnd === "24:00" ? "00:00" : plotEnd}
                      onChange={event =>
                        setPlotEnd(
                          event.target.value === "00:00"
                            ? "24:00"
                            : event.target.value
                        )
                      }
                    />
                  </label>
                </div>
              </div>
              <p className="model-note">
                Simplified visualization of estimated active caffeine remaining
                in the body (mg). This is not a clinical blood concentration
                (mg/L) estimate. Individual metabolism varies with health,
                medication, pregnancy, genetics, and other factors.
              </p>
            </form>

            <div className="results-panel">
              <div className="result-stats">
                <div>
                  <span>Peak estimate</span>
                  <strong>{peakValue.toFixed(1)} mg</strong>
                </div>
                <div>
                  <span>Peak time</span>
                  <strong>{formatTime(curves.times[peakIndex])}</strong>
                </div>
                <div>
                  <span>At chart end</span>
                  <strong>{finalValue.toFixed(1)} mg</strong>
                </div>
              </div>
              <CaffeineChart
                curves={curves}
                intakes={validIntakes}
                eliminationHalfLife={eliminationHalfLife}
                halfLifeRange={effectiveHalfLifeRange}
              />
              <div className="model-explanation">
                <p>
                  <strong>Model:</strong> gut → active body compartment →
                  eliminated
                </p>
                <p>
                  Dose enters the gut evenly between each start and end time,
                  then follows first-order absorption and elimination kinetics.
                  Newly absorbed caffeine receives a midpoint elimination
                  correction for each timestep.{" "}
                  <a
                    href="https://github.com/seungchanghan/seungchanghan.github.io/blob/main/user-input/caffe.py"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View the original Python script ↗
                  </a>
                </p>
              </div>
            </div>
          </div>
        </ExperimentAccordion>

        <ExperimentAccordion
          index="02"
          title="Across time"
          summary="Plan meetings across time zones"
          backgroundImage={funBgTimeUrl}
          isOpen={openExperiment === "02"}
          onToggle={() => toggleExperiment("02")}
        >
          <MeetingPlanner />
        </ExperimentAccordion>

        <ExperimentAccordion
          index="03"
          title="Energy equivalents"
          summary="Convert energy and spectral units"
          backgroundImage={funBgEquivalentsUrl}
          isOpen={openExperiment === "03"}
          onToggle={() => toggleExperiment("03")}
        >
          <EnergyEquivalentsTool />
        </ExperimentAccordion>

        <ExperimentAccordion
          index="04"
          title="Redhead TPD analysis"
          summary="Estimate desorption energy"
          backgroundImage={funBgTpdUrl}
          isOpen={openExperiment === "04"}
          onToggle={() => toggleExperiment("04")}
        >
          <RedheadTool />
        </ExperimentAccordion>

        <ExperimentAccordion
          index="05"
          title="Thermochemistry"
          summary="Calculate E to F or G corrections"
          backgroundImage={funBgThermoUrl}
          isOpen={openExperiment === "05"}
          onToggle={() => toggleExperiment("05")}
        >
          <ThermochemistryTool />
        </ExperimentAccordion>
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section
      className="page contact-page"
      style={{"--contact-bg": `url(${contactBackgroundUrl})`}}
    >
      <div className="section-shell contact-inner">
        <PageIntro eyebrow="Contact" title="Let's talk research.">
          Open to conversations about computational catalysis, machine learning
          potentials, and atomistic materials modeling.
        </PageIntro>
        <div className="contact-card">
          <p>
            For research conversations, collaborations, or current work, choose
            a route below.
          </p>
          <div className="contact-grid" aria-label="Contact links">
            <a
              className="contact-link"
              href={`mailto:${profileLinks.email}`}
              aria-label="Send email"
            >
              <MailIcon />
              <span>Academic mail</span>
            </a>
            <a
              className="contact-link"
              href={profileLinks.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="Open professional profile"
            >
              <LinkedInIcon />
              <span>Professional profile</span>
            </a>
            <a
              className="contact-link"
              href={profileLinks.github}
              target="_blank"
              rel="noreferrer"
              aria-label="Open code profile"
            >
              <GitHubIcon />
              <span>Code archive</span>
            </a>
          </div>
          <div className="contact-location">
            <LocationIcon />
            <span>{contactLocation}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const pageComponents = {
  home: HomePage,
  about: AboutPage,
  research: ResearchPage,
  fun: ForFunPage,
  contact: ContactPage
};

function App() {
  const [isDark, setIsDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLogoCollapsed, setIsLogoCollapsed] = useState(false);
  const logoRef = useRef(null);
  const fullLogoRef = useRef(null);
  const menuButtonRef = useRef(null);
  const mainRef = useRef(null);
  const hasMountedRef = useRef(false);
  const page = usePageRouter();
  const CurrentPage = pageComponents[page];

  useEffect(() => {
    document.title =
      page === "home"
        ? "Seungchang Han | Computational Materials Research"
        : `${pages.find(item => item.id === page)?.label} | Seungchang Han`;

    if (hasMountedRef.current) {
      mainRef.current?.focus({preventScroll: true});
    } else {
      hasMountedRef.current = true;
    }
  }, [page]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = event => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const syncLogoState = () => {
      setIsLogoCollapsed(window.scrollY > window.innerHeight * 0.38);
    };

    syncLogoState();
    window.addEventListener("scroll", syncLogoState, {passive: true});
    return () => window.removeEventListener("scroll", syncLogoState);
  }, []);

  useLayoutEffect(() => {
    const logo = logoRef.current;
    const fullLogo = fullLogoRef.current;
    if (!logo || !fullLogo) return undefined;

    const syncExpandedWidth = () => {
      logo.style.setProperty(
        "--logo-expanded-width",
        `${Math.ceil(fullLogo.getBoundingClientRect().width)}px`
      );
    };

    syncExpandedWidth();
    const resizeObserver = new ResizeObserver(syncExpandedWidth);
    resizeObserver.observe(fullLogo);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a
          ref={logoRef}
          className={isLogoCollapsed ? "logo collapsed" : "logo"}
          href="/#/home"
          onClick={() => setMenuOpen(false)}
          aria-label="Seungchang Han"
        >
          <span ref={fullLogoRef} className="logo-full" aria-hidden="true">
            Seungchang Han
          </span>
          <span className="logo-short" aria-hidden="true">
            SH
          </span>
        </a>
        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-controls="site-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
        </button>
        <nav
          id="site-navigation"
          className={menuOpen ? "site-nav open" : "site-nav"}
          aria-label="Primary navigation"
        >
          {pages.map(item => (
            <a
              className={page === item.id ? "active" : ""}
              href={`/#/${item.id}`}
              onClick={() => setMenuOpen(false)}
              aria-current={page === item.id ? "page" : undefined}
              key={item.id}
            >
              {item.label}
            </a>
          ))}
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            onClick={() => setIsDark(dark => !dark)}
          >
            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
          </button>
        </nav>
      </header>

      <main
        id="main-content"
        className="page-stage"
        ref={mainRef}
        tabIndex="-1"
      >
        <CurrentPage key={page} />
      </main>

      <footer>
        <span>© {new Date().getFullYear()} Seungchang Han</span>
        <span className="footer-affiliation">
          Affiliated Research Group:{" "}
          <a href="https://www.ringelab.com/" target="_blank" rel="noreferrer">
            ringelab.com
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
