import {useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import heroBackgroundUrl from "../user-input/main.png";

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

const contactLocation = "145, Anam-ro, Seongbuk-gu, Seoul, Republic of Korea";

const profileDetails = [
  {
    label: "Role",
    value: "Ph.D. Student in Physical Chemistry and Integrative Data Science"
  },
  {label: "Institution", value: "Korea University"},
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
    period: "January 2024",
    title: "Excellent Poster Presentation Award",
    event: "2024 KIM-CMS Winter Symposium"
  },
  {
    period: "January 2025",
    title: "Excellent Poster Award",
    event: "2025 KU BK21 Chem Fair"
  }
];

const researchAreas = [
  {
    number: "01",
    title: (
      <>
        CO<sub>2</sub> reduction on copper
      </>
    ),
    description:
      "Copper surfaces, interfacial structure, and selectivity in electrochemical conversion.",
    tags: ["Electrocatalysis", "Interfaces"]
  },
  {
    number: "02",
    title: "Machine-learned interatomic potentials",
    description:
      "Models that carry first-principles accuracy into larger and longer atomistic simulations.",
    tags: ["Active learning", "MLIP"]
  },
  {
    number: "03",
    title: "Atomistic materials modeling",
    description:
      "Adsorption, reconstruction, solvation, and defects as microscopic drivers of performance.",
    tags: ["DFT", "Thermodynamics"]
  }
];

const methodToolkit = [
  {
    name: "Density functional theory",
    description:
      "Electronic-structure calculations for adsorption and reaction energetics."
  },
  {
    name: "Atomistic simulation",
    description:
      "Molecular dynamics and statistical sampling for dynamic interfaces."
  },
  {
    name: "Machine learning potentials",
    description:
      "Data-driven interatomic models for realistic length and time scales."
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
    doi: "10.1038/s41929-026-01526-7"
  }
];

const defaultIntakes = [{id: 1, start: "07:00", end: "07:10", dose: 180}];
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
      ![1, 2].includes(parsed?.version) ||
      !Array.isArray(parsed.participants)
    ) {
      return null;
    }
    if (parsed.version === 2) return parsed;
    if (typeof parsed.weekStart !== "string") return null;

    return {
      version: 2,
      participants: parsed.participants.map(participant => ({
        ...participant,
        slots: participant.slots.map(slot => ({
          date: offsetDate(parsed.weekStart, Number(slot.day)),
          start: slot.start,
          end: slot.end
        }))
      }))
    };
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

  const moveSpotlight = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    backdropRef.current?.style.setProperty(
      "--spotlight-x",
      `${event.clientX - rect.left}px`
    );
    backdropRef.current?.style.setProperty(
      "--spotlight-y",
      `${event.clientY - rect.top}px`
    );
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
            I build computational pictures of electrochemical CO₂ reduction,
            from electronic structure to machine-learned dynamics.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/#/research">
              View research <span aria-hidden="true">→</span>
            </a>
            <a className="button secondary" href="/#/about">
              About me
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="page content-page section-shell">
      <PageIntro eyebrow="About me" title="Seungchang Han">
        Ph.D. student at Korea University focused on computational chemistry for
        catalytic interfaces.
      </PageIntro>
      <div className="about-layout">
        <article className="about-profile">
          <p>
            I work with first-principles calculations, molecular simulation, and
            machine-learned potentials, with a practical interest in teaching
            and reusable scientific tools.
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
      <PageIntro eyebrow="Research" title="Catalysis, models, and scale">
        A compact view of the questions, tools, and papers behind my current
        work.
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
      <div className="research-section">
        <div className="section-heading">
          <p className="eyebrow">Methods</p>
          <h2>Computational toolkit</h2>
        </div>
        <div className="methods-grid">
          {methodToolkit.map((method, index) => (
            <article className="method-card" key={method.name}>
              <span className="card-number">0{index + 1}</span>
              <h2>{method.name}</h2>
              <p>{method.description}</p>
            </article>
          ))}
        </div>
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
        version: 2,
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
    {id: 1, date: getNextMonday(), start: "09:00", end: "17:00"}
  ]);
  const [editingParticipantId, setEditingParticipantId] = useState(null);
  const [copyState, setCopyState] = useState("Copy updated link");

  const commonIntervals = useMemo(
    () => getCommonIntervals(meeting.participants) ?? [],
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
        date: current.at(-1)?.date ?? getNextMonday(),
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
      slots: slots.map(({date, start, end}) => ({date, start, end}))
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

  const cancelEditing = () => {
    setEditingParticipantId(null);
    setName("");
    setTimeZone(localTimeZone);
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

  const bestIntervals = useMemo(() => {
    if (commonIntervals.length === 0) return [];
    const longestDuration = Math.max(
      ...commonIntervals.map(interval => interval.end - interval.start)
    );
    return commonIntervals.filter(
      interval => interval.end - interval.start === longestDuration
    );
  }, [commonIntervals]);

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
              <span>{localTimeZone.replaceAll("_", " ")}</span>
            </div>
            {meeting.participants.length < 2 ? (
              <p className="empty-meeting-state">
                Add at least two people to calculate shared availability.
              </p>
            ) : bestIntervals.length > 0 ? (
              <ol className="overlap-list">
                {bestIntervals.map(interval => (
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
      <PageIntro eyebrow="For fun" title="Small experiments">
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
          For research conversations, collaborations, or current work, choose a
          route below.
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
      </footer>
    </div>
  );
}

export default App;
