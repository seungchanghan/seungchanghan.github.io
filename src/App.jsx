import {useEffect, useMemo, useRef, useState} from "react";

const pages = [
  {id: "home", label: "Home"},
  {id: "research", label: "Research"},
  {id: "methods", label: "Methods"},
  {id: "fun", label: "For Fun"},
  {id: "contact", label: "Contact"}
];

const researchAreas = [
  {
    number: "01",
    title: "CO₂ reduction on copper",
    description:
      "Understanding how copper surface structure and the electrode-electrolyte environment shape reaction pathways and product selectivity.",
    tags: ["Electrocatalysis", "Surface science"]
  },
  {
    number: "02",
    title: "Machine-learned interatomic potentials",
    description:
      "Building accurate atomistic models that extend first-principles fidelity to larger systems and longer simulation times.",
    tags: ["Active learning", "Molecular dynamics"]
  },
  {
    number: "03",
    title: "Atomistic materials modeling",
    description:
      "Studying adsorption, reconstruction, solvation, and defects to connect microscopic surface chemistry with materials performance.",
    tags: ["DFT", "Interfaces", "Thermodynamics"]
  }
];

const methods = [
  {
    name: "Density functional theory",
    description:
      "Electronic-structure calculations for adsorption, reaction energetics, and catalytic interfaces.",
    level: 92
  },
  {
    name: "Atomistic simulation",
    description:
      "Molecular dynamics and statistical sampling for dynamic surface and solvent environments.",
    level: 86
  },
  {
    name: "Machine learning potentials",
    description:
      "Data-driven interatomic models that extend first-principles accuracy to realistic scales.",
    level: 80
  }
];

const defaultIntakes = [{id: 1, start: "07:00", end: "07:10", dose: 180}];
const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
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

