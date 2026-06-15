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
          <a className="button primary" href="#/research">
            View research <span aria-hidden="true">→</span>
          </a>
          <a className="button secondary" href="#/fun">
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

function ForFunPage() {
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

  return (
    <section className="page fun-page section-shell">
      <PageIntro eyebrow="For Fun" title="Small experiments">
        Interactive tools and side projects built from questions I wanted to
        explore. Open an experiment to try it.
      </PageIntro>

      <details className="fun-experiment" open>
        <summary>
          <span className="experiment-index">01</span>
          <span>
            <strong>Caffeine curve</strong>
            <small>Estimate active caffeine remaining throughout the day</small>
          </span>
          <span className="experiment-toggle" aria-hidden="true" />
        </summary>

        <div className="experiment-body">
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
        </div>
      </details>
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
        <a className="logo" href="#/home" onClick={() => setMenuOpen(false)}>
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
              href={`#/${item.id}`}
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
          <a href="#/fun">For Fun: caffeine model</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