function decodeMeetingData(value) {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (
      parsed?.version !== 1 ||
      typeof parsed.weekStart !== "string" ||
      !Array.isArray(parsed.participants)
    ) {
      return null;
    }
    return parsed;
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

function formatWeekDay(weekStart, dayOffset) {
  const {year, month, day} = getDateParts(weekStart, dayOffset);
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

function getDateParts(weekStart, dayOffset) {
  const [year, month, day] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function slotToInterval(slot, weekStart, timeZone) {
  const startDate = getDateParts(weekStart, Number(slot.day));
  const [startHour, startMinute] = slot.start.split(":").map(Number);
  const [endHour, endMinute] = slot.end.split(":").map(Number);
  const crossesMidnight =
    endHour * 60 + endMinute <= startHour * 60 + startMinute;
  const endDate = getDateParts(
    weekStart,
    Number(slot.day) + (crossesMidnight ? 1 : 0)
  );

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

function getCommonIntervals(participants, weekStart) {
  const participantIntervals = participants.map(participant =>
    mergeIntervals(
      participant.slots.map(slot =>
        slotToInterval(slot, weekStart, participant.timeZone)
      )
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

function AtomVisual() {
  const visualRef = useRef(null);

  const handlePointerMove = event => {
    const visual = visualRef.current;
    if (!visual) return;

    const bounds = visual.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    visual.style.setProperty("--electron-x", `${x * 34}px`);
    visual.style.setProperty("--electron-y", `${y * 34}px`);
    visual.style.setProperty("--electron-x-reverse", `${x * -25}px`);
    visual.style.setProperty("--electron-y-reverse", `${y * -25}px`);
    visual.style.setProperty("--nucleus-x", `${x * 4}px`);
    visual.style.setProperty("--nucleus-y", `${y * 4}px`);
    visual.style.setProperty("--electron-third-x", `${x * 20}px`);
    visual.style.setProperty("--electron-third-y", `${y * -19}px`);
    visual.style.setProperty("--tilt-x", `${y * -5}deg`);
    visual.style.setProperty("--tilt-y", `${x * 7}deg`);
    visual.style.setProperty("--glow-x", `${(x + 0.5) * 100}%`);
    visual.style.setProperty("--glow-y", `${(y + 0.5) * 100}%`);
  };

  const resetPointer = () => {
    const visual = visualRef.current;
    if (!visual) return;

    [
      "--electron-x",
      "--electron-y",
      "--electron-x-reverse",
      "--electron-y-reverse",
      "--nucleus-x",
      "--nucleus-y",
      "--electron-third-x",
      "--electron-third-y"
    ].forEach(property => visual.style.setProperty(property, "0px"));
    visual.style.setProperty("--tilt-x", "0deg");
    visual.style.setProperty("--tilt-y", "0deg");
    visual.style.setProperty("--glow-x", "50%");
    visual.style.setProperty("--glow-y", "42%");
  };

  return (
    <div
      className="atom-visual"
      ref={visualRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-label="Interactive abstract atomistic interface illustration"
    >
      <div className="atom-scene">
        <div className="orbital orbital-one" />
        <div className="orbital orbital-two" />
        <div className="orbital orbital-three" />
        <span className="atom atom-center" />
        <span className="atom atom-one" />
        <span className="atom atom-two" />
        <span className="atom atom-three" />
        <div className="surface-grid" />
      </div>
      <span className="interaction-hint">Move your cursor</span>
    </div>
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
  isOpen,
  onToggle,
  children
}) {
  const contentId = `experiment-${index}-content`;

  return (
    <section className={isOpen ? "fun-experiment open" : "fun-experiment"}>
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
  const [hour24, minute] = value.split(":").map(Number);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = event => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
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
      {isOpen ? (
        <div className="time-picker-popover" role="dialog" aria-label={label}>
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
              ? Array.from({length: 12}, (_, index) => index + 1).map(
                  (hour, index) => (
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
                  )
                )
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
        </div>
      ) : null}
    </div>
  );
}

function HomePage() {
  return (
    <section className="page hero section-shell">
      <div className="hero-copy">
        <p className="eyebrow">Ph.D. Student · Materials Science</p>
        <h1>
          Computational insight into catalytic <em>interfaces.</em>
        </h1>
        <p className="hero-intro">
          I study electrochemical CO₂ reduction on copper using first-principles
          calculations and machine-learned interatomic potentials.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="/#/research">
            View research <span aria-hidden="true">→</span>
          </a>
          <a className="button secondary" href="/#/fun">
            Try caffeine model <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <AtomVisual />
    </section>
  );
}

function ResearchPage() {
  return (
    <section className="page content-page section-shell">
      <PageIntro eyebrow="Research" title="What I work on">
        Connecting electronic-structure calculations with atomistic machine
        learning to study catalytic environments at realistic scales.
      </PageIntro>
      <div className="research-grid">
        {researchAreas.map(area => (
          <article className="research-card" key={area.number}>
            <span className="card-number">{area.number}</span>
            <h2>{area.title}</h2>
            <p>{area.description}</p>
            <ul>
              {area.tags.map(tag => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function MethodsPage() {
  return (
    <section className="page content-page section-shell">
      <PageIntro eyebrow="Methods" title="Computational toolkit">
        Complementary methods bridge electronic accuracy, dynamic sampling, and
        experimentally relevant length and time scales.
      </PageIntro>
      <div className="methods-grid">
        {methods.map((method, index) => (
          <article className="method-card" key={method.name}>
            <span className="card-number">0{index + 1}</span>
            <h2>{method.name}</h2>
            <p>{method.description}</p>
            <div className="method-scale">
              <span style={{width: `${method.level}%`}} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CaffeineChart({curves, intakes, eliminationHalfLife, halfLifeRange}) {
  const width = 960;
  const height = 430;
  const padding = {top: 28, right: 24, bottom: 54, left: 64};
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
  const tickStep = Math.max(1, Math.round(60 / curves.stepMinutes));
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
        version: 1,
        weekStart: getNextMonday(),
        participants: []
      },
    []
  );
  const localTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [meeting, setMeeting] = useState(initialMeeting);
  const [name, setName] = useState("");
  const [timeZone, setTimeZone] = useState(localTimeZone);
  const [slots, setSlots] = useState([
    {id: 1, day: 0, start: "09:00", end: "17:00"}
  ]);
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [copyState, setCopyState] = useState("Copy updated link");

  const commonIntervals = useMemo(
    () => getCommonIntervals(meeting.participants, meeting.weekStart) ?? [],
    [meeting]
  );

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("meeting", encodeMeetingData(meeting));
    url.hash = "/fun";
    return url.toString();
  }, [meeting]);

  const updateSlot = (id, field, value) => {
    setSlots(current =>
      current.map(slot => (slot.id === id ? {...slot, [field]: value} : slot))
    );
  };

  const addSlot = () => {
    setSlots(current => [
      ...current,
      {
        id: Date.now(),
        day: current.at(-1)?.day ?? 0,
        start: "09:00",
        end: "17:00"
      }
    ]);
  };

  const addAvailability = event => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || slots.length === 0) return;

    const participant = {
      id:
        editingParticipantId ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      timeZone,
      slots: slots.map(({day, start, end}) => ({day, start, end}))
    };

    setMeeting(current => ({
      ...current,
      participants: editingParticipantId
        ? current.participants.map(item =>
            item.id === editingParticipantId ? participant : item
          )
        : [...current.participants, participant]
    }));
    setName("");
    setEditingParticipantId(null);
    setSlots([{id: Date.now(), day: 0, start: "09:00", end: "17:00"}]);
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

  const cancelEditing = () => {
    setEditingParticipantId(null);
    setName("");
    setTimeZone(localTimeZone);
    setSlots([{id: Date.now(), day: 0, start: "09:00", end: "17:00"}]);
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
      version: 1,
      weekStart: getNextMonday(),
      participants: []
    });
    cancelEditing();
    clearMeetingDataFromUrl();
    setCopyState("Copy updated link");
  };

  const formatInterval = interval => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: localTimeZone,
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

  return (
    <>
      <p className="experiment-description">
        Choose a meeting week, add your available times in your own time zone,
        then send the updated URL. Each person adds another layer; common times
        are shown in the viewer&apos;s local time.
      </p>

      <div className="meeting-toolbar">
        <label>
          Meeting week
          <input
            type="date"
            value={meeting.weekStart}
            onChange={event =>
              setMeeting(current => ({
                ...current,
                weekStart: event.target.value
              }))
            }
          />
        </label>
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
                placeholder="Your name"
                required
                onChange={event => setName(event.target.value)}
              />
            </label>
            <label>
              Time zone
              <select
                value={timeZone}
                onChange={event => setTimeZone(event.target.value)}
              >
                {!supportedTimeZones.includes(timeZone) && (
                  <option value={timeZone}>{timeZone}</option>
                )}
                {supportedTimeZones.map(zone => (
                  <option value={zone} key={zone}>
                    {zone.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="availability-list">
            {slots.map((slot, index) => (
              <div className="availability-row" key={slot.id}>
                <label>
                  Day
                  <select
                    value={slot.day}
                    onChange={event =>
                      updateSlot(slot.id, "day", Number(event.target.value))
                    }
                  >
                    {weekDays.map((day, dayIndex) => (
                      <option value={dayIndex} key={day}>
                        {formatWeekDay(meeting.weekStart, dayIndex)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  From
                  <TimePicker
                    label={`${formatWeekDay(meeting.weekStart, slot.day)} from`}
                    value={slot.start}
                    onChange={value => updateSlot(slot.id, "start", value)}
                  />
                </label>
                <label>
                  To
                  <TimePicker
                    label={`${formatWeekDay(meeting.weekStart, slot.day)} to`}
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
              <span>{localTimeZone.replaceAll("_", " ")}</span>
            </div>
            {meeting.participants.length < 2 ? (
              <p className="empty-meeting-state">
                Add at least two people to calculate shared availability.
              </p>
            ) : commonIntervals.length > 0 ? (
              <ol className="overlap-list">
                {commonIntervals.map(interval => (
                  <li key={`${interval.start}-${interval.end}`}>
                    <strong>{formatInterval(interval)}</strong>
                    <span>
                      {Math.round((interval.end - interval.start) / 60000)} min
                    </span>
                  </li>
                ))}
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

function ForFunPage() {
  const hasSharedMeeting = useMemo(() => Boolean(getMeetingDataFromUrl()), []);
  const [openExperiment, setOpenExperiment] = useState(
    hasSharedMeeting ? "02" : null
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

  const toggleExperiment = experimentId => {
    clearMeetingDataFromUrl();
    setOpenExperiment(current =>
      current === experimentId ? null : experimentId
    );
  };

  return (
    <section className="page fun-page section-shell">
      <PageIntro eyebrow="For Fun" title="Small experiments">
        Interactive tools and side projects built from questions I wanted to
        explore. Open an experiment to try it.
      </PageIntro>

      <div className="experiment-list">
        <ExperimentAccordion
          index="01"
          title="Caffeine curve"
          summary="Estimate active caffeine remaining throughout the day"
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
          summary="Find a meeting time across time zones and share it by URL"
          isOpen={openExperiment === "02"}
          onToggle={() => toggleExperiment("02")}
        >
          <MeetingPlanner />
        </ExperimentAccordion>
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="page contact-page section-shell">
      <PageIntro eyebrow="Contact" title="Let's talk research.">
        Open to conversations about computational catalysis, machine learning
        potentials, and atomistic materials modeling.
      </PageIntro>
      <div className="contact-card">
        <p>
          The easiest way to find my current work and get in touch is through
          GitHub.
        </p>
        <a
          className="contact-link"
          href="https://github.com/seungchanghan"
          target="_blank"
          rel="noreferrer"
        >
          Connect on GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}

const pageComponents = {
  home: HomePage,
  research: ResearchPage,
  methods: MethodsPage,
  fun: ForFunPage,
  contact: ContactPage
};

function App() {
  const [isDark, setIsDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = usePageRouter();
  const CurrentPage = pageComponents[page];

  useEffect(() => {
    document.title =
      page === "home"
        ? "Seungchang Han | Computational Materials Research"
        : `${pages.find(item => item.id === page)?.label} | Seungchang Han`;
  }, [page]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="logo" href="/#/home" onClick={() => setMenuOpen(false)}>
          Seungchang Han
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "site-nav open" : "site-nav"}>
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

      <main className="page-stage">
        <CurrentPage />
      </main>

      <footer>
        <span>© {new Date().getFullYear()} Seungchang Han</span>
        <span>
          <a href="/#/fun">For Fun: experiments</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
